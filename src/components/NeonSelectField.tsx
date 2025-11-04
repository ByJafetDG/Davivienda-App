import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatePresence, MotiView } from "moti";
import { ReactNode, cloneElement, isValidElement, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { palette } from "@/theme/colors";

type Option = {
  label: string;
  value: string;
  description?: string;
  icon?: ReactNode;
};

type NeonSelectFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  helpText?: string;
  errorMessage?: string;
  icon?: ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
};

const NeonSelectField = ({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  helpText,
  errorMessage,
  icon,
  disabled,
  style,
}: NeonSelectFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const hint = errorMessage || helpText;
  const hintColor = errorMessage ? palette.danger : palette.textMuted;
  const isActive = isOpen || Boolean(selectedOption);

  const toggleOpen = () => {
    if (disabled) {
      return;
    }
    setIsOpen((current) => !current);
  };

  const handleSelect = (option: Option) => {
    onValueChange(option.value);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <MotiView
        style={styles.animatedShell}
        from={{ opacity: 0.9, scale: 0.98 }}
        animate={{
          opacity: isActive ? 1 : 0.9,
          scale: isOpen ? 1.02 : 0.99,
          shadowOpacity: isOpen ? 0.45 : 0,
        }}
        transition={{ type: "timing", duration: 200 }}
      >
        <LinearGradient
          colors={[palette.cardGradientStart, palette.cardGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={toggleOpen}
            disabled={disabled}
            style={[styles.fieldSurface, disabled && styles.fieldDisabled]}
          >
            {icon ? (
              <View style={styles.iconContainer}>
                {isValidElement(icon)
                  ? cloneElement(icon as any, {
                      color: palette.textPrimary,
                    })
                  : icon}
              </View>
            ) : null}
            <Text
              style={[
                styles.valueText,
                !selectedOption && styles.placeholderText,
              ]}
              numberOfLines={1}
            >
              {selectedOption?.label ?? placeholder ?? "Selecciona"}
            </Text>
            <MaterialCommunityIcons
              name={isOpen ? "chevron-up" : "chevron-down"}
              size={22}
              color={palette.textPrimary}
            />
          </Pressable>
          <MotiView
            pointerEvents="none"
            style={styles.glow}
            animate={{
              opacity: isOpen ? 0.5 : 0.2,
              scale: isOpen ? 1.05 : 1,
            }}
            transition={{ type: "timing", duration: 220 }}
          />
        </LinearGradient>
      </MotiView>

      <AnimatePresence>
        {isOpen ? (
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -6 }}
            transition={{ type: "timing", duration: 200 }}
            style={styles.optionsWrapper}
          >
            {options.map((option) => {
              const isSelected = option.value === selectedOption?.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelect(option)}
                  style={[
                    styles.optionRow,
                    isSelected && styles.optionSelected,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  {option.description ? (
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </MotiView>
        ) : null}
      </AnimatePresence>

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
    paddingVertical: 16,
    gap: 12,
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  valueText: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  placeholderText: {
    color: palette.textMuted,
    fontWeight: "500",
  },
  glow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(240, 68, 44, 0.35)",
  },
  optionsWrapper: {
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 205, 180, 0.16)",
    backgroundColor: "rgba(58, 10, 16, 0.94)",
    overflow: "hidden",
  },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 205, 180, 0.12)",
  },
  optionSelected: {
    backgroundColor: "rgba(240, 68, 44, 0.18)",
  },
  optionLabel: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  optionDescription: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  hint: {
    fontSize: 12,
    marginLeft: 6,
  },
});

export type { Option as NeonSelectOption };
export default NeonSelectField;
