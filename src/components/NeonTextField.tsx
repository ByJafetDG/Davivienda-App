import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useMemo } from "react";
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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
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
            {...rest}
          />
        </View>
        <View pointerEvents="none" style={styles.glow} />
      </LinearGradient>
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
