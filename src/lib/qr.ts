import qrcode from 'qrcode-generator';

const SCHEME = 'whatsinthebox://box/';

/** The text encoded in a box's QR code. It is also a deep link into the app. */
export function boxLink(boxId: string): string {
  return SCHEME + boxId;
}

/** Returns the box id from scanned QR text, or undefined if it isn't one of ours. */
export function parseBoxLink(text: string): string | undefined {
  const match = /^whatsinthebox:\/\/box\/([A-Za-z0-9_-]+)/.exec(text.trim());
  return match?.[1];
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
