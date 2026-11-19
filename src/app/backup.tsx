import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button, Card } from '../components/ui';
import { errorMessage, notify } from '../lib/dialog';
import { exportBackup, importBackup } from '../lib/backup';
import { useBoxes } from '../lib/store';
import { colors } from '../lib/theme';

export default function Backup() {
  const { boxes } = useBoxes();
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>, failTitle: string) => {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      notify(failTitle, errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onExport = () => run(async () => void (await exportBackup()), "Couldn't create the backup");

  const onImport = () =>
    run(async () => {
      const count = await importBackup();
      if (count !== undefined) notify('Backup restored', `${count} ${count === 1 ? 'box' : 'boxes'} restored.`);
    }, "Couldn't restore the backup");

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.title}>Back up</Text>
        <Text style={styles.body}>
          Your boxes are stored on this device. A backup saves all {boxes.length} of them, with photos, into one file you
          can keep in iCloud Drive, Google Drive, email, or anywhere else.
        </Text>
        <Button label="Create backup file" icon="download-outline" onPress={onExport} disabled={busy || boxes.length === 0} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Restore</Text>
        <Text style={styles.body}>
          Choose a backup file to bring its boxes onto this device. Boxes you already have are updated to match the
          backup; nothing else is removed, and printed QR codes keep working.
        </Text>
        <Button label="Restore from file" icon="folder-open-outline" variant="secondary" onPress={onImport} disabled={busy} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' },
  card: { gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.muted, lineHeight: 21 },
});
