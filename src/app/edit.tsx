import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Field, Photo } from '../components/ui';
import { confirm, errorMessage, notify } from '../lib/dialog';
import { pickPhoto } from '../lib/photos';
import { freshCode, saveBox, useBox } from '../lib/store';
import { colors } from '../lib/theme';
import { newId } from '../lib/types';
import type { Box, Item } from '../lib/types';

function PhotoButtons({ photo, onChange }: { photo?: string; onChange: (photo: string | undefined) => void }) {
  const pick = async (source: 'camera' | 'library') => {
    try {
      const picked = await pickPhoto(source);
      if (picked) onChange(picked);
    } catch (e) {
      notify("Couldn't add the photo", errorMessage(e));
    }
  };
  return (
    <View style={styles.photoButtons}>
      <IconButton icon="camera-outline" label="Take photo" onPress={() => pick('camera')} />
      <IconButton icon="images-outline" label="Choose photo" onPress={() => pick('library')} />
      {photo && <IconButton icon="close-circle-outline" label="Remove photo" danger onPress={() => onChange(undefined)} />}
    </View>
  );
}

function IconButton(props: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; danger?: boolean; onPress: () => void }) {
  const color = props.danger ? colors.danger : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      onPress={props.onPress}
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}>
      <Ionicons name={props.icon} size={18} color={color} />
      <Text style={[styles.iconButtonLabel, { color }]}>{props.label}</Text>
    </Pressable>
  );
}

export default function EditBox() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { loaded, box } = useBox(id);

  // Wait for the box being edited, so the form can start from its values.
  if (id && !loaded) return null;
  return <BoxForm key={box?.id ?? 'new'} existing={box} />;
}

function BoxForm({ existing }: { existing: Box | undefined }) {
  const [name, setName] = useState(existing?.name ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [photo, setPhoto] = useState(existing?.photo);
  const [items, setItems] = useState<Item[]>(existing?.items ?? []);
  const [saving, setSaving] = useState(false);

  const updateItem = (itemId: string, patch: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.id === itemId ? { ...i, ...patch } : i)));

  const emptyBox = async () => {
    const ok = await confirm('Empty this box?', 'All items will be removed. The box, its location and its QR code stay, so you can reuse it.', 'Empty box');
    if (ok) setItems([]);
  };

  const save = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      notify('Name the box', 'Give the box a name so you can find it later.');
      return;
    }
    const now = Date.now();
    const box: Box = {
      id: existing?.id ?? newId(),
      code: existing?.code ?? freshCode(),
      name: trimmedName,
      location: location.trim(),
      photo,
      items: items
        .map((i) => ({ ...i, name: i.name.trim(), description: i.description?.trim() || undefined }))
        .filter((i) => i.name !== ''),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    setSaving(true);
    try {
      await saveBox(box);
      // A new box goes straight to its page, where the QR code is shown.
      if (existing) router.back();
      else router.replace(`/box/${box.id}`);
    } catch (e) {
      notify("Couldn't save the box", errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: existing ? 'Edit box' : 'New box' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Box name" value={name} onChangeText={setName} placeholder="e.g. Holiday decorations" autoFocus={!existing} />
        <Field label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Garage, top shelf" />

        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Photo of the inside (optional)</Text>
          {photo && <Photo photo={photo} />}
          <PhotoButtons photo={photo} onChange={setPhoto} />
        </View>

        <View style={styles.itemsHeader}>
          <Text style={styles.section}>Items ({items.length})</Text>
          {items.length > 0 && (
            <Pressable accessibilityRole="button" onPress={emptyBox} hitSlop={8}>
              <Text style={styles.emptyLink}>Empty box</Text>
            </Pressable>
          )}
        </View>

        {items.map((item, index) => (
          <Card key={item.id} style={{ gap: 10 }}>
            <View style={styles.itemTop}>
              <Text style={styles.itemNumber}>Item {index + 1}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove item ${index + 1}`}
                hitSlop={10}
                onPress={() => setItems((list) => list.filter((i) => i.id !== item.id))}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
            <Field label="Name" value={item.name} onChangeText={(v) => updateItem(item.id, { name: v })} placeholder="e.g. String lights" />
            <Field
              label="Description (optional)"
              value={item.description ?? ''}
              onChangeText={(v) => updateItem(item.id, { description: v })}
              placeholder="Colour, size, quantity…"
              multiline
            />
            <View style={styles.itemPhotoRow}>
              {item.photo && <Photo photo={item.photo} size={56} />}
              <PhotoButtons photo={item.photo} onChange={(p) => updateItem(item.id, { photo: p })} />
            </View>
          </Card>
        ))}

        <Button
          label="Add item"
          icon="add"
          variant="secondary"
          onPress={() => setItems((list) => [...list, { id: newId(), name: '' }])}
        />
        <Button label={existing ? 'Save changes' : 'Save box'} icon="checkmark" onPress={save} disabled={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  emptyLink: { color: colors.danger, fontSize: 15, fontWeight: '600' },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemNumber: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemPhotoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  photoButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.tint,
  },
  iconButtonLabel: { fontSize: 14, fontWeight: '600' },
});
