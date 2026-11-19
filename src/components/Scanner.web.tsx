import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../lib/theme';
import type { ScannerProps } from './Scanner';

type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

/** Chrome on Android has a built-in QR reader; other browsers fall back to jsQR. */
function nativeDetector(): Detector | undefined {
  const Ctor = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
  try {
    return Ctor ? new Ctor({ formats: ['qr_code'] }) : undefined;
  } catch {
    return undefined;
  }
}

/** Live camera view that reads QR codes, for browsers. */
export function Scanner({ onScan, paused }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | undefined>();

  // Keep the latest props reachable from the scan loop without restarting the camera.
  const latest = useRef({ onScan, paused });
  useEffect(() => {
    latest.current = { onScan, paused };
  }, [onScan, paused]);

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const detector = nativeDetector();
    const canvas = document.createElement('canvas');

    const read = async (video: HTMLVideoElement): Promise<string | undefined> => {
      if (detector) {
        try {
          return (await detector.detect(video))[0]?.rawValue;
        } catch {
          // Fall through to the JavaScript reader.
        }
      }
      // A smaller frame keeps the JavaScript reader fast on phones.
      const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return jsQR(image.data, image.width, image.height)?.data || undefined;
    };

    const tick = async () => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0 && !latest.current.paused) {
        const text = await read(video).catch(() => undefined);
        if (text && !stopped && !latest.current.paused) latest.current.onScan(text);
      }
      timer = setTimeout(tick, 200);
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser can't use the camera. Type the code from the label instead.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      } catch {
        setError('Camera access was blocked. Allow it in your browser settings, or type the code from the label.');
        return;
      }
      if (stopped) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
      tick();
    })();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (error) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.bg, padding: 24 }]}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <video
        ref={videoRef}
        muted
        playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <View style={styles.frame} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  error: { fontSize: 16, color: colors.text, textAlign: 'center', lineHeight: 22 },
  frame: { width: 220, height: 220, borderRadius: 24, borderWidth: 4, borderColor: '#fff' },
});
