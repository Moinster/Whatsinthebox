import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Scanner } from '../components/Scanner';
import { Button } from '../components/ui';
import { parseBoxRef } from '../lib/qr';
import { findBox } from '../lib/store';
import { colors, radius } from '../lib/theme';

const NOT_HERE = "That box isn't on this device. It may have been deleted, or it was created on another phone.";

export default function Scan() {
  const [problem, setProblem] = useState<string | undefined>();
  const [typed, setTyped] = useState('');
  const [typedProblem, setTypedProblem] = useState<string | undefined>();
  const handled = useRef(false);

  const onScan = (text: string) => {
    if (handled.current) return;
    handled.current = true;
    const box = findBox(text);
    if (box) {
      router.replace(`/box/${box.id}`);
      return;
    }
    const ref = parseBoxRef(text);
    setProblem(ref.code || ref.id ? NOT_HERE : "That isn't a What's in the Box QR code.");
  };

  const onFind = () => {
    const box = findBox(typed);
    if (box) router.replace(`/box/${box.id}`);
    else setTypedProblem(parseBoxRef(typed).code ? NOT_HERE : 'Codes are 6 letters and numbers, like K7M-4QP.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={{ flex: 1 }}>
        <Scanner onScan={onScan} paused={!!problem} />
        {problem && (
          <View style={styles.overlay}>
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
          </View>
        )}
      </View>

      <View style={styles.manual}>
        <Text style={styles.manualLabel}>{"Can't scan? Type the code printed under the QR code"}</Text>
        <View style={styles.manualRow}>
          <TextInput
            accessibilityLabel="Box code"
            value={typed}
            onChangeText={(v) => {
              setTyped(v);
              setTypedProblem(undefined);
            }}
            onSubmitEditing={onFind}
            placeholder="K7M-4QP"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            maxLength={9}
            style={styles.input}
          />
          <Button label="Find box" onPress={onFind} disabled={typed.trim() === ''} />
        </View>
        {typedProblem && <Text style={styles.manualProblem}>{typedProblem}</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  panel: { backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 14, maxWidth: 360 },
  panelText: { fontSize: 16, color: colors.text, textAlign: 'center', lineHeight: 22 },
  manual: { padding: 16, gap: 8, backgroundColor: colors.bg, maxWidth: 560, width: '100%', alignSelf: 'center' },
  manualLabel: { fontSize: 14, fontWeight: '600', color: colors.muted },
  manualRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.text,
  },
  manualProblem: { fontSize: 14, color: colors.danger, lineHeight: 19 },
});
