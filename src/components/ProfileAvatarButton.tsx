import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

const OUTER_GRADIENT = ["#F0442C", "#F2643C", "#F8991D"] as const;
const INNER_GRADIENT = ["#3A0A10", "#4A1016"] as const;

const ProfileAvatarButton = ({
  onPress,
  size = 52,
  style,
  accessibilityLabel = "Abrir notificaciones",
  initials,
}: ProfileAvatarButtonProps) => {
  const { user, notifications } = useBankStore();
  // keep initials prop for possible future use but we render a modern icon instead
  const displayName = useMemo(() => initials ?? user?.name ?? "", [initials, user?.name]);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );
  const badgeLabel = useMemo(() => {
    if (unreadCount > 99) {
      return "99+";
    }
    return String(unreadCount);
  }, [unreadCount]);
  const showBadge = unreadCount > 0;

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
      {showBadge ? (
        <View
          pointerEvents="none"
          style={[
            styles.badge,
            {
              minWidth: Math.max(18, size * 0.34),
              height: Math.max(18, size * 0.34),
              borderRadius: Math.max(9, size * 0.17),
              top: Math.max(-4, -size * 0.1),
              right: Math.max(-2, -size * 0.08),
              paddingHorizontal: Math.max(4, size * 0.08),
            },
          ]}
        >
          <Text style={styles.badgeLabel}>{badgeLabel}</Text>
        </View>
      ) : null}
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
            colors={["rgba(240, 68, 44, 0.24)", "transparent"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.8, y: 0.9 }}
            style={[styles.gloss, { borderRadius: innerRadius }]}
          />
          {/* Notification shortcut icon */}
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="bell-outline"
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
    shadowColor: "rgba(240, 68, 44, 0.45)",
    elevation: 8,
    backgroundColor: "transparent",
    position: "relative",
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
    borderColor: "rgba(255, 205, 180, 0.18)",
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
  badge: {
    position: "absolute",
    zIndex: 2,
    backgroundColor: "rgba(255, 247, 245, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(221, 20, 29, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  badgeLabel: {
    color: palette.primary,
    fontSize: 11,
    fontWeight: "700",
  },
});

export default ProfileAvatarButton;
