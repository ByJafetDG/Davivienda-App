import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { MotiView } from "moti";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import { useBankStore } from "@/store/useBankStore";
import { palette } from "@/theme/colors";

const bankLogo = require("../../assets/logo.png");

const ProfileScreen = () => {
  const router = useRouter();
  const { user, logout } = useBankStore();

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const qrPreviewValue = useMemo(() => {
    return JSON.stringify({
      type: "SINPE",
      owner: user.name,
      phone: user.phone,
    });
  }, [user.name, user.phone]);

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
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 480 }}
          >
            <View style={styles.header}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.push("/(app)/home")}
                accessibilityRole="button"
                accessibilityLabel="Volver"
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={26}
                  color={palette.textPrimary}
                />
              </Pressable>
              <Text style={styles.title}>Tu perfil financiero</Text>
              <View style={styles.headerSpacer} />
            </View>

            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500 }}
            >
              <GlassCard>
                <View style={styles.identityCard}>
                  <View style={styles.avatarWrapper}>
                    <Text style={styles.avatarLabel}>{user.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.identityCopy}>
                    <Text style={styles.identityName}>{user.name}</Text>
                    <Text style={styles.identityField}>
                      Documento: {user.idType}
                    </Text>
                    <Text style={styles.identityField}>Número: {user.id}</Text>
                    <Text style={styles.identityField}>
                      Teléfono: {user.phone}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </MotiView>

            <GlassCard>
              <View style={styles.qrPreview}>
                <View style={styles.qrCopy}>
                  <Text style={styles.qrLabel}>Tu código QR</Text>
                  <Text style={styles.qrDescription}>
                    Comparte un código personalizado para recibir dinero sin
                    errores.
                  </Text>
                  <PrimaryButton
                    label="Ver código"
                    onPress={() => router.push("/(app)/profile-qr")}
                    style={styles.qrButton}
                    compact
                  />
                </View>
                <View style={styles.qrMiniFrame}>
                  <QRCode
                    value={qrPreviewValue}
                    size={96}
                    color="#020617"
                    backgroundColor="#ffffff"
                    logo={bankLogo}
                    logoSize={28}
                    logoBackgroundColor="rgba(255,255,255,0.95)"
                    logoBorderRadius={12}
                    ecl="H"
                  />
                </View>
              </View>
            </GlassCard>
            <View style={styles.actions}>
              <PrimaryButton
                label="Ajustes"
                onPress={() => router.push("/(app)/settings")}
              />
              <PrimaryButton
                label="Cerrar sesión"
                onPress={handleLogout}
                style={styles.secondaryButton}
              />
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
    paddingHorizontal: 20,
    paddingTop: 40,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    padding: 20,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: "rgba(0, 240, 255, 0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    color: palette.textPrimary,
    fontSize: 34,
    fontWeight: "800",
  },
  identityCopy: {
    flex: 1,
    gap: 6,
  },
  identityName: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  identityField: {
    color: palette.textSecondary,
    fontSize: 14,
  },
  qrPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    padding: 22,
  },
  qrCopy: {
    flex: 1,
    gap: 10,
  },
  qrButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 0,
    marginTop: 6,
  },
  qrLabel: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  qrDescription: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  qrMiniFrame: {
    width: 120,
    height: 120,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  actions: {
    gap: 16,
    paddingBottom: 60,
  },
  secondaryButton: {
    backgroundColor: "#1B2C49",
  },
});

export default ProfileScreen;
