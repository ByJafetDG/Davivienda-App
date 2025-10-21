import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { palette } from "@/theme/colors";

const FuturisticBackground = ({ children }: PropsWithChildren) => {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[palette.background, "#061028", "#090b1f"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <MotiView
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        from={{ opacity: 0.25, translateY: -30 }}
        animate={{ opacity: 0.5, translateY: 30 }}
        transition={{ loop: true, type: "timing", duration: 9000 }}
      >
        <LinearGradient
          colors={["rgba(0, 240, 255, 0.12)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>
      <MotiView
        pointerEvents="none"
        style={styles.aurora}
        from={{ opacity: 0.2, rotate: "0deg" }}
        animate={{ opacity: 0.4, rotate: "8deg" }}
        transition={{ loop: true, type: "timing", duration: 7000 }}
      >
        <LinearGradient
          colors={["rgba(122, 43, 255, 0.25)", "rgba(0, 240, 255, 0.18)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>
      <View style={styles.noiseLayer} />
      <MotiView
        pointerEvents="none"
        style={styles.accents}
        from={{ opacity: 0.15, scale: 0.95 }}
        animate={{ opacity: 0.35, scale: 1 }}
        transition={{ loop: true, type: "timing", duration: 6000 }}
      >
        <LinearGradient
          colors={["rgba(0, 240, 255, 0.35)", "transparent"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  aurora: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ skewY: "-8deg" }],
  },
  noiseLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  accents: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
    transform: [{ rotateZ: "-6deg" }],
  },
});

export default FuturisticBackground;
