import * as Print from 'expo-print';
import { Platform } from 'react-native';

import { boxLink, formatCode, qrSvg } from './qr';
import type { Box } from './types';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

/** How many labels fit across the page. Fewer across means bigger labels. */
export type LabelsAcross = 1 | 2 | 3 | 4;

// Text sizes in points for each layout, so labels stay readable as they shrink.
const SIZES: Record<LabelsAcross, { code: number; name: number; location: number; qr: string }> = {
  1: { code: 30, name: 28, location: 16, qr: '75mm' },
  2: { code: 20, name: 16, location: 11, qr: '100%' },
  3: { code: 15, name: 12, location: 9, qr: '100%' },
  4: { code: 12, name: 10, location: 8, qr: '100%' },
};

function labelsHtml(boxes: Box[], across: LabelsAcross): string {
  const size = SIZES[across];
  const labels = boxes
    .map(
      (box) => `<div class="label">
  ${qrSvg(boxLink(box.code))}
  <div class="code">${esc(formatCode(box.code))}</div>
  <div class="name">${esc(box.name)}</div>
  ${box.location ? `<div class="location">${esc(box.location)}</div>` : ''}
</div>`,
    )
    .join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><title>Box labels</title>
<style>
  @page { margin: 10mm; }
  body { margin: 0; font-family: -apple-system, Helvetica, Arial, sans-serif; color: #000; }
  .sheet { display: grid; grid-template-columns: ${across === 1 ? 'minmax(0, 110mm)' : `repeat(${across}, 1fr)`}; justify-content: center; gap: 4mm; }
  /* The dashed border doubles as a cutting guide. */
  .label { border: 1px dashed #888; border-radius: 3mm; padding: 3mm; text-align: center; break-inside: avoid; page-break-inside: avoid; overflow-wrap: anywhere; }
  .label svg { display: block; margin: 0 auto; width: ${size.qr}; height: auto; }
  .code { font-family: 'Courier New', monospace; font-weight: 700; font-size: ${size.code}pt; letter-spacing: 0.12em; }
  .name { font-weight: 700; font-size: ${size.name}pt; margin-top: 1mm; }
  .location { font-size: ${size.location}pt; margin-top: 0.5mm; }
</style></head><body>
<div class="sheet">
${labels}
</div>
</body></html>`;
}

/**
 * Prints QR labels for the given boxes, laid out in a grid to save paper.
 * Each label has the QR code, the typeable code, the box name and its location.
 */
export async function printLabels(boxes: Box[], across: LabelsAcross = 1): Promise<void> {
  if (!boxes.length) return;
  const html = labelsHtml(boxes, across);
  if (Platform.OS === 'web') {
    const win = window.open('', '_blank');
    if (!win) throw new Error('Allow pop-ups to print labels.');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    return;
  }
  await Print.printAsync({ html });
}
