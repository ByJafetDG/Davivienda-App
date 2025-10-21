import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import {
  Dispatch,
  SetStateAction,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import NeonTextField from "@/components/NeonTextField";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import {
  ENVELOPE_COLORS,
  AutomationRule,
  Envelope,
  useBankStore,
} from "@/store/useBankStore";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";

const parseAmountInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return NaN;
  }
  const cleaned = trimmed.replace(/[^0-9,\.\-]/g, "");
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  let normalized = cleaned;

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = cleaned.replace(/,/g, ".");
  }

  const amount = Number(normalized.replace(/\s+/g, ""));
  return Number.isFinite(amount) ? amount : NaN;
};

type EnvelopeFormState = {
  id: string | null;
  name: string;
  color: string;
  targetAmount: string;
  description: string;
};

type AllocationFormState = {
  envelopeId: string | null;
  mode: "deposit" | "withdraw";
  amount: string;
};

type AutomationFormState = {
  id: string | null;
  title: string;
  matchPhone: string;
  envelopeId: string;
  active: boolean;
};

const EnvelopesScreen = () => {
  const router = useRouter();
  const {
    envelopes,
    automations,
    balance,
    initialBalance,
    createEnvelope,
    updateEnvelope,
    removeEnvelope,
    allocateToEnvelope,
    createAutomationRule,
    updateAutomationRule,
    removeAutomationRule,
    addNotification,
  } = useBankStore();

  const envelopeById = useMemo(() => {
    const map: Record<string, Envelope> = {};
    envelopes.forEach((item: Envelope) => {
      map[item.id] = item;
    });
    return map;
  }, [envelopes]);

  const totalReserved = useMemo(
    () =>
      envelopes.reduce((accumulator: number, item: Envelope) => {
        return accumulator + item.balance;
      }, 0),
    [envelopes],
  );

  const activeAutomations = useMemo(
    () => automations.filter((rule: AutomationRule) => rule.active).length,
    [automations],
  );

  const [envelopeModalVisible, setEnvelopeModalVisible] = useState(false);
  const [envelopeModalMode, setEnvelopeModalMode] =
    useState<"create" | "edit">("create");
  const [envelopeForm, setEnvelopeForm] = useState<EnvelopeFormState>({
    id: null,
    name: "",
    color: ENVELOPE_COLORS[0],
    targetAmount: "",
    description: "",
  });
  const [envelopeError, setEnvelopeError] = useState<string | null>(null);

  const [allocationModalVisible, setAllocationModalVisible] = useState(false);
  const [allocationForm, setAllocationForm] = useState<AllocationFormState>({
    envelopeId: null,
    mode: "deposit",
    amount: "",
  });
  const [allocationError, setAllocationError] = useState<string | null>(null);

  const [automationModalVisible, setAutomationModalVisible] = useState(false);
  const [automationModalMode, setAutomationModalMode] =
    useState<"create" | "edit">("create");
  const [automationForm, setAutomationForm] = useState<AutomationFormState>({
    id: null,
    title: "",
    matchPhone: "",
    envelopeId: envelopes[0]?.id ?? "",
    active: true,
  });
  const [automationError, setAutomationError] = useState<string | null>(null);

  const openCreateEnvelope = () => {
    const nextColor =
      ENVELOPE_COLORS[envelopes.length % ENVELOPE_COLORS.length] ??
      ENVELOPE_COLORS[0];
    setEnvelopeForm({
      id: null,
      name: "",
      color: nextColor,
      targetAmount: "",
      description: "",
    });
    setEnvelopeModalMode("create");
    setEnvelopeError(null);
    setEnvelopeModalVisible(true);
  };

  const openEditEnvelope = (envelope: Envelope) => {
    setEnvelopeForm({
      id: envelope.id,
      name: envelope.name,
      color: envelope.color,
      targetAmount: envelope.targetAmount
        ? envelope.targetAmount.toString()
        : "",
      description: envelope.description ?? "",
    });
    setEnvelopeModalMode("edit");
    setEnvelopeError(null);
    setEnvelopeModalVisible(true);
  };

  const handleSaveEnvelope = () => {
    const trimmedName = envelopeForm.name.trim();
    if (!trimmedName) {
      setEnvelopeError("Agrega un nombre para el sobre.");
      return;
    }
    const targetValue = envelopeForm.targetAmount.trim();
    const parsedTarget = targetValue ? parseAmountInput(targetValue) : undefined;
    if (
      typeof parsedTarget === "number" &&
      (!Number.isFinite(parsedTarget) || parsedTarget < 0)
    ) {
      setEnvelopeError("El monto objetivo debe ser válido y positivo.");
      return;
    }

    try {
      if (envelopeModalMode === "create") {
        const envelope = createEnvelope({
          name: trimmedName,
          color: envelopeForm.color,
          targetAmount: parsedTarget,
          description: envelopeForm.description.trim() || undefined,
        });
        addNotification({
          title: "Nuevo sobre creado",
          message: `${envelope.name} ya está listo para recibir asignaciones automáticas.`,
          category: "general",
        });
      } else if (envelopeForm.id) {
        const updated = updateEnvelope(envelopeForm.id, {
          name: trimmedName,
          color: envelopeForm.color,
          targetAmount: parsedTarget,
          description: envelopeForm.description.trim() || undefined,
        });
        if (updated) {
          addNotification({
            title: "Sobre actualizado",
            message: `${updated.name} se actualizó correctamente.`,
            category: "general",
          });
        }
      }
      setEnvelopeModalVisible(false);
    } catch (error) {
      setEnvelopeError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el sobre en este momento.",
      );
    }
  };

  const handleRemoveEnvelope = (envelope: Envelope) => {
    Alert.alert(
      "Eliminar sobre",
      `¿Seguro que deseas eliminar ${envelope.name}? Los movimientos vinculados conservarán su historial.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            removeEnvelope(envelope.id);
            addNotification({
              title: "Sobre eliminado",
              message: `${envelope.name} se eliminó del panel de sobres.`,
              category: "general",
            });
          },
        },
      ],
    );
  };

  const openAllocationModal = (
    envelope: Envelope,
    mode: AllocationFormState["mode"] = "deposit",
  ) => {
    setAllocationForm({ envelopeId: envelope.id, mode, amount: "" });
    setAllocationError(null);
    setAllocationModalVisible(true);
  };

  const handleSaveAllocation = () => {
    if (!allocationForm.envelopeId) {
      return;
    }
    const amount = parseAmountInput(allocationForm.amount.trim());
    if (!Number.isFinite(amount) || amount <= 0) {
      setAllocationError("Ingresa un monto válido.");
      return;
    }
    const envelope = envelopeById[allocationForm.envelopeId];
    if (!envelope) {
      setAllocationError("El sobre seleccionado ya no está disponible.");
      return;
    }
    if (allocationForm.mode === "withdraw" && amount > envelope.balance) {
      setAllocationError("No puedes retirar más del saldo disponible en el sobre.");
      return;
    }
    const signedAmount =
      allocationForm.mode === "withdraw" ? -amount : amount;

    try {
      allocateToEnvelope(envelope.id, signedAmount, { allowNegative: false });
      addNotification({
        title:
          allocationForm.mode === "withdraw"
            ? "Saldo retirado de sobre"
            : "Saldo asignado a sobre",
        message:
          allocationForm.mode === "withdraw"
            ? `${formatCurrency(amount)} se movieron desde ${envelope.name} a tu saldo disponible.`
            : `${formatCurrency(amount)} se apartaron dentro de ${envelope.name}.`,
        category: "general",
      });
      setAllocationModalVisible(false);
    } catch (error) {
      setAllocationError(
        error instanceof Error
          ? error.message
          : "No pudimos actualizar el saldo del sobre.",
      );
    }
  };

  const openCreateAutomation = () => {
    if (envelopes.length === 0) {
      Alert.alert(
        "Crea un sobre",
        "Necesitas al menos un sobre antes de configurar automatizaciones.",
      );
      return;
    }
    setAutomationForm({
      id: null,
      title: "",
      matchPhone: "",
      envelopeId: envelopes[0].id,
      active: true,
    });
    setAutomationModalMode("create");
    setAutomationError(null);
    setAutomationModalVisible(true);
  };

  const openEditAutomation = (rule: AutomationRule) => {
    setAutomationForm({
      id: rule.id,
      title: rule.title,
      matchPhone: rule.matchPhone,
      envelopeId: rule.envelopeId,
      active: rule.active,
    });
    setAutomationModalMode("edit");
    setAutomationError(null);
    setAutomationModalVisible(true);
  };

  const handleSaveAutomation = () => {
    if (!automationForm.envelopeId) {
      setAutomationError("Selecciona un sobre de destino.");
      return;
    }
    const phone = automationForm.matchPhone.trim();
    if (!phone) {
      setAutomationError("Indica el número SINPE o teléfono a vigilar.");
      return;
    }
    const title = automationForm.title.trim();

    try {
      if (automationModalMode === "create") {
        const rule = createAutomationRule({
          title,
          matchPhone: phone,
          envelopeId: automationForm.envelopeId,
          active: automationForm.active,
        });
        addNotification({
          title: "Automatización creada",
          message: `${rule.title} enviará depósitos automáticamente al sobre seleccionado.`,
          category: "general",
        });
      } else if (automationForm.id) {
        const updated = updateAutomationRule(automationForm.id, {
          title: title || undefined,
          matchPhone: phone,
          envelopeId: automationForm.envelopeId,
          active: automationForm.active,
        });
        if (updated) {
          addNotification({
            title: "Automatización actualizada",
            message: `${updated.title} se ajustó correctamente.`,
            category: "general",
          });
        }
      }
      setAutomationModalVisible(false);
    } catch (error) {
      setAutomationError(
        error instanceof Error
          ? error.message
          : "No fue posible guardar la automatización.",
      );
    }
  };

  const handleToggleAutomation = (rule: AutomationRule) => {
    try {
      updateAutomationRule(rule.id, { active: !rule.active });
    } catch (error) {
      Alert.alert(
        "No se pudo actualizar",
        error instanceof Error
          ? error.message
          : "Intenta nuevamente en unos segundos.",
      );
    }
  };

  const handleRemoveAutomation = (rule: AutomationRule) => {
    Alert.alert(
      "Eliminar automatización",
      `¿Eliminar ${rule.title}? Los ingresos futuros ya no se separarán automáticamente.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            removeAutomationRule(rule.id);
            addNotification({
              title: "Automatización eliminada",
              message: `${rule.title} dejó de estar activa en tus sobres.`,
              category: "general",
            });
          },
        },
      ],
    );
  };

  const selectedAllocationEnvelope = allocationForm.envelopeId
    ? envelopeById[allocationForm.envelopeId]
    : undefined;

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
                size={24}
                color={palette.textPrimary}
              />
            </Pressable>
            <Text style={styles.title}>Sobres inteligentes</Text>
            <View style={styles.headerActions}>
              <Pressable
                style={styles.iconButton}
                onPress={openCreateEnvelope}
                accessibilityRole="button"
                accessibilityLabel="Crear sobre"
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={22}
                  color={palette.textPrimary}
                />
              </Pressable>
              <ProfileAvatarButton
                size={40}
                onPress={() => router.push("/(app)/profile")}
                accessibilityLabel="Ir a tu perfil"
                style={styles.profileShortcut}
              />
            </View>
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420 }}
          >
            <GlassCard>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Saldo apartado</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totalReserved)}
                </Text>
                <Text style={styles.summaryHint}>
                  {totalReserved === 0
                    ? "Separa parte de tu saldo para mantener controladas tus categorías clave."
                    : `De ${formatCurrency(balance)} disponibles, apartaste ${formatCurrency(totalReserved)} en sobres.`}
                </Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryBadge}>
                    <MaterialCommunityIcons
                      name="wallet"
                      size={16}
                      color={palette.accentCyan}
                    />
                    <Text style={styles.summaryBadgeText}>
                      {envelopes.length} {envelopes.length === 1 ? "sobre" : "sobres"}
                    </Text>
                  </View>
                  <View style={styles.summaryBadge}>
                    <MaterialCommunityIcons
                      name="lightning-bolt"
                      size={16}
                      color={palette.success}
                    />
                    <Text style={styles.summaryBadgeText}>
                      {activeAutomations} {activeAutomations === 1 ? "automatización" : "automatizaciones"}
                    </Text>
                  </View>
                  <View style={styles.summaryBadge}>
                    <MaterialCommunityIcons
                      name="chart-box"
                      size={16}
                      color={palette.textPrimary}
                    />
                    <Text style={styles.summaryBadgeText}>
                      Inicio: {formatCurrency(initialBalance)}
                    </Text>
                  </View>
                </View>
                <View style={styles.summaryActions}>
                  <PrimaryButton
                    label="Crear sobre"
                    onPress={openCreateEnvelope}
                  />
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={openCreateAutomation}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons
                      name="lightning-bolt-outline"
                      size={18}
                      color={palette.accentCyan}
                    />
                    <Text style={styles.secondaryLabel}>
                      Nueva automatización
                    </Text>
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 28 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420, delay: 80 }}
          >
            <GlassCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mis sobres</Text>
                <Text style={styles.sectionHint}>
                  Actualiza montos, ajusta metas o elimina sobres en desuso.
                </Text>
              </View>
              {envelopes.length === 0 ? (
                <Text style={styles.emptyCopy}>
                  Crea tu primer sobre para verlos en este panel.
                </Text>
              ) : (
                envelopes.map((envelope: Envelope) => {
                  const progress = envelope.targetAmount
                    ? Math.min(
                        100,
                        Math.round(
                          (envelope.balance / envelope.targetAmount) * 100,
                        ),
                      )
                    : null;
                  const updatedAt = new Date(envelope.updatedAt);
                  const updatedLabel = updatedAt.toLocaleDateString("es-CR", {
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <View key={envelope.id} style={styles.envelopeCard}>
                      <View style={styles.envelopeCardHeader}>
                        <View
                          style={[
                            styles.envelopeAvatar,
                            {
                              backgroundColor: `${envelope.color}19`,
                              borderColor: `${envelope.color}55`,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="wallet"
                            size={20}
                            color={envelope.color}
                          />
                        </View>
                        <View style={styles.envelopeCardInfo}>
                          <Text style={styles.envelopeCardName}>
                            {envelope.name}
                          </Text>
                          <Text style={styles.envelopeCardMeta}>
                            {formatCurrency(envelope.balance)}
                            {envelope.targetAmount
                              ? ` · Meta ${formatCurrency(envelope.targetAmount)}`
                              : ""}
                          </Text>
                          <Text style={styles.envelopeCardMeta}>
                            Actualizado {updatedLabel}
                          </Text>
                        </View>
                      </View>
                      {progress !== null ? (
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.max(progress, 4)}%`,
                                backgroundColor: envelope.color,
                              },
                            ]}
                          />
                        </View>
                      ) : null}
                      <View style={styles.envelopeActionsRow}>
                        <Pressable
                          style={styles.chipButton}
                          onPress={() => openAllocationModal(envelope, "deposit")}
                          accessibilityRole="button"
                        >
                          <MaterialCommunityIcons
                            name="arrow-bottom-right"
                            size={16}
                            color={palette.success}
                          />
                          <Text style={styles.chipLabel}>Aportar</Text>
                        </Pressable>
                        <Pressable
                          style={styles.chipButton}
                          onPress={() => openAllocationModal(envelope, "withdraw")}
                          accessibilityRole="button"
                        >
                          <MaterialCommunityIcons
                            name="arrow-top-left"
                            size={16}
                            color={palette.accentCyan}
                          />
                          <Text style={styles.chipLabel}>Retirar</Text>
                        </Pressable>
                        <Pressable
                          style={styles.chipButton}
                          onPress={() => openEditEnvelope(envelope)}
                          accessibilityRole="button"
                        >
                          <MaterialCommunityIcons
                            name="pencil"
                            size={16}
                            color={palette.textPrimary}
                          />
                          <Text style={styles.chipLabel}>Editar</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.chipButton, styles.chipDanger]}
                          onPress={() => handleRemoveEnvelope(envelope)}
                          accessibilityRole="button"
                        >
                          <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={16}
                            color={palette.danger}
                          />
                          <Text style={styles.chipLabel}>Eliminar</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 28 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420, delay: 140 }}
          >
            <GlassCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Automatizaciones</Text>
                <Text style={styles.sectionHint}>
                  Detecta depósitos entrantes y asigna automáticamente su monto a un sobre específico.
                </Text>
              </View>
              {automations.length === 0 ? (
                <Text style={styles.emptyCopy}>
                  Crea tu primera automatización para verlas aquí.
                </Text>
              ) : (
                automations.map((rule: AutomationRule) => {
                  const envelope = envelopeById[rule.envelopeId];
                  const lastTriggered = rule.lastTriggeredAt
                    ? new Date(rule.lastTriggeredAt).toLocaleDateString(
                        "es-CR",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )
                    : null;
                  return (
                    <View key={rule.id} style={styles.automationRow}>
                      <Pressable
                        style={styles.automationMain}
                        onPress={() => openEditAutomation(rule)}
                        accessibilityRole="button"
                      >
                        <View
                          style={[
                            styles.automationIcon,
                            {
                              backgroundColor: rule.active
                                ? "rgba(0, 240, 255, 0.12)"
                                : "rgba(255,255,255,0.06)",
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={
                              rule.active
                                ? "lightning-bolt"
                                : "lightning-bolt-outline"
                            }
                            size={18}
                            color={rule.active ? palette.accentCyan : palette.textSecondary}
                          />
                        </View>
                        <View style={styles.automationInfo}>
                          <Text style={styles.automationTitle}>{rule.title}</Text>
                          <Text style={styles.automationSubtitle}>
                            {rule.matchPhone} · {envelope ? envelope.name : "Sobre no disponible"}
                          </Text>
                          <Text style={styles.automationMeta}>
                            {lastTriggered
                              ? `Última ejecución ${lastTriggered}`
                              : "Aún sin ejecuciones"}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={18}
                          color={palette.textSecondary}
                        />
                      </Pressable>
                      <Switch
                        value={rule.active}
                        onValueChange={() => handleToggleAutomation(rule)}
                        trackColor={{
                          false: "rgba(255,255,255,0.2)",
                          true: palette.accentCyan,
                        }}
                        thumbColor={rule.active ? palette.surface : palette.textMuted}
                        ios_backgroundColor="rgba(255,255,255,0.2)"
                      />
                    </View>
                  );
                })
              )}
              <Pressable
                style={[styles.secondaryButton, styles.automationButton]}
                onPress={openCreateAutomation}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={palette.accentCyan}
                />
                <Text style={styles.secondaryLabel}>Agregar automatización</Text>
              </Pressable>
            </GlassCard>
          </MotiView>
        </View>
      </ScrollView>

      <EnvelopeFormModal
        visible={envelopeModalVisible}
        mode={envelopeModalMode}
        formState={envelopeForm}
        setFormState={setEnvelopeForm}
        onClose={() => setEnvelopeModalVisible(false)}
        onSubmit={handleSaveEnvelope}
        error={envelopeError}
      />

      <AllocationModal
        visible={allocationModalVisible}
        formState={allocationForm}
        setFormState={setAllocationForm}
        onClose={() => setAllocationModalVisible(false)}
        onSubmit={handleSaveAllocation}
        error={allocationError}
        envelope={selectedAllocationEnvelope}
      />

      <AutomationFormModal
        visible={automationModalVisible}
        mode={automationModalMode}
        formState={automationForm}
        setFormState={setAutomationForm}
        onClose={() => setAutomationModalVisible(false)}
        onSubmit={handleSaveAutomation}
        error={automationError}
        envelopes={envelopes}
        onRemove={
          automationModalMode === "edit" && automationForm.id
            ? () => {
                const rule = automations.find(
                  (item: AutomationRule) => item.id === automationForm.id,
                );
                if (rule) {
                  handleRemoveAutomation(rule);
                  setAutomationModalVisible(false);
                }
              }
            : undefined
        }
      />
    </FuturisticBackground>
  );
};

type EnvelopeFormModalProps = {
  visible: boolean;
  mode: "create" | "edit";
  formState: EnvelopeFormState;
  setFormState: Dispatch<SetStateAction<EnvelopeFormState>>;
  onClose: () => void;
  onSubmit: () => void;
  error: string | null;
};

const EnvelopeFormModal = ({
  visible,
  mode,
  formState,
  setFormState,
  onClose,
  onSubmit,
  error,
}: EnvelopeFormModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 260 }}
          style={styles.modalCard}
        >
          <Text style={styles.modalTitle}>
            {mode === "create" ? "Crear sobre" : "Editar sobre"}
          </Text>
          <NeonTextField
            label="Nombre"
            placeholder="Ej. Renta, emergencias, viajes"
            value={formState.name}
            onChangeText={(text) =>
              setFormState((current) => ({ ...current, name: text }))
            }
            icon={
              <MaterialCommunityIcons
                name="tag-outline"
                size={18}
                color={palette.accentCyan}
              />
            }
          />
          <NeonTextField
            label="Monto objetivo"
            placeholder="₡100,000"
            value={formState.targetAmount}
            onChangeText={(text) =>
              setFormState((current) => ({ ...current, targetAmount: text }))
            }
            keyboardType="decimal-pad"
            icon={
              <MaterialCommunityIcons
                name="target"
                size={18}
                color={palette.accentCyan}
              />
            }
          />
          <NeonTextField
            label="Descripción"
            placeholder="Notas opcionales para identificar el propósito"
            value={formState.description}
            onChangeText={(text) =>
              setFormState((current) => ({ ...current, description: text }))
            }
            multiline
            icon={
              <MaterialCommunityIcons
                name="note-text-outline"
                size={18}
                color={palette.accentCyan}
              />
            }
          />
          <Text style={styles.modalSubtitle}>Color de identificación</Text>
          <View style={styles.swatchGrid}>
            {ENVELOPE_COLORS.map((color) => {
              const isSelected = formState.color === color;
              return (
                <Pressable
                  key={color}
                  style={[styles.colorOption, isSelected && styles.colorOptionSelected]}
                  onPress={() =>
                    setFormState((current) => ({ ...current, color }))
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${color}`}
                >
                  <View
                    style={[styles.colorDot, { backgroundColor: color }]} />
                </Pressable>
              );
            })}
          </View>
          {error ? <Text style={styles.modalError}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              style={styles.modalSecondaryButton}
              accessibilityRole="button"
            >
              <Text style={styles.modalSecondaryLabel}>Cancelar</Text>
            </Pressable>
            <PrimaryButton
              label={mode === "create" ? "Crear" : "Guardar"}
              onPress={onSubmit}
            />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

type AllocationModalProps = {
  visible: boolean;
  formState: AllocationFormState;
  setFormState: Dispatch<SetStateAction<AllocationFormState>>;
  onClose: () => void;
  onSubmit: () => void;
  error: string | null;
  envelope?: Envelope;
};

const AllocationModal = ({
  visible,
  formState,
  setFormState,
  onClose,
  onSubmit,
  error,
  envelope,
}: AllocationModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 260 }}
          style={styles.modalCard}
        >
          <Text style={styles.modalTitle}>
            {formState.mode === "deposit"
              ? "Asignar saldo al sobre"
              : "Retirar saldo del sobre"}
          </Text>
          {envelope ? (
            <Text style={styles.modalSubtitle}>{envelope.name}</Text>
          ) : null}
          <View style={styles.toggleGroup}>
            <Pressable
              style={[
                styles.toggleButton,
                formState.mode === "deposit" && styles.toggleButtonActive,
              ]}
              onPress={() =>
                setFormState((current) => ({ ...current, mode: "deposit" }))
              }
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.toggleLabel,
                  formState.mode === "deposit" && styles.toggleLabelActive,
                ]}
              >
                Aportar
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toggleButton,
                formState.mode === "withdraw" && styles.toggleButtonActive,
              ]}
              onPress={() =>
                setFormState((current) => ({ ...current, mode: "withdraw" }))
              }
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.toggleLabel,
                  formState.mode === "withdraw" && styles.toggleLabelActive,
                ]}
              >
                Retirar
              </Text>
            </Pressable>
          </View>
          <NeonTextField
            label="Monto"
            placeholder="₡25,000"
            value={formState.amount}
            onChangeText={(text) =>
              setFormState((current) => ({ ...current, amount: text }))
            }
            keyboardType="decimal-pad"
            icon={
              <MaterialCommunityIcons
                name="cash-multiple"
                size={18}
                color={palette.accentCyan}
              />
            }
          />
          {error ? <Text style={styles.modalError}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              style={styles.modalSecondaryButton}
              accessibilityRole="button"
            >
              <Text style={styles.modalSecondaryLabel}>Cancelar</Text>
            </Pressable>
            <PrimaryButton label="Guardar" onPress={onSubmit} />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

type AutomationFormModalProps = {
  visible: boolean;
  mode: "create" | "edit";
  formState: AutomationFormState;
  setFormState: Dispatch<SetStateAction<AutomationFormState>>;
  onClose: () => void;
  onSubmit: () => void;
  error: string | null;
  envelopes: Envelope[];
  onRemove?: () => void;
};

const AutomationFormModal = ({
  visible,
  mode,
  formState,
  setFormState,
  onClose,
  onSubmit,
  error,
  envelopes,
  onRemove,
}: AutomationFormModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 260 }}
          style={styles.modalCard}
        >
          <Text style={styles.modalTitle}>
            {mode === "create" ? "Nueva automatización" : "Editar automatización"}
          </Text>
          <NeonTextField
            label="Nombre descriptivo"
            placeholder="Ej. Salario, freelance, alquiler"
            value={formState.title}
            onChangeText={(text) =>
              setFormState((current) => ({ ...current, title: text }))
            }
            icon={
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={18}
                color={palette.accentCyan}
              />
            }
          />
          <NeonTextField
            label="Número SINPE o teléfono"
            placeholder="8888-1212"
            value={formState.matchPhone}
            onChangeText={(text) =>
              setFormState((current) => ({ ...current, matchPhone: text }))
            }
            keyboardType="phone-pad"
            icon={
              <MaterialCommunityIcons
                name="cellphone-check"
                size={18}
                color={palette.accentCyan}
              />
            }
          />
          <Text style={styles.modalSubtitle}>Depositar en</Text>
          <View style={styles.envelopePicker}>
            {envelopes.length === 0 ? (
              <Text style={styles.emptyCopy}>
                Crea un sobre para asociarlo a esta automatización.
              </Text>
            ) : (
              envelopes.map((envelope: Envelope) => {
                const isSelected = formState.envelopeId === envelope.id;
                return (
                  <Pressable
                    key={envelope.id}
                    style={[
                      styles.envelopeOption,
                      isSelected && styles.envelopeOptionActive,
                    ]}
                    onPress={() =>
                      setFormState((current) => ({
                        ...current,
                        envelopeId: envelope.id,
                      }))
                    }
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.colorDot,
                        {
                          backgroundColor: envelope.color,
                          width: 14,
                          height: 14,
                          borderRadius: 6,
                        },
                      ]}
                    />
                    <Text style={styles.envelopeOptionLabel}>{envelope.name}</Text>
                  </Pressable>
                );
              })
            )}
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Automatización activa</Text>
            <Switch
              value={formState.active}
              onValueChange={(value) =>
                setFormState((current) => ({ ...current, active: value }))
              }
              trackColor={{ false: "rgba(255,255,255,0.2)", true: palette.accentCyan }}
              thumbColor={formState.active ? palette.surface : palette.textMuted}
            />
          </View>
          {error ? <Text style={styles.modalError}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              style={styles.modalSecondaryButton}
              accessibilityRole="button"
            >
              <Text style={styles.modalSecondaryLabel}>Cancelar</Text>
            </Pressable>
            {onRemove ? (
              <Pressable
                onPress={onRemove}
                style={[styles.modalSecondaryButton, styles.modalDangerButton]}
                accessibilityRole="button"
              >
                <Text style={styles.modalDangerLabel}>Eliminar</Text>
              </Pressable>
            ) : null}
            <PrimaryButton
              label={mode === "create" ? "Guardar" : "Actualizar"}
              onPress={onSubmit}
            />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 200,
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
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileShortcut: {
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  summaryCard: {
    gap: 16,
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
    fontSize: 32,
    fontWeight: "800",
  },
  summaryHint: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  summaryBadgeText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  summaryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  secondaryLabel: {
    color: palette.textPrimary,
    fontWeight: "600",
  },
  sectionHeader: {
    gap: 6,
    paddingBottom: 12,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  sectionHint: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyCopy: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  envelopeCard: {
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 16,
    gap: 12,
  },
  envelopeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  envelopeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  envelopeCardInfo: {
    flex: 1,
    gap: 4,
  },
  envelopeCardName: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  envelopeCardMeta: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  progressBar: {
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  envelopeActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  chipLabel: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  chipDanger: {
    backgroundColor: "rgba(255,94,91,0.12)",
  },
  automationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  automationMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  automationIcon: {
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  automationInfo: {
    flex: 1,
    gap: 4,
  },
  automationTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  automationSubtitle: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  automationMeta: {
    color: palette.textMuted,
    fontSize: 12,
  },
  automationButton: {
    marginTop: 18,
    alignSelf: "flex-start",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 11, 22, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: "rgba(13, 20, 35, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 22,
    gap: 16,
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  modalSubtitle: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  colorOptionSelected: {
    borderColor: palette.accentCyan,
    shadowColor: palette.accentCyan,
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  modalError: {
    color: palette.danger,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end",
  },
  modalSecondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  modalSecondaryLabel: {
    color: palette.textSecondary,
    fontWeight: "600",
  },
  modalDangerButton: {
    backgroundColor: "rgba(255,94,91,0.12)",
  },
  modalDangerLabel: {
    color: palette.danger,
    fontWeight: "600",
  },
  toggleGroup: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 6,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "rgba(0, 240, 255, 0.16)",
  },
  toggleLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  toggleLabelActive: {
    color: palette.textPrimary,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  envelopePicker: {
    gap: 8,
  },
  envelopeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  envelopeOptionActive: {
    borderColor: palette.accentCyan,
    backgroundColor: "rgba(0, 240, 255, 0.12)",
  },
  envelopeOptionLabel: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default EnvelopesScreen;
