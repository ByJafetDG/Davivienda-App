import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { ReactNode } from "react";
import {
  Pressable,
  PressableStateCallbackType,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { palette } from "@/theme/colors";

export type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessoryRight?: ReactNode;
};

const PrimaryButton = ({
  label,
  onPress,
  disabled,
  loading,
  style,
  accessoryRight,
}: PrimaryButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.container, style]}
    >
      {(state: PressableStateCallbackType) => (
        <MotiView
          animate={{
            scale: state.pressed ? 0.98 : 1,
            opacity: disabled ? 0.6 : 1,
          }}
          transition={{ type: "timing", duration: 120 }}
          style={styles.motiWrapper}
        >
          <LinearGradient
            colors={[palette.primary, palette.accentCyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Text style={styles.label}>{loading ? "Procesando…" : label}</Text>
            {accessoryRight}
          </LinearGradient>
        </MotiView>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    overflow: "hidden",
  },
  motiWrapper: {
    borderRadius: 999,
  },
  gradient: {
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
  },
  label: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

export default PrimaryButton;
