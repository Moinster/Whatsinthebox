import * as ImagePicker from 'expo-image-picker';

import { newId } from './types';

/**
 * Web version of the photo store. Photos are kept as image files in the
 * browser's IndexedDB, keyed by filename, the same reference format the
 * native app uses. Older data may hold `data:` URIs, which still display.
 */
const STORE = 'photos';
const MAX_EDGE = 1280;

let opening: Promise<IDBDatabase> | undefined;
/** Display URLs for every stored photo, so lookups can stay synchronous. */
const urls = new Map<string, string>();

function db(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('witb-photos', 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return opening;
}

async function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const req = op(database.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(name: string, blob: Blob) {
  await run('readwrite', (s) => s.put(blob, name));
  const old = urls.get(name);
  if (old) URL.revokeObjectURL(old);
  urls.set(name, URL.createObjectURL(blob));
}

export async function initPhotos(): Promise<void> {
  const [keys, blobs] = await Promise.all([run('readonly', (s) => s.getAllKeys()), run('readonly', (s) => s.getAll())]);
  keys.forEach((key, i) => urls.set(String(key), URL.createObjectURL(blobs[i] as Blob)));
  // Ask the browser not to clear this site's data when storage runs low.
  navigator.storage?.persist?.().catch(() => {});
}

export function photoUri(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  return ref.startsWith('data:') ? ref : urls.get(ref);
}

/** Phone cameras produce multi-megabyte images; shrink them before storing. */
async function shrink(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((out) => (out ? resolve(out) : reject(new Error("Couldn't read that image."))), 'image/jpeg', 0.7),
  );
}

export async function pickPhoto(source: 'camera' | 'library'): Promise<string | undefined> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'] };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return undefined;

  const original = await (await fetch(result.assets[0].uri)).blob();
  const name = `${newId()}.jpg`;
  await put(name, await shrink(original));
  return name;
}

export function pruneOrphanPhotos(referenced: Set<string>) {
  for (const [name, url] of urls) {
    if (referenced.has(name)) continue;
    urls.delete(name);
    URL.revokeObjectURL(url);
    run('readwrite', (s) => s.delete(name)).catch(() => {});
  }
}

export async function readPhotoBase64(ref: string): Promise<string | undefined> {
  if (ref.startsWith('data:')) return undefined;
  const blob = await run<Blob | undefined>('readonly', (s) => s.get(ref));
  if (!blob) return undefined;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function writePhotoBase64(ref: string, base64: string) {
  const blob = await (await fetch(`data:image/jpeg;base64,${base64}`)).blob();
  await put(ref, blob);
}
