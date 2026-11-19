import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { readPhotoBase64, writePhotoBase64 } from './photos';
import { getBoxes, referencedPhotos, saveBoxes } from './store';
import type { Box } from './types';

type BackupFile = {
  app: 'whatsinthebox';
  version: 1;
  exportedAt: string;
  boxes: Box[];
  /** Photo files keyed by their stored filename, base64 encoded. */
  photos: Record<string, string>;
};

/** Writes every box and photo into one JSON file and opens the share sheet. */
export async function exportBackup(): Promise<number> {
  const boxes = getBoxes();
  const photos: Record<string, string> = {};
  for (const ref of referencedPhotos(boxes)) {
    const data = await readPhotoBase64(ref);
    if (data) photos[ref] = data;
  }
  const backup: BackupFile = {
    app: 'whatsinthebox',
    version: 1,
    exportedAt: new Date().toISOString(),
    boxes,
    photos,
  };
  const json = JSON.stringify(backup);
  const filename = `whatsinthebox-backup-${backup.exportedAt.slice(0, 10)}.json`;

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    const file = new File(Paths.cache, filename);
    if (file.exists) file.delete();
    file.create();
    await file.write(json);
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save backup' });
  }
  return boxes.length;
}

/**
 * Lets the user pick a backup file and merges it in. Boxes with the same id
 * are replaced by the backup's copy; other boxes are left alone.
 * Returns the number of boxes restored, or undefined if cancelled.
 */
export async function importBackup(): Promise<number | undefined> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets[0]) return undefined;
  const asset = picked.assets[0];

  const text =
    Platform.OS === 'web'
      ? await (asset.file ? asset.file.text() : (await fetch(asset.uri)).text())
      : await new File(asset.uri).text();

  let backup: BackupFile;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a What's in the Box backup.");
  }
  if (backup?.app !== 'whatsinthebox' || !Array.isArray(backup.boxes)) {
    throw new Error("That file isn't a What's in the Box backup.");
  }

  const photos = backup.photos ?? {};
  // The web has no photo folder, so photos are kept inline there.
  const resolve = (ref: string | undefined) =>
    ref && Platform.OS === 'web' && photos[ref] ? `data:image/jpeg;base64,${photos[ref]}` : ref;

  if (Platform.OS !== 'web') {
    for (const [ref, data] of Object.entries(photos)) await writePhotoBase64(ref, data);
  }

  const boxes: Box[] = backup.boxes
    .filter((b) => b && typeof b.id === 'string' && typeof b.name === 'string')
    .map((b) => ({
      ...b,
      location: b.location ?? '',
      photo: resolve(b.photo),
      items: (Array.isArray(b.items) ? b.items : []).map((i) => ({ ...i, photo: resolve(i.photo) })),
    }));
  await saveBoxes(boxes);
  return boxes.length;
}
