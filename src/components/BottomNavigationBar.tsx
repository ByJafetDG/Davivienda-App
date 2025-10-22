import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter, useSegments } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Easing } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { palette } from "@/theme/colors";

export type BottomNavItem = {
  key: string;
  label: string;
  icon: string;
  route: string;
  accent: string;
};

const items: BottomNavItem[] = [
  {
    key: "balance",
    label: "Saldo",
    icon: "wallet",
    route: "/(app)/home",
    accent: "#63F7B0",
  },
  {
    key: "transfer",
    label: "Transferir",
    icon: "bank-transfer",
    route: "/(app)/transfer",
    accent: "#FF86E8",
  },
  {
    key: "history",
    label: "Historial",
    icon: "history",
    route: "/(app)/history",
    accent: "#8D84FF",
  },
  {
    key: "recharge",
    label: "Recarga",
    icon: "cellphone-nfc",
    route: "/(app)/mobile-recharge",
    accent: "#4CEAF7",
  },
  {
    key: "charges",
    label: "Cobros",
    icon: "hand-coin-outline",
    route: "/(app)/charges",
    accent: "#FFB786",
  },
  {
    key: "profile",
    label: "Perfil",
    icon: "account-circle",
    route: "/(app)/profile",
    accent: "#21F5C1",
  },
];

type ItemLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const indicatorGradients: Record<string, [string, string]> = {
  balance: ["#63F7B0", "#1B3D69"],
  transfer: ["#FF86E8", "#3E1B5D"],
  history: ["#8D84FF", "#2A2981"],
  recharge: ["#4CEAF7", "#144E72"],
  charges: ["#FFB786", "#56321F"],
  profile: ["#21F5C1", "#174D45"],
};

const segmentToKey: Record<string, BottomNavItem["key"]> = {
  home: "balance",
  history: "history",
  transfer: "transfer",
  "confirm-transfer": "transfer",
  "mobile-recharge": "recharge",
  charges: "charges",
  profile: "profile",
  "profile-qr": "profile",
  automations: "profile",
  notifications: "profile",
  contacts: "transfer",
  scan: "transfer",
  envelopes: "balance",
};

const INDICATOR_INSET = 6;

const BottomNavigationBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  const routeSegment = useMemo(() => {
    const reversed = [...segments].reverse();
    const matching = reversed.find(
      (segment) => segment && !segment.startsWith("(")
    );
    return matching ?? "home";
  }, [segments]);

  const activeKey = useMemo(() => {
    const fromSegment = segmentToKey[routeSegment];
    if (fromSegment) {
      return fromSegment;
    }

    const byRoute = items.find((item) => pathname.startsWith(item.route));
    return byRoute?.key ?? "balance";
  }, [pathname, routeSegment]);

  const [layouts, setLayouts] = useState<Record<string, ItemLayout>>({});
  const [indicatorFlow, setIndicatorFlow] = useState<"right" | "left">("right");
  const lastXRef = useRef<number | null>(null);

  const handleLayout = (key: string) => (event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setLayouts((prev) => {
      const current = prev[key];
      if (
        current &&
        current.x === x &&
        current.y === y &&
        current.width === width &&
        current.height === height
      ) {
        return prev;
      }
      return { ...prev, [key]: { x, y, width, height } };
    });
  };

  const activeLayout = layouts[activeKey];
  const indicatorColors = indicatorGradients[activeKey] ?? indicatorGradients.balance;

  useEffect(() => {
    if (!activeLayout) {
      return;
    }
    const nextX = activeLayout.x;
    const prevX = lastXRef.current;
    if (prevX !== null && Math.abs(nextX - prevX) > 1) {
      setIndicatorFlow(nextX > prevX ? "right" : "left");
    }
    lastXRef.current = nextX;
  }, [activeLayout]);

  const gradientOrientation = indicatorFlow === "right"
    ? { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
    : { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 10) + 18 },
      ]}
    >
      <View style={styles.bar}>
        <MotiView
          pointerEvents="none"
          style={styles.indicator}
          animate={{
            opacity: activeLayout ? 1 : 0,
            width: activeLayout
              ? Math.max(0, activeLayout.width - INDICATOR_INSET * 2)
              : 0,
            height: activeLayout
              ? Math.max(0, activeLayout.height - INDICATOR_INSET * 2)
              : 0,
            translateX: activeLayout ? activeLayout.x + INDICATOR_INSET : 0,
            translateY: activeLayout ? activeLayout.y + INDICATOR_INSET : 0,
          }}
          transition={{
            type: "timing",
            duration: 320,
            easing: indicatorFlow === "right" ? Easing.out(Easing.cubic) : Easing.out(Easing.cubic),
          }}
        >
          <LinearGradient
            colors={indicatorColors}
            start={gradientOrientation.start}
            end={gradientOrientation.end}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.indicatorGlow} />
        </MotiView>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <View
              key={item.key}
              style={styles.slot}
              onLayout={handleLayout(item.key)}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => {
                  if (!pathname.startsWith(item.route)) {
                    router.push(item.route);
                  }
                }}
                style={({ pressed }) => [
                  styles.button,
                  pressed && !isActive ? styles.buttonPressed : null,
                ]}
              >
                <View
                  style={[
                    styles.iconWrapper,
                    isActive && [
                      styles.iconWrapperActive,
                      {
                        shadowColor: `${item.accent}88`,
                        borderColor: `${item.accent}66`,
                      },
                    ],
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={22}
                    color={isActive ? palette.background : palette.textSecondary}
                  />
                </View>
                <Text
                  style={[styles.label, isActive ? styles.labelActive : null]}
                >
                  {item.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    position: "relative",
    borderRadius: 32,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(8, 13, 26, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#040621",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    overflow: "visible",
  },
  slot: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    shadowColor: "rgba(0,0,0,0.45)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 26,
  },
  indicatorGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  iconWrapperActive: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderColor: "transparent",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
  },
  label: {
    color: palette.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  labelActive: {
    color: palette.textPrimary,
    textShadowColor: "rgba(255,255,255,0.3)",
    textShadowRadius: 8,
  },
});

export default BottomNavigationBar;
export { items as bottomNavigationItems };
