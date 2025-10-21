import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { ReactNode, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { palette } from "@/theme/colors";

export type NeonTextFieldProps = TextInputProps & {
  label: string;
  icon?: ReactNode;
  helpText?: string;
  errorMessage?: string;
};

const NeonTextField = ({
  label,
  icon,
  helpText,
  errorMessage,
  style,
  ...rest
}: NeonTextFieldProps) => {
  const hint = useMemo(
    () => errorMessage || helpText,
    [errorMessage, helpText],
  );
  const hintColor = errorMessage ? palette.danger : palette.textMuted;
  const [focused, setFocused] = useState(false);

  const { onFocus, onBlur, ...inputProps } = rest;

  const handleFocus: TextInputProps["onFocus"] = (event) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur: TextInputProps["onBlur"] = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <MotiView
        style={styles.animatedShell}
        from={{ opacity: 0.85, scale: 0.98 }}
        animate={{
          opacity: focused ? 1 : 0.9,
          scale: focused ? 1.01 : 0.98,
          shadowOpacity: focused ? 0.45 : 0,
        }}
        transition={{ type: "timing", duration: 200 }}
      >
        <LinearGradient
          colors={[palette.elevatedSurface, palette.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.fieldSurface}>
            {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
            <TextInput
              placeholderTextColor={palette.textMuted}
              style={[styles.input, style]}
              selectionColor={palette.accentCyan}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...inputProps}
            />
          </View>
          <MotiView
            pointerEvents="none"
            style={styles.glow}
            animate={{
              opacity: focused ? 0.45 : 0.2,
              scale: focused ? 1.05 : 1,
            }}
            transition={{ type: "timing", duration: 220 }}
          />
        </LinearGradient>
      </MotiView>
      {hint ? (
        <Text style={[styles.hint, { color: hintColor }]}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.textSecondary,
    letterSpacing: 0.4,
  },
  gradient: {
    borderRadius: 22,
    padding: 2,
    position: "relative",
  },
  animatedShell: {
    borderRadius: 24,
    shadowColor: palette.accentCyan,
  },
  fieldSurface: {
    backgroundColor: "rgba(7, 17, 31, 0.7)",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 14,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  input: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    marginLeft: 6,
  },
  glow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.2)",
  },
});

export default NeonTextField;
