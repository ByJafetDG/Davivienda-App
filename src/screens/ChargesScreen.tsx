import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { palette } from "@/theme/colors";

const highlights = [
  {
    key: "links",
    title: "Links de cobro",
    description: "Genera enlaces inteligentes para que tus clientes paguen en segundos.",
    icon: "link-variant",
    accent: ["#FFB786", "#FF8F5A"],
  },
  {
    key: "qr",
    title: "Códigos QR",
    description: "Crea códigos QR con montos fijos o variables y monitorea su estado.",
    icon: "qrcode-scan",
    accent: ["#63F7B0", "#1BD89C"],
  },
  {
    key: "tracking",
    title: "Seguimiento",
    description: "Recibe notificaciones cuando tus cobros se acrediten y envía recordatorios automáticos.",
    icon: "bell-badge-outline",
    accent: ["#8D84FF", "#4D3DFF"],
  },
];

const roadmap = [
  {
    key: "split",
    title: "Dividir pagos",
    description: "Divide un cobro entre varias personas y controla quién ya pagó.",
  },
  {
    key: "recurring",
    title: "Cobros recurrentes",
    description: "Configura cobros semanales o mensuales sin repetir tareas manuales.",
  },
  {
    key: "settlements",
    title: "Liquidaciones",
    description: "Envía el resumen de ingresos en PDF o Excel a fin de mes automáticamente.",
  },
];

const ChargesScreen = () => {
  const router = useRouter();

  return (
    <FuturisticBackground>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <MotiView
            style={styles.container}
            from={{ opacity: 0, translateY: 18 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420 }}
          >
            <View style={styles.header}>
              <Text style={styles.caption}>Cobros inteligentes</Text>
              <Text style={styles.title}>Cobra sin fricción</Text>
              <Text style={styles.subtitle}>
                Muy pronto podrás crear solicitudes de pago, compartirlas y dar seguimiento desde un mismo lugar.
              </Text>
            </View>

            <GlassCard>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionTitle}>¿Qué viene?</Text>
                <Text style={styles.cardHint}>Explora un adelanto de las herramientas en camino.</Text>
              </View>
              {highlights.map((item) => (
                <View key={item.key} style={styles.highlightRow}>
                  <LinearGradient
                    colors={item.accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.highlightIcon}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={22}
                      color={palette.background}
                    />
                  </LinearGradient>
                  <View style={styles.highlightCopy}>
                    <Text style={styles.highlightTitle}>{item.title}</Text>
                    <Text style={styles.highlightDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>

            <GlassCard>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionTitle}>Estamos trabajando en</Text>
                <Text style={styles.cardHint}>Tu feedback nos ayuda a priorizar las próximas funciones.</Text>
              </View>
              {roadmap.map((item) => (
                <View key={item.key} style={styles.roadmapRow}>
                  <View style={styles.roadmapBullet}>
                    <View style={styles.roadmapGlow} />
                  </View>
                  <View style={styles.roadmapCopy}>
                    <Text style={styles.roadmapTitle}>{item.title}</Text>
                    <Text style={styles.roadmapDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
              <PrimaryButton
                label="Quiero sugerir una idea"
                onPress={() => router.push("/(app)/contacts")}
                style={styles.roadmapButton}
              />
            </GlassCard>

            <GlassCard>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionTitle}>¿Necesitas cobrar ya?</Text>
                <Text style={styles.cardHint}>Usa las herramientas disponibles mientras liberamos Cobros.</Text>
              </View>
              <View style={styles.quickActions}>
                <PrimaryButton
                  label="Enviar enlace manual"
                  onPress={() => router.push("/(app)/transfer")}
                />
                <PrimaryButton
                  label="Crear recordatorio"
                  onPress={() => router.push("/(app)/notifications")}
                  style={styles.actionSpacing}
                />
              </View>
            </GlassCard>
          </MotiView>
        </ScrollView>
        <BottomNavigationBar />
      </View>
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: "relative",
  },
  scroll: {
    paddingBottom: 260,
  },
  container: {
    paddingTop: 68,
    paddingHorizontal: 24,
    gap: 24,
  },
  header: {
    gap: 12,
  },
  caption: {
    color: palette.textMuted,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontSize: 12,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  cardHeader: {
    gap: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  cardHint: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0,0,0,0.35)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  highlightCopy: {
    flex: 1,
    gap: 6,
  },
  highlightTitle: {
    color: palette.textPrimary,
    fontWeight: "700",
  },
  highlightDescription: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  roadmapRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  roadmapBullet: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  roadmapGlow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.accentCyan,
  },
  roadmapCopy: {
    flex: 1,
    gap: 6,
  },
  roadmapTitle: {
    color: palette.textPrimary,
    fontWeight: "700",
  },
  roadmapDescription: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  roadmapButton: {
    marginTop: 16,
  },
  quickActions: {
    gap: 12,
  },
  actionSpacing: {
    marginTop: 4,
  },
});

export default ChargesScreen;
