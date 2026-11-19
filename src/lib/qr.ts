import qrcode from 'qrcode-generator';
import { Platform } from 'react-native';

/** Where the web app is hosted. Native builds put this address in their QR codes. */
const HOSTED_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://moinster.github.io/Whatsinthebox';

// No 0/O or 1/I, so a code read off a label can't be mistyped that way.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 6;

export function newCode(taken: Set<string>): string {
  for (;;) {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (!taken.has(code)) return code;
  }
}

/** "K7M4QP" → "K7M-4QP", the way it is printed on the label. */
export function formatCode(code: string): string {
  return code.length === CODE_LENGTH ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

/** Cleans up typed input: any case, with or without the dash or spaces. */
export function normalizeCode(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function appUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin + (process.env.EXPO_BASE_URL ?? '');
  }
  return HOSTED_URL;
}

/** The link encoded in a box's QR code. Any phone camera can open it. */
export function boxLink(code: string): string {
  return `${appUrl().replace(/\/$/, '')}/?box=${code}`;
}

/**
 * Works out which box some scanned or typed text refers to. Accepts a QR link
 * from any address the app has been hosted at, an older app-only link, or the
 * bare code from the label.
 */
export function parseBoxRef(text: string): { code?: string; id?: string } {
  const trimmed = text.trim();
  const legacy = /^whatsinthebox:\/\/box\/([A-Za-z0-9_-]+)/.exec(trimmed);
  if (legacy) return { id: legacy[1] };
  const link = /[?&]box=([A-Za-z0-9-]+)/.exec(trimmed);
  if (link) return { code: normalizeCode(link[1]) };
  if (/^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(trimmed) && normalizeCode(trimmed).length === CODE_LENGTH) {
    return { code: normalizeCode(trimmed) };
  }
  return {};
}

/** Renders text as a standalone QR code SVG document. */
export function qrSvg(text: string, size = 240): string {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const quiet = 4;
  const total = count + quiet * 2;
  let path = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) path += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`
  );
}
