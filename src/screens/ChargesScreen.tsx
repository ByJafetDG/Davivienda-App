import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Share } from "react-native";
import MarqueeText from "@/components/MarqueeText";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import NeonTextField from "@/components/NeonTextField";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { RechargeRecord, TransferRecord, useBankStore } from "@/store/useBankStore";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";
import { formatAmountDisplay, parseAmountToNumber, sanitizeAmountInput } from "@/utils/amount";
import { createId } from "@/utils/id";

type RecurringFrequency = "weekly" | "biweekly" | "monthly";

type SplitResult = {
  id: string;
  label: string;
  total: number;
  participants: Array<{ id: string; name: string; amount: number }>;
  remainderReceivers: number;
  createdAt: string;
};

type RecurringChargeView = {
  id: string;
  label: string;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string;
  nextRuns: string[];
  createdAt: string;
};

type MonthOption = {
  key: string;
  year: number;
  monthIndex: number;
  label: string;
};

const FREQUENCY_OPTIONS: Array<{ id: RecurringFrequency; label: string; description: string; icon: string }> = [
  { id: "weekly", label: "Semanal", description: "Cada 7 días", icon: "calendar-week" },
  { id: "biweekly", label: "Quincenal", description: "Cada 14 días", icon: "calendar-range" },
  { id: "monthly", label: "Mensual", description: "Cada mes", icon: "calendar-month" },
];

const monthFormatter = new Intl.DateTimeFormat("es-CR", { month: "long", year: "numeric" });
const dateFormatter = new Intl.DateTimeFormat("es-CR", { day: "numeric", month: "short" });

const buildMonthOptions = (count = 6): MonthOption[] => {
  const now = new Date();
  return Array.from({ length: count }, (_item, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
      label: monthFormatter.format(date),
    };
  });
};

const computeMonthlySummary = (
  option: MonthOption | undefined,
  transfers: TransferRecord[],
  recharges: RechargeRecord[],
) => {
  if (!option) {
    return {
      inboundTotal: 0,
      inboundCount: 0,
      outboundTotal: 0,
      outboundCount: 0,
      rechargeTotal: 0,
      rechargeCount: 0,
      netFlow: 0,
      topInbound: [] as Array<{ name: string; amount: number }>,
      topOutbound: [] as Array<{ name: string; amount: number }>,
    };
  }

  const start = new Date(option.year, option.monthIndex, 1);
  const end = new Date(option.year, option.monthIndex + 1, 1);

  let inboundTotal = 0;
  let inboundCount = 0;
  let outboundTotal = 0;
  let outboundCount = 0;

  const inboundByContact = new Map<string, number>();
  const outboundByContact = new Map<string, number>();

  transfers.forEach((transfer: TransferRecord) => {
    const date = new Date(transfer.createdAt);
    if (Number.isNaN(date.getTime()) || date < start || date >= end) {
      return;
    }
    if (transfer.direction === "inbound") {
      inboundTotal += transfer.amount;
      inboundCount += 1;
      const key = transfer.contactName || transfer.phone;
      inboundByContact.set(key, (inboundByContact.get(key) ?? 0) + transfer.amount);
    } else {
      outboundTotal += transfer.amount;
      outboundCount += 1;
      const key = transfer.contactName || transfer.phone;
      outboundByContact.set(key, (outboundByContact.get(key) ?? 0) + transfer.amount);
    }
  });

  let rechargeTotal = 0;
  let rechargeCount = 0;

  recharges.forEach((recharge: RechargeRecord) => {
    const date = new Date(recharge.createdAt);
    if (Number.isNaN(date.getTime()) || date < start || date >= end) {
      return;
    }
    rechargeTotal += recharge.amount;
    rechargeCount += 1;
  });

  const netFlow = inboundTotal - (outboundTotal + rechargeTotal);

  const topInbound = Array.from(inboundByContact.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }));

  const topOutbound = Array.from(outboundByContact.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }));

  return {
    inboundTotal,
    inboundCount,
    outboundTotal,
    outboundCount,
    rechargeTotal,
    rechargeCount,
    netFlow,
    topInbound,
    topOutbound,
  };
};

