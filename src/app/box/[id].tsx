import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, Photo, QRCode } from '../../components/ui';
import { confirm, errorMessage, notify } from '../../lib/dialog';
import { printBoxLabel } from '../../lib/print';
import { boxLink } from '../../lib/qr';
import { deleteBox, useBox } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function BoxScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loaded, box } = useBox(id);

  if (!loaded) return null;
  if (!box) {
    return (
      <View style={styles.content}>
        <EmptyState
          icon="help-circle-outline"
          title="Box not found"
          body="This box isn't on this device. It may have been deleted, or it was created on another phone."
        />
        <Button label="View my boxes" variant="secondary" onPress={() => router.replace('/boxes')} />
      </View>
    );
  }

  const edit = () => router.push({ pathname: '/edit', params: { id: box.id } });

  const remove = async () => {
    const ok = await confirm('Delete this box?', `"${box.name}" and its ${box.items.length} item(s) will be removed.`, 'Delete');
    if (!ok) return;
    await deleteBox(box.id);
    if (router.canGoBack()) router.back();
    else router.replace('/boxes');
  };

  const print = () => printBoxLabel(box).catch((e) => notify("Couldn't print", errorMessage(e)));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: box.name,
          headerRight: () => (
            <Pressable accessibilityRole="button" accessibilityLabel="Edit box" hitSlop={10} onPress={edit}>
              <Text style={styles.headerAction}>Edit</Text>
            </Pressable>
          ),
        }}
      />

      {box.photo && <Photo photo={box.photo} />}

      <View style={{ gap: 4 }}>
        <Text style={styles.name}>{box.name}</Text>
        <View style={styles.meta}>
          <Ionicons name="location-outline" size={18} color={colors.muted} />
          <Text style={styles.location}>{box.location || 'No location set'}</Text>
        </View>
      </View>

      <Text style={styles.section}>
        {box.items.length === 0 ? 'Items' : `${box.items.length} ${box.items.length === 1 ? 'item' : 'items'}`}
      </Text>
      {box.items.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>This box is empty. Tap Edit to add items.</Text>
        </Card>
      ) : (
        <Card style={{ padding: 0 }}>
          {box.items.map((item, i) => (
            <View key={item.id} style={[styles.item, i > 0 && styles.itemDivider]}>
              {item.photo && <Photo photo={item.photo} size={52} />}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                {!!item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
              </View>
            </View>
          ))}
        </Card>
      )}

      <Text style={styles.section}>QR code</Text>
      <Card style={styles.qrCard}>
        <QRCode value={boxLink(box.id)} size={200} />
        <Text style={styles.qrHint}>Print this label and stick it on the box. Scan it later to see what's inside.</Text>
        <Button label="Print label" icon="print-outline" onPress={print} style={{ alignSelf: 'stretch' }} />
      </Card>

      <Button label="Edit box" icon="create-outline" variant="secondary" onPress={edit} />
      <Button label="Delete box" icon="trash-outline" variant="danger" onPress={remove} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' },
  headerAction: { color: colors.primary, fontSize: 17, fontWeight: '600' },
  name: { fontSize: 26, fontWeight: '800', color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 16, color: colors.muted, flexShrink: 1 },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 6 },
  emptyText: { fontSize: 15, color: colors.muted },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  itemDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.text },
  itemDescription: { fontSize: 14, color: colors.muted, lineHeight: 19 },
  qrCard: { alignItems: 'center', gap: 12 },
  qrHint: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 19 },
});
