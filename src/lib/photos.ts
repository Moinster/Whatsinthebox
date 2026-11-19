import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { newId } from './types';

/**
 * A photo reference stored on a box or item is either:
 *  - a bare filename inside the app's documents/photos folder (native), or
 *  - a `data:` URI (web, where there is no app file system).
 *
 * Only the filename is stored on native because the absolute path of the
 * documents folder can change between app updates on iOS.
 */
const isInline = (ref: string) => ref.startsWith('data:');

function photosDir(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function photoUri(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  if (isInline(ref) || Platform.OS === 'web') return ref;
  return new File(Paths.document, 'photos', ref).uri;
}

/** Opens the camera or photo library and returns a stored photo reference. */
export async function pickPhoto(source: 'camera' | 'library'): Promise<string | undefined> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.5,
    base64: Platform.OS === 'web',
  };

  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('Camera permission is needed to take a photo.');
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }
  if (result.canceled || !result.assets[0]) return undefined;
  const asset = result.assets[0];

  if (Platform.OS === 'web') {
    if (asset.uri.startsWith('data:')) return asset.uri;
    return asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri;
  }

  const name = `${newId()}.jpg`;
  await new File(asset.uri).copy(new File(photosDir(), name));
  return name;
}

/** Deletes stored photo files that no box or item references any more. */
export function pruneOrphanPhotos(referenced: Set<string>) {
  if (Platform.OS === 'web') return;
  try {
    for (const entry of photosDir().list()) {
      if (entry instanceof File && !referenced.has(entry.name)) entry.delete();
    }
  } catch {
    // Cleanup is best effort.
  }
}

export async function readPhotoBase64(ref: string): Promise<string | undefined> {
  if (isInline(ref) || Platform.OS === 'web') return undefined;
  const file = new File(Paths.document, 'photos', ref);
  return file.exists ? file.base64() : undefined;
}

export async function writePhotoBase64(ref: string, base64: string) {
  if (Platform.OS === 'web') return;
  const file = new File(photosDir(), ref);
  if (!file.exists) file.create({ overwrite: true });
  await file.write(base64, { encoding: 'base64' });
}
