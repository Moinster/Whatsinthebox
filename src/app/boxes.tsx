import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, EmptyState, Photo } from '../components/ui';
import { formatCode } from '../lib/qr';
import { useBoxes } from '../lib/store';
import { colors, radius } from '../lib/theme';
import type { Box } from '../lib/types';

type Result = { box: Box; matchedItems: string[] };

/** Every word in the query must appear in the box name, location, code, or one of its items. */
function search(boxes: Box[], query: string): Result[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return boxes.map((box) => ({ box, matchedItems: [] }));

  const results: Result[] = [];
  for (const box of boxes) {
    const itemTexts = box.items.map((i) => `${i.name} ${i.description ?? ''}`.toLowerCase());
    const haystack = [box.name, box.location, box.code, formatCode(box.code), ...itemTexts].join(' ').toLowerCase();
    if (!words.every((w) => haystack.includes(w))) continue;
    const matchedItems = box.items
      .filter((_, idx) => words.some((w) => itemTexts[idx].includes(w)))
      .map((i) => i.name);
    results.push({ box, matchedItems });
  }
  return results;
}

export default function Boxes() {
  const { loaded, boxes } = useBoxes();
  const [query, setQuery] = useState('');
  const results = useMemo(() => search(boxes, query), [boxes, query]);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable accessibilityRole="button" accessibilityLabel="Add a box" hitSlop={10} onPress={() => router.push('/edit')}>
              <Ionicons name="add-circle" size={30} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          accessibilityLabel="Search boxes"
          value={query}
          onChangeText={setQuery}
          placeholder="Search boxes, items, locations, codes"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {query !== '' && (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(r) => r.box.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loaded ? undefined : boxes.length === 0 ? (
            <View style={{ gap: 8 }}>
              <EmptyState icon="cube-outline" title="No boxes yet" body="Add a box, list what's inside, and print its QR code." />
              <Button label="Add a box" icon="add-circle-outline" onPress={() => router.push('/edit')} />
            </View>
          ) : (
            <EmptyState icon="search" title="Nothing found" body={`No box, item, or location matches "${query.trim()}".`} />
          )
        }
        renderItem={({ item: { box, matchedItems } }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/box/${box.id}`)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
            <Photo photo={box.photo} size={64} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.name} numberOfLines={1}>
                {box.name}
              </Text>
              {box.location !== '' && (
                <View style={styles.meta}>
                  <Ionicons name="location-outline" size={14} color={colors.muted} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {box.location}
                  </Text>
                </View>
              )}
              {matchedItems.length > 0 ? (
                <Text style={styles.match} numberOfLines={2}>
                  Contains: {matchedItems.join(', ')}
                </Text>
              ) : (
                <Text style={styles.metaText}>
                  {box.items.length === 0 ? 'Empty' : `${box.items.length} ${box.items.length === 1 ? 'item' : 'items'}`}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, maxWidth: 560, width: '100%', alignSelf: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 14,
    minHeight: 48,
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 10 },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 14, color: colors.muted, flexShrink: 1 },
  match: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
