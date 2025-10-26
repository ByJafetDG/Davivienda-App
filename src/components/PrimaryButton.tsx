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
  variant?: "solid" | "ghost";
  compact?: boolean;
};

const PrimaryButton = ({
  label,
  onPress,
  disabled,
  loading,
  style,
  accessoryRight,
  variant = "solid",
  compact = false,
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
          transition={{ type: "timing", duration: 160 }}
          style={styles.motiWrapper}
        >
          <MotiView
            pointerEvents="none"
            style={styles.glow}
            from={{ opacity: 0.35, scale: 0.92 }}
            animate={{
              opacity: state.pressed ? 0.45 : 0.65,
              scale: state.pressed ? 0.96 : 1.08,
            }}
            transition={{ type: "timing", duration: 320 }}
          />
          <LinearGradient
            colors={
              variant === "ghost"
                ? ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.06)"]
                : [palette.buttonGradientStart, palette.buttonGradientEnd]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              compact ? styles.gradientCompact : styles.gradient,
              variant === "ghost" && styles.gradientGhost,
              disabled ? styles.gradientDisabled : null,
            ]}
          >
            {variant === "solid" ? (
              <MotiView
                pointerEvents="none"
                style={styles.highlight}
                from={{ translateX: -40, opacity: 0.15 }}
                animate={{
                  translateX: state.pressed ? 10 : 40,
                  opacity: state.pressed ? 0.25 : 0.35,
                }}
                transition={{ type: "timing", duration: 520 }}
              />
            ) : null}
            <Text
              style={[
                compact ? styles.labelCompact : styles.label,
                variant === "ghost" && styles.labelGhost,
                disabled && variant === "ghost" && styles.labelGhostDisabled,
              ]}
            >
              {loading ? "Procesando…" : label}
            </Text>
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
    position: "relative",
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
  gradientCompact: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  gradientGhost: {
    backgroundColor: "rgba(0,0,0,0)",
  },
  gradientDisabled: {
    opacity: 0.85,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: palette.buttonGlow,
  },
  highlight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "40%",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
  },
  label: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  labelCompact: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  labelGhost: {
    color: palette.textSecondary,
  },
  labelGhostDisabled: {
    color: "rgba(255,255,255,0.4)",
  },
});

export default PrimaryButton;
