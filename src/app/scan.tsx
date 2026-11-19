import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Button, EmptyState } from '../components/ui';
import { parseBoxLink } from '../lib/qr';
import { getBoxes } from '../lib/store';
import { colors } from '../lib/theme';

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [problem, setProblem] = useState<string | undefined>();
  const handled = useRef(false);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <EmptyState icon="camera-outline" title="Camera access needed" body="Allow the camera so you can scan the QR code on a box." />
        {permission.canAskAgain ? (
          <Button label="Allow camera" onPress={requestPermission} />
        ) : (
          <Button label="Open settings" onPress={() => Linking.openSettings()} />
        )}
      </View>
    );
  }

  const onScanned = ({ data }: { data: string }) => {
    if (handled.current) return;
    handled.current = true;
    const id = parseBoxLink(data);
    if (id && getBoxes().some((b) => b.id === id)) {
      router.replace(`/box/${id}`);
    } else {
      setProblem(
        id
          ? "That box isn't on this device. It may have been deleted, or it was created on another phone."
          : "That isn't a What's in the Box QR code.",
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={problem ? undefined : onScanned}
      />
      <View style={styles.overlay}>
        {problem ? (
          <View style={styles.panel}>
            <Text style={styles.panelText}>{problem}</Text>
            <Button
              label="Scan again"
              onPress={() => {
                handled.current = false;
                setProblem(undefined);
              }}
            />
          </View>
        ) : (
          <>
            <View style={styles.frame} />
            <Text style={styles.hint}>Point the camera at a box's QR code</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, padding: 24, justifyContent: 'center', gap: 8, maxWidth: 560, width: '100%', alignSelf: 'center' },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'box-none', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
  frame: { width: 240, height: 240, borderRadius: 24, borderWidth: 4, borderColor: '#fff' },
  hint: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  panel: { backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 14, maxWidth: 360 },
  panelText: { fontSize: 16, color: colors.text, textAlign: 'center', lineHeight: 22 },
});
