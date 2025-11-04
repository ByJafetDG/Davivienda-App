import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { palette } from "@/theme/colors";

export type GlassCardProps = PropsWithChildren<{
  intensity?: number;
  padding?: number;
}>;

const GlassCard = ({
  children,
  intensity = 30,
  padding = 20,
}: GlassCardProps) => {
  const glowOpacity = Math.min(intensity / 100, 0.45);
  return (
    <MotiView
      style={[styles.wrapper, { shadowOpacity: glowOpacity }]}
      from={{ opacity: 0, translateY: 18, scale: 0.98 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "timing", duration: 320 }}
    >
      <LinearGradient
        colors={["rgba(194, 61, 56, 0.78)", "rgba(122, 24, 28, 0.58)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { padding }]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.blurVeil,
            { opacity: Math.min(0.32, 0.18 + intensity / 260) },
          ]}
        />
        <MotiView
          from={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 400, delay: 120 }}
          style={styles.innerShadow}
        >
          {children}
        </MotiView>
      </LinearGradient>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
  borderColor: "rgba(252, 252, 252, 0.99)",
  backgroundColor: "rgba(86, 86, 86, 0.48)",
  shadowColor: "rgba(0, 0, 0, 0.38)",
    shadowOffset: { width: 0, height: 24 },
    shadowRadius: 36,
  },
  card: {
    borderRadius: 28,
  },
  blurVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 220, 216, 0.18)",
  },
  innerShadow: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 211, 204, 0.12)",
  },
});

export default GlassCard;
