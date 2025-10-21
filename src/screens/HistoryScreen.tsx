import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import { useBankStore, TransferRecord, RechargeRecord } from "@/store/useBankStore";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";

const FILTERS = [
  { id: "all", label: "Todo" },
  { id: "transfer", label: "Transferencias" },
  { id: "recharge", label: "Recargas" },
] as const;

type HistoryFilter = (typeof FILTERS)[number]["id"];

type TimelineItem = {
  id: string;
  type: HistoryFilter;
  title: string;
  subtitle: string;
  amount: number;
  timestamp: string;
  icon: string;
  accent: string;
};

type GroupedTimeline = {
  dayLabel: string;
  items: TimelineItem[];
};

const HistoryScreen = () => {
  const router = useRouter();
  const { transfers, recharges } = useBankStore();
  const [filter, setFilter] = useState<HistoryFilter>("all");

  const timeline = useMemo(() => {
    const transferItems: TimelineItem[] = transfers.map((record: TransferRecord) => ({
      id: record.id,
      type: "transfer",
      title: `Envío a ${record.contactName}`,
      subtitle: record.phone,
      amount: -record.amount,
      timestamp: record.createdAt,
      icon: "arrow-up-right",
      accent: "#FF3B6B",
    }));

    const rechargeItems: TimelineItem[] = recharges.map((record: RechargeRecord) => ({
      id: record.id,
      type: "recharge",
      title: `Recarga ${record.provider}`,
      subtitle: record.phone,
      amount: -record.amount,
      timestamp: record.createdAt,
      icon: "cellphone",
      accent: "#00F0FF",
    }));

    return [...transferItems, ...rechargeItems].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [transfers, recharges]);

  const filteredTimeline = useMemo(() => {
    if (filter === "all") {
      return timeline;
    }
    return timeline.filter((item: TimelineItem) => item.type === filter);
  }, [timeline, filter]);

  const groupedTimeline = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    filteredTimeline.forEach((item: TimelineItem) => {
      const dateKey = new Date(item.timestamp).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return Object.entries(groups)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map((entry): GroupedTimeline => {
        const [key, items] = entry;
        const label = new Date(key).toLocaleDateString("es-CR", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        return { dayLabel: label, items };
      });
  }, [filteredTimeline]);

  const totalTransfers = useMemo(
    () => transfers.reduce((acc, record) => acc + record.amount, 0),
    [transfers],
  );
  const totalRecharges = useMemo(
    () => recharges.reduce((acc, record) => acc + record.amount, 0),
    [recharges],
  );
  const operationsCount = transfers.length + recharges.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTotalOutflow = useMemo(
    () =>
      timeline
        .filter((item) => {
          const date = new Date(item.timestamp);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((acc, item) => acc + Math.abs(item.amount), 0),
    [timeline, currentMonth, currentYear],
  );

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
            <Text style={styles.title}>Historial de movimientos</Text>
            <View style={styles.backButton} />
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 480 }}
          >
            <GlassCard>
              <View style={styles.summaryCard}>
                <View>
                  <Text style={styles.summaryLabel}>Total transferido</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totalTransfers)}</Text>
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Total recargado</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totalRecharges)}</Text>
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Movimientos en el mes</Text>
                  <Text style={styles.summaryValue}>
                    {operationsCount > 0 ? operationsCount : "0"}
                  </Text>
                  <Text style={styles.summaryHint}>
                    Salieron {formatCurrency(monthTotalOutflow)} este mes.
                  </Text>
                </View>
              </View>
            </GlassCard>
          </MotiView>

          <View style={styles.filtersRow}>
            {FILTERS.map((item) => {
              const isActive = item.id === filter;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.filterLabel,
                      { color: isActive ? palette.textPrimary : palette.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {groupedTimeline.length === 0 ? (
            <GlassCard>
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={42}
                  color={palette.accentCyan}
                />
                <Text style={styles.emptyTitle}>Sin movimientos registrados</Text>
                <Text style={styles.emptyCopy}>
                  Realiza una transferencia o recarga para ver el resumen aquí.
                </Text>
              </View>
            </GlassCard>
          ) : (
            groupedTimeline.map((group) => (
              <MotiView
                key={group.dayLabel}
                from={{ opacity: 0, translateY: 24 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 360 }}
              >
                <GlassCard>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupLabel}>{group.dayLabel}</Text>
                  </View>
                  {group.items.map((item) => (
                    <View key={item.id} style={styles.timelineRow}>
                      <View style={[styles.iconBadge, { backgroundColor: `${item.accent}33` }]}>
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={22}
                          color={item.accent}
                        />
                      </View>
                      <View style={styles.timelineCopy}>
                        <Text style={styles.timelineTitle}>{item.title}</Text>
                        <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>
                      </View>
                      <View style={styles.timelineMeta}>
                        <Text style={styles.timelineAmount}>{formatCurrency(item.amount)}</Text>
                        <Text style={styles.timelineTime}>
                          {new Date(item.timestamp).toLocaleTimeString("es-CR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    </View>
                  ))}
                </GlassCard>
              </MotiView>
            ))
          )}
        </View>
      </ScrollView>
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 160,
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
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: 18,
    columnGap: 18,
    padding: 20,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  summaryHint: {
    color: palette.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 12,
  },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: "rgba(8, 14, 28, 0.6)",
  },
  filterChipActive: {
    borderColor: palette.accentCyan,
    backgroundColor: "rgba(0, 240, 255, 0.18)",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    padding: 28,
    alignItems: "center",
    gap: 16,
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
  },
  groupHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  groupLabel: {
    color: palette.textMuted,
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineCopy: {
    flex: 1,
    marginHorizontal: 14,
  },
  timelineTitle: {
    color: palette.textPrimary,
    fontWeight: "600",
    fontSize: 15,
  },
  timelineSubtitle: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  timelineMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  timelineAmount: {
    color: palette.danger,
    fontWeight: "700",
  },
  timelineTime: {
    color: palette.textSecondary,
    fontSize: 12,
  },
});

export default HistoryScreen;
