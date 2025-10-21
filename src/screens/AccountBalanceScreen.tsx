import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useMemo, useState } from "react";
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
import { useAutomationStore } from "@/store/useAutomationStore";
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
    icon: "account-box-outline",
    label: "Contactos",
    route: "/(app)/contacts",
    accent: "#FF8A65",
  },
  {
    icon: "qrcode-scan",
    label: "Escanear",
    route: "/(app)/scan",
    accent: "#7A2BFF",
  },
] as const;

const navSections = [
  { key: "shortcuts", label: "Accesos", icon: "view-grid-outline" },
  { key: "insights", label: "Insights", icon: "chart-line" },
  { key: "automations", label: "Automatiza", icon: "robot" },
] as const;

type NavSectionKey = (typeof navSections)[number]["key"];

const automationIconByType: Record<string, string> = {
  roundup: "piggy-bank",
  "auto-recharge": "cellphone-check",
  "budget-alert": "bell-alert",
  "scheduled-transfer": "calendar-clock",
};

const AccountBalanceScreen = () => {
  const router = useRouter();
  const { user, balance, transfers, recharges, notifications } = useBankStore();
  const { automations } = useAutomationStore();
  const [activeSection, setActiveSection] = useState<NavSectionKey>("shortcuts");

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

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const totalTransfers = useMemo(
    () => transfers.reduce((acc, item) => acc + item.amount, 0),
    [transfers],
  );
  const totalRecharges = useMemo(
    () => recharges.reduce((acc, item) => acc + item.amount, 0),
    [recharges],
  );
  const combinedOutflow = totalTransfers + totalRecharges;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTransfers = useMemo(
    () =>
      transfers.filter((item: TransferRecord) => {
        const created = new Date(item.createdAt);
        return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
      }),
    [transfers, currentMonth, currentYear],
  );

  const monthRecharges = useMemo(
    () =>
      recharges.filter((item: RechargeRecord) => {
        const created = new Date(item.createdAt);
        return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
      }),
    [recharges, currentMonth, currentYear],
  );

  const monthTotal = useMemo(
    () =>
      monthTransfers.reduce((acc, item) => acc + item.amount, 0) +
      monthRecharges.reduce((acc, item) => acc + item.amount, 0),
    [monthTransfers, monthRecharges],
  );

  const topRecipient = useMemo(() => {
    const accumulator = new Map<string, { amount: number; phone: string }>();
    transfers.forEach((item: TransferRecord) => {
      const key = item.contactName || item.phone;
      const entry = accumulator.get(key) || { amount: 0, phone: item.phone };
      entry.amount += item.amount;
      accumulator.set(key, entry);
    });
    const sorted = Array.from(accumulator.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount);
    return sorted[0] ?? null;
  }, [transfers]);

  const activeAutomations = useMemo(
    () => automations.filter((item) => item.active),
    [automations],
  );
  const previewAutomations = useMemo(
    () => automations.slice(0, 2),
    [automations],
  );

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
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 360, delay: 40 }}
          >
            <View style={styles.navBar}>
              {navSections.map((section) => {
                const isActive = section.key === activeSection;
                return (
                  <Pressable
                    key={section.key}
                    onPress={() => setActiveSection(section.key)}
                    accessibilityRole="button"
                    style={styles.navPressable}
                  >
                    <MotiView
                      animate={{
                        scale: isActive ? 1 : 0.96,
                        opacity: isActive ? 1 : 0.72,
                      }}
                      transition={{ type: "timing", duration: 180 }}
                      style={[styles.navPill, isActive ? styles.navPillActive : null]}
                    >
                      <MaterialCommunityIcons
                        name={section.icon as any}
                        size={18}
                        color={isActive ? palette.textPrimary : palette.textSecondary}
                      />
                      <Text
                        style={[styles.navLabel, isActive ? styles.navLabelActive : null]}
                      >
                        {section.label}
                      </Text>
                    </MotiView>
                  </Pressable>
                );
              })}
            </View>
          </MotiView>

          {activeSection === "shortcuts" ? (
            <MotiView
              from={{ opacity: 0, translateY: 18 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 360, delay: 80 }}
            >
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
            </MotiView>
          ) : null}

          {activeSection === "insights" ? (
            <MotiView
              from={{ opacity: 0, translateY: 18 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 360, delay: 80 }}
            >
              <GlassCard>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Resumen rápido</Text>
                    <Text style={styles.cardHint}>Controla tu flujo desde aquí mismo.</Text>
                  </View>
                  <Pressable onPress={() => router.push("/(app)/insights")} accessibilityRole="button">
                    <Text style={styles.linkLabel}>Abrir</Text>
                  </Pressable>
                </View>
                <View style={styles.insightGrid}>
                  <View style={styles.insightItem}>
                    <Text style={styles.insightLabel}>Mes en curso</Text>
                    <Text style={styles.insightValue}>{formatCurrency(monthTotal)}</Text>
                    <Text style={styles.insightHint}>Transferencias y recargas.</Text>
                  </View>
                  <View style={styles.insightItem}>
                    <Text style={styles.insightLabel}>Salida acumulada</Text>
                    <Text style={styles.insightValue}>{formatCurrency(combinedOutflow)}</Text>
                    <Text style={styles.insightHint}>Promedio diario {formatCurrency(monthTotal / Math.max(1, now.getDate()))}.</Text>
                  </View>
                  <View style={styles.insightItem}>
                    <Text style={styles.insightLabel}>Alertas</Text>
                    <Text style={styles.insightValue}>{unreadNotifications}</Text>
                    <Text style={styles.insightHint}>Notificaciones pendientes.</Text>
                  </View>
                </View>
                {topRecipient ? (
                  <View style={styles.topRecipientRow}>
                    <View style={styles.topRecipientIcon}>
                      <MaterialCommunityIcons
                        name="account"
                        size={20}
                        color={palette.textPrimary}
                      />
                    </View>
                    <View style={styles.topRecipientCopy}>
                      <Text style={styles.topRecipientTitle}>{topRecipient.name}</Text>
                      <Text style={styles.topRecipientSubtitle}>{topRecipient.phone}</Text>
                    </View>
                    <Text style={styles.topRecipientAmount}>{formatCurrency(topRecipient.amount)}</Text>
                  </View>
                ) : null}
                <View style={styles.insightChips}>
                  <Pressable
                    onPress={() => router.push("/(app)/notifications")}
                    style={styles.chip}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons
                      name="bell-ring"
                      size={16}
                      color={palette.textPrimary}
                    />
                    <Text style={styles.chipLabel}>Alertas</Text>
                    {unreadNotifications > 0 ? (
                      <View style={styles.chipBadge}>
                        <Text style={styles.chipBadgeText}>
                          {unreadNotifications > 9 ? "9+" : unreadNotifications}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                  <Pressable
                    onPress={() => router.push("/(app)/goals")}
                    style={styles.chip}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons
                      name="target"
                      size={16}
                      color={palette.textPrimary}
                    />
                    <Text style={styles.chipLabel}>Metas</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push("/(app)/insights")}
                    style={styles.chip}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons
                      name="chart-line"
                      size={16}
                      color={palette.textPrimary}
                    />
                    <Text style={styles.chipLabel}>Detalles</Text>
                  </Pressable>
                </View>
              </GlassCard>
            </MotiView>
          ) : null}

          {activeSection === "automations" ? (
            <MotiView
              from={{ opacity: 0, translateY: 18 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 360, delay: 80 }}
            >
              <GlassCard>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Automatizaciones</Text>
                    <Text style={styles.cardHint}>
                      {activeAutomations.length} activas · {automations.length} configuradas.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => router.push("/(app)/automations")}
                    accessibilityRole="button"
                  >
                    <Text style={styles.linkLabel}>Gestionar</Text>
                  </Pressable>
                </View>
                {automations.length === 0 ? (
                  <Text style={styles.emptyState}>
                    Crea tu primera automatización para verla aquí.
                  </Text>
                ) : (
                  previewAutomations.map((automation) => {
                    const iconName = automationIconByType[automation.type] || "rocket-launch";
                    return (
                      <View key={automation.id} style={styles.autoRow}>
                        <View style={styles.autoIcon}>
                          <MaterialCommunityIcons
                            name={iconName as any}
                            size={20}
                            color={palette.textPrimary}
                          />
                        </View>
                        <View style={styles.autoCopy}>
                          <Text style={styles.autoTitle}>{automation.title}</Text>
                          <Text style={styles.autoDescription}>{automation.description}</Text>
                        </View>
                        <View
                          style={[styles.autoStatus, automation.active ? styles.autoStatusActive : styles.autoStatusPaused]}
                        >
                          <Text style={styles.autoStatusLabel}>
                            {automation.active ? "Activa" : "Pausada"}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
                <PrimaryButton
                  label={automations.length === 0 ? "Crear automatización" : "Abrir panel"}
                  onPress={() => router.push("/(app)/automations")}
                  style={styles.autoButton}
                />
              </GlassCard>
            </MotiView>
          ) : null}

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
    position: "relative",
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
  actionBadge: {
    position: "absolute",
    top: 12,
    right: 18,
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: palette.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBadgeText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  navPressable: {
    flex: 1,
  },
  navPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  navPillActive: {
    backgroundColor: "rgba(0, 240, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.35)",
  },
  navLabel: {
    color: palette.textSecondary,
    fontWeight: "600",
  },
  navLabelActive: {
    color: palette.textPrimary,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  cardHint: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  linkLabel: {
    color: palette.accentCyan,
    fontWeight: "600",
    fontSize: 13,
  },
  insightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    paddingBottom: 8,
  },
  insightItem: {
    flexBasis: "48%",
    gap: 6,
  },
  insightLabel: {
    color: palette.textMuted,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  insightValue: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  insightHint: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  topRecipientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  topRecipientIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  topRecipientCopy: {
    flex: 1,
    gap: 2,
  },
  topRecipientTitle: {
    color: palette.textPrimary,
    fontWeight: "700",
  },
  topRecipientSubtitle: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  topRecipientAmount: {
    color: palette.textPrimary,
    fontWeight: "700",
  },
  insightChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  chipLabel: {
    color: palette.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },
  chipBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: palette.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  chipBadgeText: {
    color: palette.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  autoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  autoIcon: {
    width: 40,
    height: 40,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 240, 255, 0.08)",
  },
  autoCopy: {
    flex: 1,
    gap: 4,
  },
  autoTitle: {
    color: palette.textPrimary,
    fontWeight: "700",
  },
  autoDescription: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  autoStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  autoStatusActive: {
    backgroundColor: "rgba(0, 224, 184, 0.16)",
  },
  autoStatusPaused: {
    backgroundColor: "rgba(255, 94, 91, 0.16)",
  },
  autoStatusLabel: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  autoButton: {
    marginTop: 18,
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
