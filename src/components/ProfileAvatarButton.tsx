import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { useBankStore } from "@/store/useBankStore";
import { palette } from "@/theme/colors";

type ProfileAvatarButtonProps = {
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  initials?: string;
};

const OUTER_GRADIENT = ["#00F6A2", "#7A2BFF", "#FF6CA8"] as const;
const INNER_GRADIENT = ["#111C33", "#070E1C"] as const;

const ProfileAvatarButton = ({
  onPress,
  size = 52,
  style,
  accessibilityLabel = "Abrir perfil",
  initials,
}: ProfileAvatarButtonProps) => {
  const { user } = useBankStore();

  const letter = useMemo(() => {
    const base = initials ?? user?.name ?? "M";
    return base.trim().charAt(0).toUpperCase();
  }, [initials, user?.name]);

  const radius = size / 2;
  const ringThickness = Math.max(2, size * 0.12);
  const innerRadius = Math.max(radius - ringThickness, radius * 0.55);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: radius,
          shadowRadius: size * 0.45,
          shadowOffset: { width: 0, height: size * 0.28 },
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
      ]}
      hitSlop={8}
    >
      <LinearGradient
        colors={OUTER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: radius, padding: ringThickness }]}
      >
        <LinearGradient
          colors={INNER_GRADIENT}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[styles.innerGradient, { borderRadius: innerRadius }]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.35)", "transparent"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.8, y: 0.9 }}
            style={[styles.gloss, { borderRadius: innerRadius }]}
          />
          <Text style={[styles.initials, { fontSize: size * 0.46 }]}>{letter}</Text>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#7A2BFF",
    elevation: 8,
  },
  gradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
  },
  initials: {
    color: palette.textPrimary,
    fontWeight: "800",
    letterSpacing: 1,
  },
});

export default ProfileAvatarButton;
