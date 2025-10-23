import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { Easing } from "react-native-reanimated";

import { palette } from "@/theme/colors";

type OrbConfig = {
  size: number;
  position: Partial<Record<"top" | "left" | "right" | "bottom", number>>;
  colors: [string, string];
  translate: { x: number; y: number };
  duration: number;
  delay: number;
};

type AuroraConfig = {
  width: number;
  height: number;
  position: Partial<Record<"top" | "bottom" | "left" | "right", number>>;
  rotation: string;
  colors: [string, string];
  opacity: number;
  duration: number;
  delay: number;
};

const ORBS: OrbConfig[] = [
  {
    size: 320,
    position: { top: -140, left: -100 },
    colors: ["rgba(76, 234, 247, 0.32)", "rgba(13, 24, 60, 0.1)"],
    translate: { x: 70, y: 90 },
    duration: 14000,
    delay: 0,
  },
  {
    size: 260,
    position: { top: 160, right: -90 },
    colors: ["rgba(141, 132, 255, 0.3)", "rgba(21, 13, 52, 0.1)"],
    translate: { x: -80, y: -70 },
    duration: 11800,
    delay: 800,
  },
  {
    size: 220,
    position: { bottom: -110, left: 20 },
    colors: ["rgba(255, 134, 232, 0.28)", "rgba(25, 14, 46, 0.12)"],
    translate: { x: 40, y: -60 },
    duration: 12600,
    delay: 400,
  },
  {
    size: 180,
    position: { top: 80, left: 110 },
    colors: ["rgba(33, 245, 193, 0.24)", "rgba(10, 20, 32, 0.08)"],
    translate: { x: -40, y: 70 },
    duration: 10200,
    delay: 1200,
  },
];

const AURORAS: AuroraConfig[] = [
  {
    width: 420,
    height: 280,
    position: { top: -80, right: -120 },
    rotation: "18deg",
    colors: ["rgba(141, 132, 255, 0.22)", "rgba(0, 0, 0, 0)"],
    opacity: 0.45,
    duration: 12000,
    delay: 0,
  },
  {
    width: 360,
    height: 260,
    position: { bottom: -100, left: -60 },
    rotation: "-24deg",
    colors: ["rgba(76, 234, 247, 0.2)", "rgba(0, 0, 0, 0)"],
    opacity: 0.4,
    duration: 10800,
    delay: 600,
  },
  {
    width: 320,
    height: 220,
    position: { top: 140, left: 40 },
    rotation: "12deg",
    colors: ["rgba(255, 134, 232, 0.18)", "rgba(0, 0, 0, 0)"],
    opacity: 0.36,
    duration: 13500,
    delay: 900,
  },
];

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
      <View style={styles.noiseLayer} />
      <View pointerEvents="none" style={styles.auroraLayer}>
        {AURORAS.map((aurora, index) => (
          <MotiView
            key={`aurora-${index}`}
            style={[
              styles.aurora,
              {
                width: aurora.width,
                height: aurora.height,
                borderRadius: Math.max(aurora.width, aurora.height) / 1.8,
                ...aurora.position,
                transform: [{ rotate: aurora.rotation }],
              },
            ]}
            from={{ opacity: aurora.opacity * 0.6, scale: 0.92 }}
            animate={{ opacity: aurora.opacity, scale: 1.05 }}
            transition={{
              loop: true,
              type: "timing",
              duration: aurora.duration,
              delay: aurora.delay,
              easing: Easing.inOut(Easing.quad),
            }}
          >
            <LinearGradient
              colors={aurora.colors}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </MotiView>
        ))}
      </View>
      <View pointerEvents="none" style={styles.orbLayer}>
        {ORBS.map((orb, index) => (
          <MotiView
            key={index}
            style={[
              styles.orb,
              {
                width: orb.size,
                height: orb.size,
                borderRadius: orb.size / 2,
                ...orb.position,
              },
            ]}
            from={{
              opacity: 0.2,
              translateX: 0,
              translateY: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 0.48,
              translateX: orb.translate.x,
              translateY: orb.translate.y,
              scale: 1.05,
            }}
            transition={{
              loop: true,
              type: "timing",
              duration: orb.duration,
              delay: orb.delay,
              easing: Easing.inOut(Easing.quad),
            }}
          >
            <LinearGradient
              colors={orb.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.orbHighlight} />
          </MotiView>
        ))}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  noiseLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  auroraLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  aurora: {
    position: "absolute",
    overflow: "hidden",
    opacity: 0.4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  orbLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: "absolute",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  orbHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    opacity: 0.3,
  },
});

export default FuturisticBackground;
