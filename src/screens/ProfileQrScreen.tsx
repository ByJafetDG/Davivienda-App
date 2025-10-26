import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { MotiView } from "moti";
import { useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import { useBankStore } from "@/store/useBankStore";
import { palette } from "@/theme/colors";

const bankLogo = require("../../assets/logo.png");

const ProfileQrScreen = () => {
  const router = useRouter();
  const { user } = useBankStore();

  const qrValue = useMemo(() => {
    return JSON.stringify({
      type: "SINPE",
      owner: user.name,
      phone: user.phone,
      idType: user.idType,
      id: user.id,
    });
  }, [user.id, user.idType, user.name, user.phone]);

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
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 520 }}
          >
            <View style={styles.header}>
              <Pressable
                style={styles.headerButton}
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Volver"
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={26}
                  color={palette.textPrimary}
                />
              </Pressable>
              <Text style={styles.title}>Código QR de tu cuenta</Text>
              <View style={styles.headerSpacer} />
            </View>

            <GlassCard>
              <View style={styles.qrCard}>
                <Text style={styles.qrTitle}>Recibe pagos al instante</Text>
                <Text style={styles.qrSubtitle}>
                  Comparte este código para que tus contactos te envíen dinero
                  vía SINPE Móvil sin escribir tu número.
                </Text>
                <View style={styles.qrFrame}>
                  <View style={styles.qrGlow} />
                  <QRCode
                    value={qrValue}
                    size={228}
                    color="#020617"
                    backgroundColor="#ffffff"
                    logo={bankLogo}
                    logoSize={60}
                    logoBackgroundColor="rgba(255,255,255,0.96)"
                    logoBorderRadius={18}
                    ecl="H"
                  />
                </View>
              </View>
            </GlassCard>

            <GlassCard>
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color={palette.accentCyan}
                    />
                  </View>
                  <View style={styles.detailCopy}>
                    <Text style={styles.detailLabel}>Titular</Text>
                    <Text style={styles.detailValue}>{user.name}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <MaterialCommunityIcons
                      name="cellphone"
                      size={20}
                      color={palette.accentCyan}
                    />
                  </View>
                  <View style={styles.detailCopy}>
                    <Text style={styles.detailLabel}>Número SINPE</Text>
                    <Text style={styles.detailValue}>{user.phone}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <MaterialCommunityIcons
                      name="card-account-details"
                      size={20}
                      color={palette.accentCyan}
                    />
                  </View>
                  <View style={styles.detailCopy}>
                    <Text style={styles.detailLabel}>Documento</Text>
                    <Text style={styles.detailValue}>
                      {user.idType} · {user.id}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>

            <View style={styles.actions}>
              <PrimaryButton
                label="Compartir"
                onPress={() => router.push("/(app)/contacts")}
              />
              <View style={styles.infoBanner}>
                <Image source={bankLogo} style={styles.bannerLogo} />
                <Text style={styles.bannerCopy}>
                  Tu código es único y se genera localmente. Si actualizas tus
                  datos, vuelve a esta pantalla para regenerarlo.
                </Text>
              </View>
            </View>
          </MotiView>
        </ScrollView>
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
    paddingHorizontal: 22,
    paddingTop: 40,
    gap: 26,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },
  qrCard: {
    padding: 26,
    gap: 18,
    alignItems: "center",
  },
  qrTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  qrSubtitle: {
    color: palette.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  qrFrame: {
    width: 260,
    height: 260,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  qrGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    bottom: -60,
    left: -60,
    backgroundColor: "rgba(99, 247, 176, 0.08)",
  },
  detailsCard: {
    padding: 24,
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(9, 22, 40, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  detailCopy: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    color: palette.textMuted,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  detailValue: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  actions: {
    gap: 18,
    paddingBottom: 80,
  },
  infoBanner: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    backgroundColor: "rgba(12, 22, 44, 0.7)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  bannerLogo: {
    width: 48,
    height: 48,
    borderRadius: 18,
    resizeMode: "contain",
  },
  bannerCopy: {
    flex: 1,
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});

export default ProfileQrScreen;
