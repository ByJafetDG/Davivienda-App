import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { ReactNode, cloneElement, isValidElement, useMemo, useState } from "react";
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
  /**
   * When true, the component will filter input to allow only numeric characters
   * (digits, optional decimal separators like dot or comma, and optional leading -).
   * This filtering happens before calling the provided onChangeText prop.
   */
  allowOnlyNumeric?: boolean;
  /**
   * Optional custom RegExp to control allowed characters when allowOnlyNumeric is true.
   * The regex should match allowed characters (global flag not required).
   */
  numericPattern?: RegExp;
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

  const { onFocus, onBlur, onChangeText, allowOnlyNumeric, numericPattern, ...inputProps } = rest as NeonTextFieldProps;

  // Default numeric pattern: digits, dot, comma and leading minus
  const defaultNumericPattern = /^[0-9.,-]+$/;

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
          colors={[palette.cardGradientStart, palette.cardGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.fieldSurface}>
            {icon ? (
              <View style={styles.iconContainer}>
                {isValidElement(icon)
                  ? cloneElement(icon as any, {
                      color: palette.textPrimary,
                    })
                  : icon}
              </View>
            ) : null}
            <TextInput
              placeholderTextColor={palette.textMuted}
              style={[styles.input, style]}
              selectionColor={palette.primary}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...inputProps}
              onChangeText={(text) => {
                if (allowOnlyNumeric) {
                  const pattern = numericPattern ?? defaultNumericPattern;
                  // Remove chars not matching the allowed set
                  let filtered = text.split("").filter((ch) => pattern.test(ch)).join("");
                  // Normalize multiple separators: allow at most one dot or comma
                  const hasDot = filtered.includes(".");
                  const hasComma = filtered.includes(",");
                  if (hasDot && hasComma) {
                    // If both present, keep the last one as decimal separator and remove earlier ones
                    const lastDot = filtered.lastIndexOf(".");
                    const lastComma = filtered.lastIndexOf(",");
                    const lastSepIndex = Math.max(lastDot, lastComma);
                    filtered = filtered
                      .slice(0, lastSepIndex + 1)
                      .replace(/[.,]/g, (m, idx) => (idx === lastSepIndex ? m : "")) +
                      filtered.slice(lastSepIndex + 1).replace(/[.,]/g, "");
                  } else {
                    // remove any extra separators of same type keeping first
                    filtered = filtered.replace(/\.(?=.*\.)/g, "").replace(/,(?=.*,)/g, "");
                  }
                  onChangeText?.(filtered);
                } else {
                  onChangeText?.(text);
                }
              }}
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
    shadowColor: "rgba(240, 68, 44, 0.6)",
  },
  fieldSurface: {
    backgroundColor: "rgba(58, 10, 16, 0.78)",
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
    backgroundColor: "rgba(255, 255, 255, 0.08)",
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
    borderColor: "rgba(240, 68, 44, 0.28)",
  },
});

export default NeonTextField;
