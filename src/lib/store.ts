import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { pruneOrphanPhotos } from './photos';
import type { Box } from './types';

/**
 * Local-first box storage. Each box is persisted under its own key so no
 * single record grows large. All reads come from the in-memory copy.
 *
 * This module is the only place that touches persistence, so cloud sync can
 * later be added behind the same functions.
 */
const KEY_PREFIX = 'witb:box:';

type State = { loaded: boolean; boxes: Box[] };

let state: State = { loaded: false, boxes: [] };
const listeners = new Set<() => void>();

function setState(boxes: Box[]) {
  state = { loaded: true, boxes: [...boxes].sort((a, b) => b.updatedAt - a.updatedAt) };
  listeners.forEach((l) => l());
}

let loading: Promise<void> | undefined;

export function loadBoxes(): Promise<void> {
  loading ??= (async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(KEY_PREFIX));
    const rows = keys.length ? await AsyncStorage.multiGet(keys) : [];
    const boxes: Box[] = [];
    for (const [, value] of rows) {
      if (!value) continue;
      try {
        boxes.push(JSON.parse(value));
      } catch {
        // Skip a corrupt record rather than failing the whole load.
      }
    }
    setState(boxes);
    pruneOrphanPhotos(referencedPhotos(boxes));
  })();
  return loading;
}

export function referencedPhotos(boxes: Box[]): Set<string> {
  const refs = new Set<string>();
  for (const box of boxes) {
    if (box.photo) refs.add(box.photo);
    for (const item of box.items) if (item.photo) refs.add(item.photo);
  }
  return refs;
}

export async function saveBox(box: Box): Promise<void> {
  await AsyncStorage.setItem(KEY_PREFIX + box.id, JSON.stringify(box));
  setState([...state.boxes.filter((b) => b.id !== box.id), box]);
}

export async function saveBoxes(boxes: Box[]): Promise<void> {
  if (!boxes.length) return;
  await AsyncStorage.multiSet(boxes.map((b) => [KEY_PREFIX + b.id, JSON.stringify(b)]));
  const ids = new Set(boxes.map((b) => b.id));
  setState([...state.boxes.filter((b) => !ids.has(b.id)), ...boxes]);
}

export async function deleteBox(id: string): Promise<void> {
  await AsyncStorage.removeItem(KEY_PREFIX + id);
  setState(state.boxes.filter((b) => b.id !== id));
}

export function getBoxes(): Box[] {
  return state.boxes;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

export function useBoxes(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useBox(id: string | undefined): { loaded: boolean; box: Box | undefined } {
  const { loaded, boxes } = useBoxes();
  return { loaded, box: id ? boxes.find((b) => b.id === id) : undefined };
}
