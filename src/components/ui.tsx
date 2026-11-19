import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { photoUri } from '../lib/photos';
import { qrSvg } from '../lib/qr';
import { colors, radius } from '../lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, icon, variant = 'primary', disabled, style }: ButtonProps) {
  const fg = variant === 'primary' ? colors.primaryText : variant === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
        variant === 'danger' && { borderColor: colors.danger },
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}>
      {icon && <Ionicons name={icon} size={20} color={fg} />}
      <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        style={[styles.input, props.multiline && { minHeight: 72, textAlignVertical: 'top' }, props.style]}
      />
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Photo({ photo, size, style }: { photo?: string; size?: number; style?: StyleProp<ViewStyle> }) {
  const uri = photoUri(photo);
  const box: ViewStyle = size ? { width: size, height: size } : { width: '100%', aspectRatio: 4 / 3 };
  if (!uri) {
    return (
      <View style={[styles.photo, styles.photoEmpty, box, style]}>
        <Ionicons name="cube-outline" size={size ? size * 0.5 : 48} color={colors.primary} />
      </View>
    );
  }
  return (
    <View style={[styles.photo, box, style]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
    </View>
  );
}

export function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  return <SvgXml xml={qrSvg(value, size)} width={size} height={size} />;
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={56} color={colors.primary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  buttonPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.card, borderColor: colors.border },
  buttonLabel: { fontSize: 16, fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.muted },
  input: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  photo: { borderRadius: 10, overflow: 'hidden', backgroundColor: colors.tint },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyBody: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 21 },
});
