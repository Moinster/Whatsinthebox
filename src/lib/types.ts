export type Item = {
  id: string;
  name: string;
  description?: string;
  /** Photo reference — see lib/photos.ts */
  photo?: string;
};

export type Box = {
  id: string;
  name: string;
  location: string;
  /** Photo of the inside of the box — see lib/photos.ts */
  photo?: string;
  items: Item[];
  createdAt: number;
  updatedAt: number;
};

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
