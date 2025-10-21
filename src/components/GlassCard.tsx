import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";

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
        colors={["rgba(12, 20, 40, 0.85)", "rgba(12, 20, 40, 0.55)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { padding }]}
      >
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
    borderColor: palette.border,
    backgroundColor: "rgba(12, 20, 40, 0.4)",
    shadowColor: palette.accentCyan,
    shadowOffset: { width: 0, height: 24 },
    shadowRadius: 36,
  },
  card: {
    borderRadius: 28,
  },
  innerShadow: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
});

export default GlassCard;
