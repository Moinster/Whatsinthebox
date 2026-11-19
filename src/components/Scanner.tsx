import { CameraView, useCameraPermissions } from 'expo-camera';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { colors } from '../lib/theme';
import { Button } from './ui';

export type ScannerProps = {
  /** Called with the text of each QR code seen while not paused. */
  onScan: (text: string) => void;
  paused?: boolean;
};

/** Live camera view that reads QR codes. The web build uses Scanner.web.tsx. */
export function Scanner({ onScan, paused }: ScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View style={styles.fill} />;

  if (!permission.granted) {
    return (
      <View style={[styles.fill, styles.message]}>
        <Text style={styles.messageText}>Allow the camera so you can scan the QR code on a box.</Text>
        {permission.canAskAgain ? (
          <Button label="Allow camera" onPress={requestPermission} />
        ) : (
          <Button label="Open settings" onPress={() => Linking.openSettings()} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={paused ? undefined : ({ data }) => onScan(data)}
      />
      <View style={styles.frame} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  message: { padding: 24, gap: 14, backgroundColor: colors.bg },
  messageText: { fontSize: 16, color: colors.text, textAlign: 'center', lineHeight: 22 },
  frame: { width: 220, height: 220, borderRadius: 24, borderWidth: 4, borderColor: '#fff' },
});
