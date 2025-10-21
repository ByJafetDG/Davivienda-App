import { LinearGradient } from "expo-linear-gradient";
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
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={["rgba(12, 20, 40, 0.85)", "rgba(12, 20, 40, 0.55)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { padding }]}
      >
        <View style={styles.innerShadow}>{children}</View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "rgba(12, 20, 40, 0.4)",
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
