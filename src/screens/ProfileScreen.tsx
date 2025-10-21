import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { ComponentProps, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import { useBankStore } from "@/store/useBankStore";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";

const ProfileScreen = () => {
  const router = useRouter();
  const { user, balance, initialBalance, transfers, recharges, logout } =
    useBankStore();

  const totals = useMemo(() => {
    const sent = transfers.reduce((acc, transfer) => acc + transfer.amount, 0);
    const recharged = recharges.reduce(
      (acc, recharge) => acc + recharge.amount,
      0,
    );
    return {
      sent,
      recharged,
      operations: transfers.length + recharges.length,
      savings: initialBalance - balance,
    };
  }, [balance, initialBalance, recharges, transfers]);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <FuturisticBackground>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
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
            <Text style={styles.title}>Tu perfil financiero</Text>
            <View style={styles.backButton} />
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
                  <Text style={styles.identityField}>Cédula: {user.id}</Text>
                  <Text style={styles.identityField}>
                    Teléfono: {user.phone}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </MotiView>

          <GlassCard>
            <View style={styles.balanceSection}>
              <Text style={styles.sectionLabel}>Saldo disponible</Text>
              <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
              <Text style={styles.balanceHint}>
                Saldo inicial: {formatCurrency(initialBalance)}
              </Text>
            </View>
          </GlassCard>

          <GlassCard>
            <View style={styles.metricsGrid}>
              <MetricTile
                label="Transferido"
                value={formatCurrency(totals.sent)}
                icon="bank-transfer-out"
                accent="#FF3B6B"
              />
              <MetricTile
                label="Recargas"
                value={formatCurrency(totals.recharged)}
                icon="cellphone-check"
                accent="#7A2BFF"
              />
              <MetricTile
                label="Operaciones"
                value={`${totals.operations}`}
                icon="timeline-clock"
                accent="#00F0FF"
              />
              <MetricTile
                label="Ahorro"
                value={formatCurrency(totals.savings)}
                icon="piggy-bank"
                accent="#4ADE80"
              />
            </View>
          </GlassCard>

          <View style={styles.actions}>
            <PrimaryButton
              label="Realizar transferencia"
              onPress={() => router.push("/(app)/transfer")}
            />
            <PrimaryButton
              label="Cerrar sesión"
              onPress={handleLogout}
              style={styles.secondaryButton}
            />
          </View>
        </View>
      </ScrollView>
    </FuturisticBackground>
  );
};

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type MetricTileProps = {
  label: string;
  value: string;
  icon: IconName;
  accent: string;
};

const MetricTile = ({ label, value, icon, accent }: MetricTileProps) => {
  return (
    <View style={styles.metricTile}>
      <View
        style={[styles.metricIcon, { backgroundColor: `${accent}1A` }]}
        accessibilityElementsHidden
      >
        <MaterialCommunityIcons name={icon} size={24} color={accent} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 140,
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
  balanceSection: {
    gap: 6,
    padding: 22,
  },
  sectionLabel: {
    color: palette.textMuted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  balanceValue: {
    color: palette.textPrimary,
    fontSize: 32,
    fontWeight: "800",
  },
  balanceHint: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    padding: 20,
    justifyContent: "space-between",
  },
  metricTile: {
    width: "47%",
    borderRadius: 20,
    backgroundColor: "rgba(8, 16, 34, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 16,
    gap: 8,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    color: palette.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metricValue: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
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
