import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter, useSegments } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing as AnimatedEasing,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
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

const layoutMemory: Record<string, ItemLayout> = {};
let indicatorMemory = {
  lastLayout: null as ItemLayout | null,
  flow: "right" as "right" | "left",
  ready: false,
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const BottomNavigationBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [disabledRoutes, setDisabledRoutes] = useState<Set<string>>(new Set());
  const isNavigatingRef = useRef(false);
  const disabledRoutesRef = useRef<Set<string>>(new Set());

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

  const [layouts, setLayouts] = useState<Record<string, ItemLayout>>(
    () => ({ ...layoutMemory })
  );
  const [indicatorFlow, setIndicatorFlow] = useState<"right" | "left">(() => indicatorMemory.flow);
  const [indicatorReady, setIndicatorReady] = useState(() => indicatorMemory.ready);
  const lastXRef = useRef<number | null>(indicatorMemory.lastLayout?.x ?? null);
  const lastLayoutRef = useRef<ItemLayout | null>(indicatorMemory.lastLayout);

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
      const nextLayouts = { ...prev, [key]: { x, y, width, height } };
      layoutMemory[key] = { x, y, width, height };
      return nextLayouts;
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
      const nextFlow = nextX > prevX ? "right" : "left";
      indicatorMemory = { ...indicatorMemory, flow: nextFlow };
      setIndicatorFlow(nextFlow);
    }
    lastXRef.current = nextX;
  }, [activeLayout]);

  useEffect(() => {
    if (activeLayout) {
      lastLayoutRef.current = activeLayout;
      if (!indicatorReady) {
        setIndicatorReady(true);
      }
      indicatorMemory = {
        ...indicatorMemory,
        lastLayout: activeLayout,
        ready: true,
      };
    }
  }, [activeLayout, indicatorReady]);

  // Reset navigation state when route changes
  useEffect(() => {
    isNavigatingRef.current = false;
    setIsNavigating(false);

    setDisabledRoutes(() => {
      const cleared = new Set<string>();
      disabledRoutesRef.current = cleared;
      return cleared;
    });
  }, [pathname, disabledRoutesRef, isNavigatingRef]);

  const handleNavigation = (item: BottomNavItem) => {
    // Prevent navigation if already navigating or route is disabled
    if (isNavigatingRef.current || disabledRoutesRef.current.has(item.route)) {
      return;
    }

    // Check if we're not already on this route
    if (!pathname.startsWith(item.route)) {
      isNavigatingRef.current = true;
      setIsNavigating(true);

      setDisabledRoutes((prev) => {
        const updated = new Set(prev);
        updated.add(item.route);
        disabledRoutesRef.current = updated;
        return updated;
      });

      router.replace(item.route);

      // Re-enable after a short delay
      setTimeout(() => {
        isNavigatingRef.current = false;
        setIsNavigating(false);

        setDisabledRoutes((prev) => {
          const updated = new Set(prev);
          updated.delete(item.route);
          disabledRoutesRef.current = updated;
          return updated;
        });
      }, 500);
    }
  };

  const targetLayout = activeLayout ?? lastLayoutRef.current;

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
            opacity: indicatorReady ? 1 : 0,
            width: targetLayout
              ? Math.max(0, targetLayout.width - INDICATOR_INSET * 2)
              : 0,
            height: targetLayout
              ? Math.max(0, targetLayout.height - INDICATOR_INSET * 2)
              : 0,
            translateX: targetLayout ? targetLayout.x + INDICATOR_INSET : 0,
            translateY: targetLayout ? targetLayout.y + INDICATOR_INSET : 0,
          }}
          transition={{
            type: "timing",
            duration: 360,
            easing: indicatorFlow === "right"
              ? Easing.out(Easing.cubic)
              : Easing.out(Easing.cubic),
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
          const isDisabled = isNavigating || disabledRoutes.has(item.route);
          
          return (
            <View
              key={item.key}
              style={styles.slot}
              onLayout={handleLayout(item.key)}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.label}
                disabled={isDisabled}
                onPress={() => handleNavigation(item)}
                style={({ pressed }) => [
                  styles.button,
                  pressed && !isActive ? styles.buttonPressed : null,
                  isDisabled && styles.buttonDisabled,
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
                    isDisabled && styles.iconWrapperDisabled,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={22}
                    color={
                      isDisabled 
                        ? palette.textMuted
                        : isActive 
                        ? palette.background 
                        : palette.textSecondary
                    }
                  />
                </View>
                <NavLabel text={item.label} isActive={isActive} isDisabled={isDisabled} />
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
    paddingHorizontal: 12,
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
    minWidth: 0,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    shadowOpacity: 0.34,
    shadowRadius: 22,
  },
  iconWrapperDisabled: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.04)",
  },
  label: {
    color: palette.textSecondary,
    fontSize: 10.2,
    fontWeight: "600",
    lineHeight: 12.6,
    letterSpacing: 0.15,
    textAlign: "center",
    paddingHorizontal: 2,
    flexShrink: 0,
  },
  labelActive: {
    color: palette.textPrimary,
    textShadowColor: "rgba(255,255,255,0.3)",
    textShadowRadius: 6,
  },
  labelDisabled: {
    color: palette.textSecondary,
    opacity: 0.4,
  },
  labelContainer: {
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  labelOverflow: {
    textAlign: "left",
  },
  labelContainerOverflow: {
    alignItems: "flex-start",
  },
  labelScroll: {
    width: "100%",
  },
  labelScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "100%",
  },
  labelScrollOverflow: {
    justifyContent: "flex-start",
  },
});

