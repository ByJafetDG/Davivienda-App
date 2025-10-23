import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  PressableStateCallbackType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import NeonTextField from "@/components/NeonTextField";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { RechargeRecord, useBankStore } from "@/store/useBankStore";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";

const OPERATORS = [
  {
    id: "kolbi",
    label: "Kolbi",
    accent: "#00ff1eff",
    logo: require("../../assets/logo_kolbi.png"),
  },
  {
    id: "claro",
    label: "Claro",
    accent: "#ff132eff",
    logo: require("../../assets/logo_claro.png"),
  },
  {
    id: "liberty",
    label: "Liberty",
    accent: "#3da1ffff",
    logo: require("../../assets/logo_liberty.png"),
  },
] as const;

const MobileRechargeScreen = () => {
  const router = useRouter();
  const { balance, makeRecharge } = useBankStore();

  const [operator, setOperator] =
    useState<(typeof OPERATORS)[number]["id"]>("claro");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successRecord, setSuccessRecord] = useState<RechargeRecord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSubmit = () => {
    setError(null);
    setSuccessRecord(null);
    const parsedAmount = Number(amount);
    if (!phone.trim() || phone.length < 8) {
      setError("Ingresa un número válido.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("El monto debe ser mayor a cero.");
      return;
    }
    if (parsedAmount > balance) {
      setError("Saldo insuficiente para completar la recarga.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        const record = makeRecharge({
          provider: operator,
          phone,
          amount: parsedAmount,
        });
        setSuccessRecord(record);
        setModalVisible(true);
        setPhone("");
        setAmount("");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo ejecutar la recarga.",
        );
      } finally {
        setLoading(false);
      }
    }, 600);
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
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 480 }}
          >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={26}
                color={palette.textPrimary}
              />
            </Pressable>
            <Text style={styles.title}>Recarga móvil</Text>
            <ProfileAvatarButton
              size={40}
              onPress={() => router.push("/(app)/profile")}
              accessibilityLabel="Ir a tu perfil"
              style={styles.profileShortcut}
            />
          </View>

          <GlassCard>
            <View style={styles.operatorSection}>
              <Text style={styles.sectionTitle}>Selecciona tu operador</Text>
              <View style={styles.operatorRow}>
                {OPERATORS.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setOperator(item.id)}
                    style={styles.operatorButton}
                  >
                    {(state: PressableStateCallbackType) => (
                      <MotiView
                        animate={{
                          scale: state.pressed ? 0.94 : 1,
                          borderColor:
                            operator === item.id
                              ? `${item.accent}`
                              : "rgba(255, 255, 255, 0.08)",
                          shadowOpacity: operator === item.id ? 0.45 : 0,
                          backgroundColor:
                            operator === item.id
                              ? "rgba(255, 255, 255, 0.12)"
                              : "rgba(10, 20, 40, 0.85)",
                        }}
                        transition={{ type: "timing", duration: 160 }}
                        style={[
                          styles.operatorCard,
                          { shadowColor: item.accent },
                        ]}
                      >
                        <View
                          style={[
                            styles.operatorIconWrapper,
                            {
                              borderColor:
                                operator === item.id
                                  ? `${item.accent}55`
                                  : "rgba(255,255,255,0.12)",
                              backgroundColor:
                                operator === item.id
                                  ? "rgba(0, 8, 16, 0.45)"
                                  : "rgba(0,0,0,0.15)",
                            },
                          ]}
                        >
                          <Image
                            source={item.logo}
                            style={styles.operatorLogo}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.operatorLabel}>{item.label}</Text>
                      </MotiView>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </GlassCard>

          <MotiView
            style={styles.form}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500, delay: 120 }}
          >
            <NeonTextField
              label="Número a recargar"
              placeholder="0000 0000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              allowOnlyNumeric
              icon={
                <MaterialCommunityIcons
                  name="cellphone"
                  size={20}
                  color={palette.accentCyan}
                />
              }
            />
            <NeonTextField
              label="Monto"
              placeholder="₡5,000"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              allowOnlyNumeric
              icon={
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={20}
                  color={palette.accentCyan}
                />
              }
              helpText={`Saldo disponible: ${formatCurrency(balance)}`}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label="Realizar recarga"
              onPress={handleSubmit}
              loading={loading}
            />
          </MotiView>
          </MotiView>
        </ScrollView>
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={38}
                color={palette.accentCyan}
              />
              <Text style={styles.modalTitle}>Recarga completada</Text>
              <Text style={styles.modalSubtitle}>
                Tu saldo se acreditó correctamente.
              </Text>
            </View>
            {successRecord ? (
              <View style={styles.modalDetails}>
                <DetailRow
                  label="Operador"
                  value={
                    OPERATORS.find((item) => item.id === successRecord.provider)?.label ??
                    successRecord.provider
                  }
                />
                <DetailRow label="Número" value={successRecord.phone} />
                <DetailRow
                  label="Monto"
                  value={formatCurrency(successRecord.amount)}
                />
                <DetailRow
                  label="Fecha"
                  value={new Date(successRecord.createdAt).toLocaleString()}
                />
              </View>
            ) : null}
            <PrimaryButton
              label="Entendido"
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </FuturisticBackground>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: "relative",
  },
  scroll: {
    paddingBottom: 260,
  },
  container: {
    paddingTop: 32,
    paddingHorizontal: 20,
    gap: 32,
  },
  header: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileShortcut: {
    shadowOpacity: 0.25,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  operatorSection: {
    gap: 16,
    padding: 20,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  operatorRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  operatorButton: {
    flexBasis: "31%",
    maxWidth: 100,
    flexGrow: 0,
  },
  operatorCard: {
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(10, 20, 40, 0.82)",
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 18,
  },
  operatorIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  operatorLabel: {
    color: palette.textPrimary,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.15,
    textAlign: "center",
  },
  operatorLogo: {
    width: 24,
    height: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 8, 16, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 26,
    padding: 24,
    gap: 20,
    backgroundColor: "rgba(8, 14, 26, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalHeader: {
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: palette.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  modalDetails: {
    gap: 12,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  modalButton: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  detailValue: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  form: {
    gap: 18,
  },
  error: {
    color: palette.danger,
    textAlign: "center",
  },
});

export default MobileRechargeScreen;
