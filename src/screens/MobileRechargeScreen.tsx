import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useState } from "react";
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
import NeonTextField from "@/components/NeonTextField";
import PrimaryButton from "@/components/PrimaryButton";
import { useBankStore } from "@/store/useBankStore";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";

const OPERATORS = [
  { id: "kolbi", label: "kolbi", accent: "#00F0FF" },
  { id: "claro", label: "Claro", accent: "#FF3B6B" },
  { id: "movistar", label: "Movistar", accent: "#7A2BFF" },
] as const;

const MobileRechargeScreen = () => {
  const router = useRouter();
  const { balance, makeRecharge } = useBankStore();

  const [operator, setOperator] =
    useState<(typeof OPERATORS)[number]["id"]>("claro");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setError(null);
    setFeedback(null);
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
        setFeedback(
          `Recarga exitosa a ${record.phone} por ${formatCurrency(parsedAmount)}.`,
        );
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
            <View style={{ width: 26 }} />
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
                        }}
                        transition={{ type: "timing", duration: 160 }}
                        style={[
                          styles.operatorCard,
                          { shadowColor: item.accent },
                        ]}
                      >
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
            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
            <PrimaryButton
              label="Realizar recarga"
              onPress={handleSubmit}
              loading={loading}
            />
          </MotiView>
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
    gap: 12,
    justifyContent: "space-between",
  },
  operatorButton: {
    flex: 1,
  },
  operatorCard: {
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 18,
    alignItems: "center",
    backgroundColor: "rgba(10, 20, 40, 0.8)",
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
  },
  operatorLabel: {
    color: palette.textPrimary,
    fontWeight: "700",
    fontSize: 16,
    textTransform: "uppercase",
  },
  form: {
    gap: 18,
  },
  error: {
    color: palette.danger,
    textAlign: "center",
  },
  feedback: {
    color: palette.success,
    textAlign: "center",
  },
});

export default MobileRechargeScreen;