export default BottomNavigationBar;
export { items as bottomNavigationItems };

const MARQUEE_GAP = 14;

const NavLabel = ({
  text,
  isActive,
  isDisabled = false,
}: {
  text: string;
  isActive: boolean;
  isDisabled?: boolean;
}) => {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [labelWidth, setLabelWidth] = useState(0);

  const overflow = containerWidth > 0 && labelWidth > containerWidth + 2;

  useEffect(() => {
    return () => {
      animationRef.current?.stop();
      scrollAnim.stopAnimation();
    };
  }, [scrollAnim]);

  useEffect(() => {
    const listenerId = scrollAnim.addListener(({ value }) => {
      scrollRef.current?.scrollTo({ x: value, animated: false });
    });

    return () => {
      scrollAnim.removeListener(listenerId);
    };
  }, [scrollAnim]);

  useEffect(() => {
    if (!overflow) {
      animationRef.current?.stop();
      animationRef.current = null;
      scrollAnim.stopAnimation();
      scrollAnim.setValue(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
      return;
    }

    const travel = Math.max(0, labelWidth + MARQUEE_GAP);
    if (travel === 0) {
      return;
    }

    animationRef.current?.stop();
    scrollAnim.stopAnimation();
    scrollAnim.setValue(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });

    const duration = Math.min(7200, Math.max(2400, travel * 40));

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(540),
        Animated.timing(scrollAnim, {
          toValue: travel,
          duration,
          easing: AnimatedEasing.linear,
          useNativeDriver: false,
        }),
        Animated.delay(760),
        Animated.timing(scrollAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );

    animationRef.current = animation;
    animation.start();

    return () => {
      animation.stop();
    };
  }, [overflow, labelWidth, scrollAnim]);

  const labelStyles = [
    styles.label,
    isActive ? styles.labelActive : null,
    isDisabled ? styles.labelDisabled : null,
    overflow ? styles.labelOverflow : null,
  ];

  return (
    <View
      style={[
        styles.labelContainer,
        overflow ? styles.labelContainerOverflow : null,
      ]}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (Math.abs(width - containerWidth) > 1) {
          setContainerWidth(width);
        }
      }}
    >
      <AnimatedScrollView
        ref={(node) => {
          scrollRef.current = node as unknown as ScrollView | null;
        }}
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        style={styles.labelScroll}
        contentContainerStyle={[
          styles.labelScrollContent,
          overflow ? styles.labelScrollOverflow : null,
          overflow ? { width: labelWidth * 2 + MARQUEE_GAP } : null,
        ]}
      >
        <Text
          style={labelStyles}
          numberOfLines={1}
          ellipsizeMode="clip"
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            if (Math.abs(width - labelWidth) > 1) {
              setLabelWidth(width);
            }
          }}
        >
          {text}
        </Text>
        {overflow ? (
          <>
            <View style={{ width: MARQUEE_GAP }} />
            <Text
              style={labelStyles}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {text}
            </Text>
          </>
        ) : null}
  </AnimatedScrollView>
    </View>
  );
};
