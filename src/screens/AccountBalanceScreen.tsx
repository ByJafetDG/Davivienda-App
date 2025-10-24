﻿import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";
import {
  Envelope,
  RechargeRecord,
  TransferRecord,
  useBankStore,
} from "@/store/useBankStore";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  timestamp: string;
  icon: string;
  color: string;
};

const AccountBalanceScreen = () => {
  const router = useRouter();
  const { user, balance, transfers, recharges, envelopes, automations } =
    useBankStore();

  const envelopeById = useMemo(() => {
    const map: Record<string, Envelope> = {};
    envelopes.forEach((item: Envelope) => {
      map[item.id] = item;
    });
    return map;
  }, [envelopes]);

  const totalEnvelopeBalance = useMemo(
    () =>
      envelopes.reduce((accumulator: number, item: Envelope) => {
        return accumulator + item.balance;
      }, 0),
    [envelopes],
  );

  const activeAutomations = useMemo(
    () => automations.filter((rule) => rule.active).length,
    [automations],
  );

  const topEnvelopes = useMemo(() => {
    return [...envelopes]
      .sort((a: Envelope, b: Envelope) => b.balance - a.balance)
      .slice(0, 3);
  }, [envelopes]);

  const timeline = useMemo<ActivityItem[]>(() => {
    const transfersMapped = transfers.map((item: TransferRecord) => {
      const isInbound = item.direction === "inbound";
      const contactLabel = item.contactName || item.phone;
      const linkedEnvelope = item.linkedEnvelopeId
        ? envelopeById[item.linkedEnvelopeId]
        : undefined;
      const detailParts = [item.phone];
      if (item.note) {
        detailParts.push(item.note);
      }
      if (linkedEnvelope) {
        detailParts.push(`Automatizado a ${linkedEnvelope.name}`);
      }
      return {
        id: item.id,
        title: isInbound
          ? `Transferencia de ${contactLabel}`
          : `Transferencia a ${contactLabel}`,
        subtitle: detailParts.filter(Boolean).join(" • "),
        amount: isInbound ? item.amount : -item.amount,
        timestamp: item.createdAt,
        icon: isInbound ? "arrow-down-left" : "arrow-up-right",
        color: isInbound ? palette.success : palette.danger,
      };
    });
    const rechargesMapped = recharges.map((item: RechargeRecord) => ({
      id: item.id,
      title: `Recarga ${item.provider}`,
      subtitle: item.phone,
      amount: -item.amount,
      timestamp: item.createdAt,
      icon: "cellphone",
      color: palette.danger,
    }));

    return [...transfersMapped, ...rechargesMapped].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [transfers, recharges, envelopeById]);

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
              <View>
                <Text style={styles.caption}>SINPE Móvil</Text>
                <Text style={styles.title}>Hola, {user.name.split(" ")[0]}</Text>
              </View>
              <ProfileAvatarButton
                size={40}
                onPress={() => router.push("/(app)/profile")}
                accessibilityLabel="Ver perfil"
              />
            </View>

            <MotiView
              from={{ opacity: 0, translateY: 18, scale: 0.95 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: "timing", duration: 480 }}
            >
              <LinearGradient
                colors={["#0B1F3F", "#081027"]}
                style={styles.balanceCard}
              >
                <View style={styles.balanceGlow} />
                <Text style={styles.balanceLabel}>Saldo disponible</Text>
                <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
                <Text style={styles.balanceHint}>
                  Actualizado hace 1 min - Cuentas conectadas
                </Text>
                <View style={styles.balanceActions}>
                  <PrimaryButton
                    label="Enviar dinero ahora"
                    onPress={() => router.push("/(app)/transfer")}
                  />
                  <Pressable
                    style={styles.secondaryAction}
                    onPress={() => router.push("/(app)/history")}
                    accessibilityRole="button"
                  >
                    <Text style={styles.secondaryActionLabel}>Ver historial</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 18 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 420, delay: 60 }}
            >
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
                    <Text style={styles.historyLink}>Ver todo</Text>
                  </Pressable>
                </View>
                {timeline.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons
                      name="tray"
                      size={42}
                      color={palette.accentCyan}
                    />
                    <Text style={styles.emptyTitle}>Sin movimientos aún</Text>
                    <Text style={styles.emptyCopy}>
                      Envía dinero o realiza una recarga para ver el detalle aquí.
                    </Text>
                  </View>
                ) : (
                  timeline.slice(0, 6).map((item: ActivityItem) => (
                    <View key={item.id} style={styles.historyItem}>
                      <View style={styles.historyIconWrapper}>
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={22}
                          color={item.color}
                        />
                      </View>
                      <View style={styles.historyCopy}>
                        <Text style={styles.historyTitle}>{item.title}</Text>
                        <Text style={styles.historySubtitle}>{item.subtitle}</Text>
                      </View>
                      <Text
                        style={[styles.historyAmount, { color: item.color }]}
                      >
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>
                  ))
                )}
              </GlassCard>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 18 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 420, delay: 120 }}
            >
              <GlassCard>
                <View style={styles.envelopeHeader}>
                  <View style={styles.envelopeHeaderCopy}>
                    <Text style={styles.sectionTitle}>Sobres inteligentes</Text>
                    <Text style={styles.envelopeHint}>
                      {envelopes.length === 0
                        ? "Organiza tus ingresos en sobres para visualizar objetivos claros."
                        : `Tienes ${envelopes.length} ${
                            envelopes.length === 1 ? "sobre" : "sobres"
                          } con ${formatCurrency(totalEnvelopeBalance)} reservados.`}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => router.push("/(app)/envelopes")}
                    accessibilityRole="button"
                  >
                    <Text style={styles.historyLink}>Administrar</Text>
                  </Pressable>
                </View>

                {envelopes.length === 0 ? (
                  <View style={styles.envelopeEmpty}>
                    <MaterialCommunityIcons
                      name="wallet-plus"
                      size={44}
                      color={palette.accentCyan}
                    />
                    <Text style={styles.envelopeEmptyTitle}>Sin sobres aún</Text>
                    <Text style={styles.envelopeEmptyCopy}>
                      Crea tu primer sobre para separar dinero en categorías como
                      renta, ahorros o emergencias.
                    </Text>
                    <PrimaryButton
                      label="Crear un sobre"
                      onPress={() => router.push("/(app)/envelopes")}
                    />
                  </View>
                ) : (
                  <>
                    <View style={styles.envelopeList}>
                      {topEnvelopes.map((envelope: Envelope) => {
                        const progress =
                          envelope.targetAmount && envelope.targetAmount > 0
                            ? Math.min(envelope.balance / envelope.targetAmount, 1)
                            : null;
                        return (
                          <Pressable
                            key={envelope.id}
                            style={styles.envelopeRow}
                            onPress={() => router.push("/(app)/envelopes")}
                            accessibilityRole="button"
                          >
                            <View
                              style={[
                                styles.envelopeMarker,
                                {
                                  backgroundColor: `${envelope.color}19`,
                                  borderColor: `${envelope.color}55`,
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.envelopeDot,
                                  { backgroundColor: envelope.color },
                                ]}
                              />
                            </View>
                            <View style={styles.envelopeInfo}>
                              <Text style={styles.envelopeName}>{envelope.name}</Text>
                              <Text style={styles.envelopeMeta}>
                                {formatCurrency(envelope.balance)}
                                {envelope.targetAmount
                                  ? ` · ${Math.min(
                                      100,
                                      Math.round(
                                        (envelope.balance / envelope.targetAmount) * 100,
                                      ),
                                    )}% meta`
                                  : ""}
                              </Text>
                              {progress !== null ? (
                                <View style={styles.envelopeProgress}>
                                  <View
                                    style={[
                                      styles.envelopeProgressFill,
                                      {
                                        width: `${Math.max(4, Math.round(progress * 100))}%`,
                                        backgroundColor: envelope.color,
                                      },
                                    ]}
                                  />
                                </View>
                              ) : null}
                            </View>
                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={18}
                              color={palette.textSecondary}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={styles.envelopeFooter}>
                      <View style={styles.envelopeStat}>
                        <MaterialCommunityIcons
                          name="shield-sync"
                          size={18}
                          color={palette.accentCyan}
                        />
                        <Text style={styles.envelopeStatLabel}>
                          {activeAutomations === 0
                            ? "Sin automatizaciones activas"
                            : `${activeAutomations} ${
                                activeAutomations === 1
                                  ? "automatización activa"
                                  : "automatizaciones activas"
                              }`}
                        </Text>
                      </View>
                      <View style={styles.envelopeStat}>
                        <MaterialCommunityIcons
                          name="wallet"
                          size={18}
                          color={palette.success}
                        />
                        <Text style={styles.envelopeStatLabel}>
                          {formatCurrency(totalEnvelopeBalance)} apartados
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </GlassCard>
            </MotiView>
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
    paddingBottom: 220,
  },
  container: {
    paddingTop: 68,
    paddingHorizontal: 24,
    gap: 28,
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
  balanceCard: {
    borderRadius: 36,
    padding: 28,
    overflow: "hidden",
    gap: 22,
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
    fontSize: 44,
    fontWeight: "800",
  },
  balanceHint: {
    color: palette.textSecondary,
    fontSize: 14,
  },
  balanceActions: {
    gap: 14,
  },
  secondaryAction: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(6, 20, 45, 0.6)",
  },
  secondaryActionLabel: {
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
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  historyLink: {
    color: palette.accentCyan,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyCopy: {
    color: palette.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
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
  envelopeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    paddingBottom: 12,
  },
  envelopeHeaderCopy: {
    flex: 1,
    gap: 6,
  },
  envelopeHint: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  envelopeEmpty: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 24,
  },
  envelopeEmptyTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  envelopeEmptyCopy: {
    color: palette.textSecondary,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  envelopeList: {
    gap: 12,
  },
  envelopeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  envelopeMarker: {
    width: 46,
    height: 46,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  envelopeDot: {
    width: 18,
    height: 18,
    borderRadius: 8,
  },
  envelopeInfo: {
    flex: 1,
    gap: 4,
  },
  envelopeName: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  envelopeMeta: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  envelopeProgress: {
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  envelopeProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  envelopeFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  envelopeStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  envelopeStatLabel: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
});

export default AccountBalanceScreen;
