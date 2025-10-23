import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  StyleProp,
  StyleSheet,
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
  // keep initials prop for possible future use but we render a modern icon instead
  const displayName = useMemo(() => initials ?? user?.name ?? "", [initials, user?.name]);

  const radius = size / 2;
  const ringThickness = Math.max(2, size * 0.12);
  // innerDiameter is the visible inner circle diameter (inside the gradient ring)
  const innerDiameter = Math.max(size - ringThickness * 2, size * 0.5);
  const innerRadius = innerDiameter / 2;

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
          aspectRatio: 1,
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
          style={[
            styles.innerGradient,
            {
              width: innerDiameter,
              height: innerDiameter,
              borderRadius: innerRadius,
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.18)", "transparent"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.8, y: 0.9 }}
            style={[styles.gloss, { borderRadius: innerRadius }]}
          />
          {/* Modern profile icon */}
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={Math.round(innerDiameter * 0.56)}
              color={palette.textPrimary}
            />
          </View>
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
    backgroundColor: "transparent",
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
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ProfileAvatarButton;
