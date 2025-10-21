import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useMemo } from "react";
import {
  Pressable,
  PressableStateCallbackType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import {
  useBankStore,
  TransferRecord,
  RechargeRecord,
} from "@/store/useBankStore";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  timestamp: string;
  icon: string;
};

const quickActions = [
  {
    icon: "arrow-up-right-bold",
    label: "Transferir",
    route: "/(app)/transfer",
    accent: "#FF3B6B",
  },
  {
    icon: "cellphone-nfc",
    label: "Recargas",
    route: "/(app)/mobile-recharge",
    accent: "#00F0FF",
  },
  {
    icon: "qrcode-scan",
    label: "Escanear",
    route: "/(app)/scan",
    accent: "#7A2BFF",
  },
  {
    icon: "target",
    label: "Metas",
    route: "/(app)/goals",
    accent: "#4ADE80",
  },
] as const;

const AccountBalanceScreen = () => {
  const router = useRouter();
  const { user, balance, transfers, recharges } = useBankStore();

  const timeline = useMemo<ActivityItem[]>(() => {
    const transfersMapped = transfers.map((item: TransferRecord) => ({
      id: item.id,
      title: `Transferencia a ${item.contactName}`,
      subtitle: item.phone,
      amount: -item.amount,
      timestamp: item.createdAt,
      icon: "arrow-up-right",
    }));
    const rechargesMapped = recharges.map((item: RechargeRecord) => ({
      id: item.id,
      title: `Recarga ${item.provider}`,
      subtitle: item.phone,
      amount: -item.amount,
      timestamp: item.createdAt,
      icon: "cellphone",
    }));

    return [...transfersMapped, ...rechargesMapped].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [transfers, recharges]);

  return (
    <FuturisticBackground>
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
            <View>
              <Text style={styles.caption}>SINPE Móvil</Text>
              <Text style={styles.title}>Hola, {user.name.split(" ")[0]}</Text>
            </View>
            <Pressable
              onPress={() => router.push("/(app)/profile")}
              style={styles.avatarButton}
              accessibilityRole="button"
              accessibilityLabel="Ver perfil"
            >
              <LinearGradient
                colors={["#FF3B6B", "#7A2BFF"]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 20, scale: 0.95 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: "timing", duration: 600 }}
          >
            <LinearGradient
              colors={["#0B1F3F", "#081027"]}
              style={styles.balanceCard}
            >
              <View style={styles.balanceGlow} />
              <Text style={styles.balanceLabel}>Saldo disponible</Text>
              <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
              <Text style={styles.balanceHint}>
                Cuentas conectadas · Actualizado hace 1 min
              </Text>
              <PrimaryButton
                label="Enviar dinero ahora"
                onPress={() => router.push("/(app)/transfer")}
              />
            </LinearGradient>
          </MotiView>

          <View style={styles.actionsRow}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                onPress={() => router.push(action.route)}
                style={styles.actionButton}
              >
                {(state: PressableStateCallbackType) => (
                  <MotiView
                    animate={{
                      scale: state.pressed ? 0.96 : 1,
                      shadowOpacity: state.pressed ? 0.25 : 0.45,
                    }}
                    style={[styles.actionCard, { shadowColor: action.accent }]}
                  >
                    <LinearGradient
                      colors={[`${action.accent}40`, `${action.accent}15`]}
                      style={styles.actionIcon}
                    >
                      <MaterialCommunityIcons
                        name={action.icon}
                        size={24}
                        color={palette.textPrimary}
                      />
                    </LinearGradient>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </MotiView>
                )}
              </Pressable>
            ))}
          </View>

          <GlassCard>
            <View style={styles.historyHeader}>
              <View style={styles.historyTitleRow}>
                <Text style={styles.sectionTitle}>Actividad reciente</Text>
                <MaterialCommunityIcons
                  name="clock-time-eight-outline"
                  size={20}
                  color={palette.textSecondary}
                />
              </View>
              <Pressable
                onPress={() => router.push("/(app)/history")}
                accessibilityRole="button"
              >
                <Text style={styles.historyLink}>Ver historial</Text>
              </Pressable>
            </View>
            {timeline.length === 0 ? (
              <Text style={styles.emptyState}>
                Todavía no hay movimientos. Comienza enviando o recargando.
              </Text>
            ) : (
              timeline.slice(0, 6).map((item: ActivityItem) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyIconWrapper}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={22}
                      color={palette.textPrimary}
                    />
                  </View>
                  <View style={styles.historyCopy}>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <Text style={styles.historySubtitle}>{item.subtitle}</Text>
                  </View>
                  <Text
                    style={[styles.historyAmount, { color: palette.danger }]}
                  >
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))
            )}
          </GlassCard>
        </MotiView>
      </ScrollView>
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 120,
  },
  container: {
    paddingTop: 68,
    paddingHorizontal: 24,
    gap: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  avatarText: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
  balanceCard: {
    borderRadius: 36,
    padding: 28,
    overflow: "hidden",
    gap: 18,
  },
  balanceGlow: {
    position: "absolute",
    top: -80,
    right: -80,
    bottom: -80,
    left: -80,
    borderRadius: 400,
    backgroundColor: "rgba(0, 240, 255, 0.12)",
  },
  balanceLabel: {
    color: palette.textMuted,
    fontSize: 14,
    letterSpacing: 0.8,
  },
  balanceValue: {
    color: palette.textPrimary,
    fontSize: 40,
    fontWeight: "800",
  },
  balanceHint: {
    color: palette.textSecondary,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  actionButton: {
    flexBasis: "48%",
    flexGrow: 1,
  },
  actionCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 20,
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(8, 13, 26, 0.8)",
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 24,
  },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: palette.textPrimary,
    fontWeight: "600",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  historyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyLink: {
    color: palette.accentCyan,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyState: {
    color: palette.textMuted,
    fontSize: 14,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  historyIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "rgba(125, 142, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  historyCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  historyTitle: {
    color: palette.textPrimary,
    fontWeight: "600",
  },
  historySubtitle: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  historyAmount: {
    fontWeight: "700",
  },
});

export default AccountBalanceScreen;
