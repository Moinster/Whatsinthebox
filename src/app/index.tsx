import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/ui';
import { getLastBackupAt } from '../lib/backup';
import { notify } from '../lib/dialog';
import { findBox, useBoxes } from '../lib/store';
import { colors } from '../lib/theme';

export default function Home() {
  const { loaded, boxes } = useBoxes();
  const itemCount = boxes.reduce((n, b) => n + b.items.length, 0);

  // A scanned QR link opens the app here as "/?box=CODE".
  const { box: linkedCode } = useLocalSearchParams<{ box?: string }>();
  useEffect(() => {
    if (!loaded || !linkedCode) return;
    const box = findBox(linkedCode);
    router.setParams({ box: undefined });
    if (box) router.push(`/box/${box.id}`);
    else notify('Box not found', "That box isn't on this device. It may have been deleted, or it was created on another phone.");
  }, [loaded, linkedCode]);

  const [lastBackup, setLastBackup] = useState<number | undefined>();
  useEffect(() => {
    getLastBackupAt().then(setLastBackup, () => {});
  }, [boxes]);
  const backupNote =
    boxes.length === 0
      ? undefined
      : lastBackup === undefined
        ? 'never backed up'
        : boxes.some((b) => b.updatedAt > lastBackup)
          ? 'changes not backed up'
          : 'backed up';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="cube" size={56} color={colors.primary} />
        </View>
        <Text style={styles.title}>{"What's in the Box"}</Text>
        <Text style={styles.subtitle}>
          {!loaded
            ? ' '
            : boxes.length === 0
              ? 'Add your first box to get started.'
              : `${boxes.length} ${boxes.length === 1 ? 'box' : 'boxes'} · ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Add a box" icon="add-circle-outline" onPress={() => router.push('/edit')} style={styles.big} />
        <Button
          label="View my boxes"
          icon="albums-outline"
          variant="secondary"
          onPress={() => router.push('/boxes')}
          style={styles.big}
        />
        <Button
          label="Scan or enter a box code"
          icon="qr-code-outline"
          variant="secondary"
          onPress={() => router.push('/scan')}
          style={styles.big}
        />
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/backup')} style={styles.link}>
        <Ionicons name="cloud-upload-outline" size={18} color={colors.muted} />
        <Text style={styles.linkText}>Backup & restore{backupNote ? ` · ${backupNote}` : ''}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 24, maxWidth: 560, width: '100%', alignSelf: 'center' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.muted, textAlign: 'center' },
  actions: { gap: 12 },
  big: { minHeight: 58 },
  link: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', padding: 18 },
  linkText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
});
