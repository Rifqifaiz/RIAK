/// <reference lib="webworker" />
import { buildGlobeAssets } from './globeAssets';

/** Web Worker: menggambar peta dunia di OffscreenCanvas agar globe tetap mulus. */
self.onmessage = async (e: MessageEvent<{ texW: number; dotRadius: number }>) => {
  try {
    const a = await buildGlobeAssets(e.data.texW, e.data.dotRadius, (w, h) => new OffscreenCanvas(w, h), true);
    const bitmap = (a.texture as OffscreenCanvas).transferToImageBitmap();
    (self as any).postMessage({ ok: true, bitmap, mask: a.mask, pos: a.pos, col: a.col }, [
      bitmap,
      a.mask.buffer,
      a.pos.buffer,
      a.col.buffer,
    ]);
  } catch (err) {
    (self as any).postMessage({ ok: false, error: String(err) });
  }
};
