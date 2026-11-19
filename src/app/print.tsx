import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, EmptyState } from '../components/ui';
import { errorMessage, notify } from '../lib/dialog';
import { printLabels } from '../lib/print';
import type { LabelsAcross } from '../lib/print';
import { formatCode } from '../lib/qr';
import { useBoxes } from '../lib/store';
import { colors, radius } from '../lib/theme';

const SIZES: { across: LabelsAcross; label: string; hint: string }[] = [
  { across: 2, label: 'Large', hint: '2 across' },
  { across: 3, label: 'Medium', hint: '3 across' },
  { across: 4, label: 'Small', hint: '4 across' },
];

export default function PrintLabels() {
  const { loaded, boxes } = useBoxes();
  // Track what is switched off, so every box starts selected, including ones added later.
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [across, setAcross] = useState<LabelsAcross>(3);

  const selected = boxes.filter((b) => !skipped.has(b.id));
  const allSelected = selected.length === boxes.length;

  const toggle = (id: string) =>
    setSkipped((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const print = () => printLabels(selected, across).catch((e) => notify("Couldn't print", errorMessage(e)));

  if (loaded && boxes.length === 0) {
    return <EmptyState icon="print-outline" title="No labels to print" body="Add a box first, then come back to print its label." />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.controls}>
        <Text style={styles.heading}>Label size</Text>
        <View style={styles.sizes}>
          {SIZES.map((s) => {
            const active = s.across === across;
            return (
              <Pressable
                key={s.across}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${s.label}, ${s.hint}`}
                onPress={() => setAcross(s.across)}
                style={[styles.size, active && styles.sizeActive]}>
                <Text style={[styles.sizeLabel, active && { color: colors.primaryText }]}>{s.label}</Text>
                <Text style={[styles.sizeHint, active && { color: colors.primaryText }]}>{s.hint}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.heading}>
            {selected.length} of {boxes.length} selected
          </Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setSkipped(allSelected ? new Set(boxes.map((b) => b.id)) : new Set())}>
            <Text style={styles.link}>{allSelected ? 'Select none' : 'Select all'}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={boxes}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: box }) => {
          const on = !skipped.has(box.id);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={box.name}
              onPress={() => toggle(box.id)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={26} color={on ? colors.primary : colors.muted} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {box.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {formatCode(box.code)}
                  {box.location ? ` · ${box.location}` : ''}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        <Button
          label={selected.length === 1 ? 'Print 1 label' : `Print ${selected.length} labels`}
          icon="print-outline"
          onPress={print}
          disabled={selected.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, maxWidth: 560, width: '100%', alignSelf: 'center' },
  controls: { paddingHorizontal: 16, paddingTop: 4, gap: 8 },
  heading: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  sizes: { flexDirection: 'row', gap: 8 },
  size: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  sizeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  sizeHint: { fontSize: 12, color: colors.muted },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  link: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  list: { padding: 16, paddingTop: 10, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.muted },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
});
