import * as Print from 'expo-print';
import { Platform } from 'react-native';

import { boxLink, formatCode, qrSvg } from './qr';
import type { Box } from './types';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

function labelHtml(box: Box): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(box.name)}</title>
<style>
  @page { margin: 12mm; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; text-align: center; color: #000; }
  .label { display: inline-block; border: 2px solid #000; border-radius: 12px; padding: 20px 28px; }
  .code { font-family: 'Courier New', monospace; font-size: 30px; font-weight: 700; letter-spacing: 4px; }
  h1 { font-size: 28px; margin: 12px 0 4px; }
  p { font-size: 16px; margin: 0; }
  small { display: block; margin-top: 10px; font-size: 11px; color: #555; }
</style></head><body>
<div class="label">
  ${qrSvg(boxLink(box.code), 280)}
  <div class="code">${esc(formatCode(box.code))}</div>
  <h1>${esc(box.name)}</h1>
  ${box.location ? `<p>${esc(box.location)}</p>` : ''}
  <small>Scan the code, or type the letters above into What's in the Box</small>
</div>
</body></html>`;
}

/** Prints a label with the box's QR code, name and location. */
export async function printBoxLabel(box: Box): Promise<void> {
  const html = labelHtml(box);
  if (Platform.OS === 'web') {
    const win = window.open('', '_blank');
    if (!win) throw new Error('Allow pop-ups to print the label.');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    return;
  }
  await Print.printAsync({ html });
}