const computeOccurrences = (start: Date, frequency: RecurringFrequency, count: number) => {
  const occurrences: Date[] = [];
  const current = new Date(start);
  while (occurrences.length < count) {
    occurrences.push(new Date(current));
    if (frequency === "weekly") {
      current.setDate(current.getDate() + 7);
    } else if (frequency === "biweekly") {
      current.setDate(current.getDate() + 14);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }
  return occurrences;
};

const ChargesScreen = () => {
  const router = useRouter();
  const { transfers, recharges, createEnvelope } = useBankStore();

  const [splitLabel, setSplitLabel] = useState("");
  const [participantsInput, setParticipantsInput] = useState("");
  const [splitAmountRaw, setSplitAmountRaw] = useState("");
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [splitStatus, setSplitStatus] = useState<string | null>(null);

  const [recurringLabel, setRecurringLabel] = useState("");
  const [recurringAmountRaw, setRecurringAmountRaw] = useState("");
  const [recurringStartDate, setRecurringStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>("monthly");
  const [recurringCharges, setRecurringCharges] = useState<RecurringChargeView[]>([]);
  const [recurringError, setRecurringError] = useState<string | null>(null);
  const [recurringStatus, setRecurringStatus] = useState<string | null>(null);

  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => monthOptions[0]?.key ?? "");
  const selectedMonth = monthOptions.find((option) => option.key === selectedMonthKey) ?? monthOptions[0];
  const settlementSummary = useMemo(
    () => computeMonthlySummary(selectedMonth, transfers, recharges),
    [selectedMonth, transfers, recharges],
  );
  const [settlementStatus, setSettlementStatus] = useState<string | null>(null);

  const handleSplitLabelChange = (value: string) => {
    setSplitStatus(null);
    setSplitLabel(value);
  };

  const handleParticipantsChange = (value: string) => {
    setSplitError(null);
    setSplitStatus(null);
    setParticipantsInput(value);
  };

  const handleSplitAmountChange = (value: string) => {
    setSplitError(null);
    setSplitStatus(null);
    setSplitAmountRaw(sanitizeAmountInput(value));
  };

  const handleCalculateSplit = () => {
    setSplitStatus(null);

    const names = participantsInput
      .split(/[,;\n]/)
      .map((name) => name.trim())
      .filter(Boolean);

    const total = parseAmountToNumber(splitAmountRaw);

    if (names.length < 2) {
      setSplitError("Indica al menos dos participantes para dividir el monto.");
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      setSplitError("Ingresa un monto total válido.");
      return;
    }

    const totalCents = Math.round(total * 100);
    const baseShare = Math.floor(totalCents / names.length);
    const remainder = totalCents - baseShare * names.length;

    const participants = names.map((name, index) => {
      const cents = baseShare + (index < remainder ? 1 : 0);
      return {
        id: createId("split-participant"),
        name,
        amount: cents / 100,
      };
    });

    setSplitResult({
      id: createId("split"),
      label: splitLabel.trim() || "Cobro compartido",
      total,
      participants,
      remainderReceivers: remainder,
      createdAt: new Date().toISOString(),
    });
    setSplitError(null);
    setSplitStatus("Reparto generado. Envía el enlace personalizado a cada participante.");
  };

  const handleGenerateLinks = async () => {
    if (!splitResult) {
      return;
    }
    // Crear sobre en el store
    const sobreDraft = {
      name: splitResult.label,
      description: `Sobre generado automáticamente para ${splitResult.participants.map(p => p.name).join(", ")}`,
      targetAmount: splitResult.total,
    };
    const sobre = createEnvelope(sobreDraft);
    // Simular link único
    const link = `https://davivienda-app.com/sobre/${sobre.id}`;
    // Mensaje para compartir
    const message = `¡Aporta a nuestro sobre \"${sobre.name}\"! Participantes: ${splitResult.participants.map(p => p.name).join(", ")}. Ingresa aquí: ${link}`;
    try {
      await Share.share({ message });
      setSplitStatus("Enlace a sobre generado y listo para compartir.");
    } catch (error) {
      setSplitStatus("No se pudo compartir el enlace. Intenta de nuevo.");
    }
  };

  const handleRecurringLabelChange = (value: string) => {
    setRecurringError(null);
    setRecurringStatus(null);
    setRecurringLabel(value);
  };

  const handleRecurringAmountChange = (value: string) => {
    setRecurringError(null);
    setRecurringStatus(null);
    setRecurringAmountRaw(sanitizeAmountInput(value));
  };

  const handleRecurringStartDateChange = (value: string) => {
    setRecurringError(null);
    setRecurringStatus(null);
    setRecurringStartDate(value);
  };

  const handleFrequencySelect = (value: RecurringFrequency) => {
    setRecurringError(null);
    setRecurringStatus(null);
    setRecurringFrequency(value);
  };

  const handleAddRecurringCharge = () => {
    setRecurringStatus(null);

    const label = recurringLabel.trim();
    const amount = parseAmountToNumber(recurringAmountRaw);
    const start = new Date(recurringStartDate);

    if (!label) {
      setRecurringError("Asigna un nombre al cobro recurrente.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setRecurringError("Ingresa un monto válido.");
      return;
    }
    if (Number.isNaN(start.getTime())) {
      setRecurringError("Selecciona una fecha de inicio válida (AAAA-MM-DD).");
      return;
    }

    const occurrences = computeOccurrences(start, recurringFrequency, 4).map((date) => date.toISOString());

    const charge: RecurringChargeView = {
      id: createId("recurring"),
      label,
      amount,
      frequency: recurringFrequency,
      startDate: start.toISOString(),
      nextRuns: occurrences,
      createdAt: new Date().toISOString(),
    };

    setRecurringCharges((prev) => [charge, ...prev].slice(0, 6));
    setRecurringError(null);
    setRecurringStatus("Programamos tu recordatorio recurrente. Confirmaremos cada envío automáticamente.");
    setRecurringLabel("");
    setRecurringAmountRaw("");
  };

  const handleSelectMonth = (key: string) => {
    setSettlementStatus(null);
    setSelectedMonthKey(key);
  };

  const handleGenerateSettlement = () => {
    const monthLabel = selectedMonth?.label ?? "este periodo";
    setSettlementStatus(`Liquidación de ${monthLabel} generada. La encontrarás en tu bandeja de documentos.`);
  };

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
              <View style={styles.headerCopy}>
                <Text style={styles.caption}>Cobros inteligentes</Text>
                <Text style={styles.title}>Cobra sin fricción</Text>
                <Text style={styles.subtitle}>
                  Administra enlaces compartidos, programaciones recurrentes y resúmenes automáticos desde un solo lugar.
                </Text>
              </View>
              <ProfileAvatarButton
                size={40}
                onPress={() => router.push("/(app)/profile")}
                accessibilityLabel="Ir a tu perfil"
                style={styles.profileShortcut}
              />
            </View>

            <GlassCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderTextWrap}>
                  <Text style={styles.sectionTitle}>Dividir pagos</Text>
                  <MarqueeText
                    text="Ingresa a tus participantes, reparte el monto automáticamente y genera enlaces individuales."
                    containerStyle={styles.cardHintContainer}
                    textStyle={styles.cardHint}
                  />
                </View>
                <View style={styles.cardHeaderIconWrap}>
                  <MaterialCommunityIcons name="account-group" size={22} color={palette.accentCyan} />
                </View>
              </View>

              {splitStatus ? <Text style={styles.statusMessage}>{splitStatus}</Text> : null}
              {splitError ? <Text style={styles.errorMessage}>{splitError}</Text> : null}

              <View style={styles.fieldGroup}>
                <NeonTextField
                  label="Nombre del cobro"
                  placeholder="Cena del equipo"
                  value={splitLabel}
                  onChangeText={handleSplitLabelChange}
                  icon={
                    <MaterialCommunityIcons name="notebook-outline" size={20} color={palette.accentCyan} />
                  }
                />
                <NeonTextField
                  label="Participantes"
                  placeholder="Ana, José, Laura"
                  value={participantsInput}
                  onChangeText={handleParticipantsChange}
                  helpText="Separa los nombres con comas o saltos de línea."
                  icon={
                    <MaterialCommunityIcons name="account-multiple" size={20} color={palette.accentCyan} />
                  }
                />
                <NeonTextField
                  label="Monto total"
                  placeholder="₡75,000"
                  value={formatAmountDisplay(splitAmountRaw)}
                  onChangeText={handleSplitAmountChange}
                  keyboardType="decimal-pad"
                  allowOnlyNumeric
                  icon={
                    <MaterialCommunityIcons name="currency-usd" size={20} color={palette.accentCyan} />
                  }
                />
              </View>

              <PrimaryButton
                label="Calcular reparto"
                onPress={handleCalculateSplit}
                style={styles.sectionButton}
              />

              {splitResult ? (
                <View style={styles.splitResult}>
                  <View style={styles.splitSummaryRow}>
                    <Text style={styles.splitSummaryLabel}>{splitResult.label}</Text>
                    <Text style={styles.splitSummaryAmount}>{formatCurrency(splitResult.total)}</Text>
                  </View>
                  <View style={styles.resultsList}>
                    {splitResult.participants.map((participant) => (
                      <View key={participant.id} style={styles.resultRow}>
                        <View style={styles.resultNameRow}>
                          <MaterialCommunityIcons
                            name="account-circle-outline"
                            size={20}
                            color={palette.textSecondary}
                          />
                          <Text style={styles.resultName}>{participant.name}</Text>
                        </View>
                        <Text style={styles.resultAmount}>{formatCurrency(participant.amount)}</Text>
                      </View>
                    ))}
                  </View>
                  {splitResult.remainderReceivers > 0 ? (
                    <Text style={styles.resultHint}>
                      {splitResult.remainderReceivers === 1
                        ? "Sumamos ₡0.01 adicional a la primera persona para cuadrar el total."
                        : `Sumamos ₡0.01 adicional a las primeras ${splitResult.remainderReceivers} personas para cuadrar el total.`}
                    </Text>
                  ) : null}
                  <PrimaryButton
                    label="Generar enlace a sobre"
                    onPress={handleGenerateLinks}
                    style={styles.secondaryButton}
                  />
                </View>
              ) : null}
            </GlassCard>

            <GlassCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderTextWrap}>
                  <Text style={styles.sectionTitle}>Cobros recurrentes</Text>
                  <MarqueeText
                    text="Programa recordatorios automáticos para membresías, rentas o cobros periódicos."
                    containerStyle={styles.cardHintContainer}
                    textStyle={styles.cardHint}
                  />
                </View>
                <View style={styles.cardHeaderIconWrap}>
                  <MaterialCommunityIcons name="autorenew" size={22} color={palette.accentCyan} />
                </View>
              </View>

              {recurringStatus ? <Text style={styles.statusMessage}>{recurringStatus}</Text> : null}
              {recurringError ? <Text style={styles.errorMessage}>{recurringError}</Text> : null}

              <View style={styles.fieldGroup}>
                <NeonTextField
                  label="Nombre del cobro"
                  placeholder="Suscripción gimnasio"
                  value={recurringLabel}
                  onChangeText={handleRecurringLabelChange}
                  icon={
                    <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={palette.accentCyan} />
                  }
                />
                <NeonTextField
                  label="Monto"
                  placeholder="₡15,000"
                  value={formatAmountDisplay(recurringAmountRaw)}
                  onChangeText={handleRecurringAmountChange}
                  keyboardType="decimal-pad"
                  allowOnlyNumeric
                  icon={
                    <MaterialCommunityIcons name="cash-sync" size={20} color={palette.accentCyan} />
                  }
                />
                <NeonTextField
                  label="Fecha de inicio"
                  placeholder="2025-10-15"
                  value={recurringStartDate}
                  onChangeText={handleRecurringStartDateChange}
                  keyboardType="numbers-and-punctuation"
                  helpText="Formato AAAA-MM-DD"
                  icon={
                    <MaterialCommunityIcons name="calendar" size={20} color={palette.accentCyan} />
                  }
                />
              </View>

              <View style={styles.chipRow}>
                {FREQUENCY_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => handleFrequencySelect(option.id)}
                    style={[
                      styles.chip,
                      recurringFrequency === option.id && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        recurringFrequency === option.id && styles.chipLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.chipDescription}>{option.description}</Text>
                  </Pressable>
                ))}
              </View>

              <PrimaryButton
                label="Programar cobro"
                onPress={handleAddRecurringCharge}
                style={styles.sectionButton}
              />

              {recurringCharges.length > 0 ? (
                <View style={styles.recurringList}>
                  {recurringCharges.map((charge) => (
                    <View key={charge.id} style={styles.recurringItem}>
                      <View style={styles.recurringHeaderRow}>
                        <Text style={styles.recurringTitle}>{charge.label}</Text>
                        <Text style={styles.recurringAmount}>{formatCurrency(charge.amount)}</Text>
                      </View>
                      <Text style={styles.recurringMeta}>
                        {FREQUENCY_OPTIONS.find((item) => item.id === charge.frequency)?.label ?? ""} · Inicio {dateFormatter.format(new Date(charge.startDate))}
                      </Text>
                      <View style={styles.nextRunsRow}>
                        {charge.nextRuns.map((run) => (
                          <View key={run} style={styles.nextRunChip}>
                            <Text style={styles.nextRunText}>{dateFormatter.format(new Date(run))}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyHelper}>
                  Aún no tienes cobros programados. Crea el primero para ver los próximos recordatorios aquí.
                </Text>
              )}
            </GlassCard>

            <GlassCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderTextWrap}>
                  <Text style={styles.sectionTitle}>Liquidaciones automáticas</Text>
                  <MarqueeText
                    text="Genera un resumen mensual de tus ingresos y egresos listo para compartir con contabilidad."
                    containerStyle={styles.cardHintContainer}
                    textStyle={styles.cardHint}
                  />
                </View>
                <View style={styles.cardHeaderIconWrap}>
                  <MaterialCommunityIcons name="file-chart-outline" size={22} color={palette.accentCyan} />
                </View>
              </View>

              <View style={styles.monthSelector}>
                {monthOptions.map((option) => (
                  <Pressable
                    key={option.key}
                    onPress={() => handleSelectMonth(option.key)}
                    style={[
                      styles.monthChip,
                      selectedMonthKey === option.key && styles.monthChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthChipLabel,
                        selectedMonthKey === option.key && styles.monthChipLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Ingresos recibidos</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(settlementSummary.inboundTotal)}</Text>
                  <Text style={styles.summaryDescription}>
                    {settlementSummary.inboundCount} transferencias entrantes
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Transferencias enviadas</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(settlementSummary.outboundTotal)}</Text>
                  <Text style={styles.summaryDescription}>
                    {settlementSummary.outboundCount} transferencias salientes
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Recargas y extras</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(settlementSummary.rechargeTotal)}</Text>
                  <Text style={styles.summaryDescription}>
                    {settlementSummary.rechargeCount} recargas registradas
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Balance neto</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      settlementSummary.netFlow >= 0 ? styles.positiveValue : styles.negativeValue,
                    ]}
                  >
                    {formatCurrency(settlementSummary.netFlow)}
                  </Text>
                  <Text style={styles.summaryDescription}>Ingresos menos egresos y recargas</Text>
                </View>
              </View>

              <View style={styles.topContacts}>
                <Text style={styles.topContactsTitle}>Destinos destacados</Text>
                {settlementSummary.topOutbound.length > 0 ? (
                  settlementSummary.topOutbound.map((item) => (
                    <View key={item.name} style={styles.topContactRow}>
                      <View style={styles.topContactBadge}>
                        <MaterialCommunityIcons
                          name="arrow-top-right-bold-outline"
                          size={16}
                          color={palette.accentCyan}
                        />
                      </View>
                      <Text style={styles.topContactName}>{item.name}</Text>
                      <Text style={styles.topContactAmount}>{formatCurrency(item.amount)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyHelper}>Sin egresos registrados este mes.</Text>
                )}
              </View>

              <View style={styles.topContacts}>
                <Text style={styles.topContactsTitle}>Remitentes destacados</Text>
                {settlementSummary.topInbound.length > 0 ? (
                  settlementSummary.topInbound.map((item) => (
                    <View key={item.name} style={styles.topContactRow}>
                      <View style={styles.topContactBadge}>
                        <MaterialCommunityIcons
                          name="arrow-bottom-left-bold-outline"
                          size={16}
                          color="#63F7B0"
                        />
                      </View>
                      <Text style={styles.topContactName}>{item.name}</Text>
                      <Text style={styles.topContactAmount}>{formatCurrency(item.amount)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyHelper}>Sin ingresos registrados este mes.</Text>
                )}
              </View>

              {settlementStatus ? <Text style={styles.statusMessage}>{settlementStatus}</Text> : null}

              <PrimaryButton
                label="Generar liquidación"
                onPress={handleGenerateSettlement}
                style={styles.sectionButton}
              />
            </GlassCard>
          </MotiView>
        </ScrollView>
      </View>
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  chipRowRedesigned: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chipRedesigned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    minWidth: 0,
    maxWidth: 110,
  },
  chipRedesignedActive: {
    backgroundColor: palette.accentCyan,
    shadowOpacity: 0.18,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipLabelRedesigned: {
    color: palette.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  chipLabelRedesignedActive: {
    color: '#fff',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 4,
    width: '100%',
  },
  cardHeaderTextWrap: {
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 0,
    maxWidth: '82%',
  },
  cardHeaderIconWrap: {
    flexShrink: 0,
    paddingLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },
  cardHintContainer: {
    maxWidth: '100%',
    marginTop: 2,
    marginBottom: 2,
  },
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 12,
    paddingRight: 16,
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
  profileShortcut: {
    shadowOpacity: 0.25,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  cardHint: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  fieldGroup: {
    gap: 14,
    marginBottom: 16,
  },
  sectionButton: {
    marginTop: 8,
  },
  statusMessage: {
    backgroundColor: "rgba(99, 247, 176, 0.12)",
    borderColor: "rgba(99, 247, 176, 0.35)",
    borderWidth: 1,
    color: palette.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    fontSize: 13,
    marginBottom: 16,
  },
  errorMessage: {
    backgroundColor: "rgba(255, 72, 66, 0.16)",
    borderColor: "rgba(255, 72, 66, 0.45)",
    borderWidth: 1,
    color: palette.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    fontSize: 13,
    marginBottom: 16,
  },
  splitResult: {
    marginTop: 18,
    gap: 14,
  },
  splitSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  splitSummaryLabel: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  splitSummaryAmount: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  resultsList: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 6,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  resultNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resultName: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  resultAmount: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  resultHint: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  secondaryButton: {
    marginTop: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipActive: {
    borderColor: palette.accentCyan,
    backgroundColor: "rgba(0, 240, 255, 0.14)",
  },
  chipLabel: {
    color: palette.textSecondary,
    fontWeight: "700",
  },
  chipLabelActive: {
    color: palette.textPrimary,
  },
  chipDescription: {
    color: palette.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  recurringList: {
    marginTop: 12,
    gap: 12,
  },
  recurringItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16,
    gap: 10,
  },
  recurringHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recurringTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  recurringAmount: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  recurringMeta: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  nextRunsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nextRunChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0, 240, 255, 0.08)",
  },
  nextRunText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyHelper: {
    color: palette.textSecondary,
    fontSize: 12,
    marginTop: 12,
  },
  monthSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  monthChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  monthChipActive: {
    borderColor: palette.accentCyan,
    backgroundColor: "rgba(0, 240, 255, 0.16)",
  },
  monthChipLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  monthChipLabelActive: {
    color: palette.textPrimary,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: "48%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16,
    gap: 6,
  },
  summaryLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  summaryDescription: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  positiveValue: {
    color: "#63F7B0",
  },
  negativeValue: {
    color: palette.danger,
  },
  topContacts: {
    marginTop: 18,
    gap: 10,
  },
  topContactsTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  topContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  topContactBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 240, 255, 0.08)",
  },
  topContactName: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  topContactAmount: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
});

export default ChargesScreen;
