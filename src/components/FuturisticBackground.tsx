import { LinearGradient } from "expo-linear-gradient";
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
      <View style={styles.noiseLayer} />
      <LinearGradient
        colors={["rgba(0, 240, 255, 0.25)", "transparent"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.accents}
      />
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
  accents: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
    transform: [{ rotateZ: "-6deg" }],
  },
});

export default FuturisticBackground;
