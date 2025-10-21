import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import { useBankStore } from "@/store/useBankStore";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";

const ConfirmTransferScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contactName?: string;
    phone?: string;
    amount?: string;
    note?: string;
  }>();
  const { sendTransfer } = useBankStore();

  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNumber = useMemo(
    () => Number(params.amount || 0),
    [params.amount],
  );

  useEffect(() => {
    if (!params.contactName || !params.phone || !params.amount) {
      router.replace("/(app)/transfer");
    }
  }, [params.contactName, params.phone, params.amount, router]);

  const handleConfirm = () => {
    if (!params.contactName || !params.phone) {
      return;
    }
    setProcessing(true);
    setError(null);
    setTimeout(() => {
      try {
        sendTransfer({
          contactName: params.contactName || "Contacto",
          phone: params.phone || "",
          amount: amountNumber,
          note: params.note || undefined,
        });
        setCompleted(true);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo completar la transferencia.",
        );
      } finally {
        setProcessing(false);
      }
    }, 600);
  };

  const handleFinish = () => {
    router.replace("/(app)/home");
  };

  const summaryItems = [
    {
      label: "Destinatario",
      value: params.contactName,
      icon: "account-circle-outline",
    },
    { label: "Número telefónico", value: params.phone, icon: "cellphone" },
    {
      label: "Nota",
      value: params.note || "Sin detalles",
      icon: "note-text-outline",
    },
  ];

  return (
    <FuturisticBackground>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {!completed ? (
            <>
              <Text style={styles.title}>Confirma la transferencia</Text>
              <Text style={styles.subtitle}>
                Revisa los datos antes de enviar.
              </Text>
              <LinearGradient
                colors={["#0F213F", "#081226"]}
                style={styles.amountCard}
              >
                <Text style={styles.amountLabel}>Monto a enviar</Text>
                <Text style={styles.amountValue}>
                  {formatCurrency(amountNumber)}
                </Text>
              </LinearGradient>

              <GlassCard>
                <View style={styles.summary}>
                  {summaryItems.map((item) => (
                    <View key={item.label} style={styles.summaryRow}>
                      <View style={styles.summaryIcon}>
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={22}
                          color={palette.textPrimary}
                        />
                      </View>
                      <View style={styles.summaryCopy}>
                        <Text style={styles.summaryLabel}>{item.label}</Text>
                        <Text style={styles.summaryValue}>{item.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </GlassCard>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <PrimaryButton
                label="Confirmar y enviar"
                onPress={handleConfirm}
                loading={processing}
              />
              <Text style={styles.helper}>
                La operación se realizará completamente offline y se guardará
                solo en esta app.
              </Text>
            </>
          ) : (
            <MotiView
              from={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 12, mass: 0.8 }}
              style={styles.successState}
            >
              <LinearGradient
                colors={["#00F0FF", "#7A2BFF"]}
                style={styles.successBadge}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={42}
                  color={palette.textPrimary}
                />
              </LinearGradient>
              <Text style={styles.successTitle}>Transferencia completada</Text>
              <Text style={styles.successCopy}>
                Enviamos {formatCurrency(amountNumber)} a {params.contactName}.
                Puedes ver el registro en tu historial local.
              </Text>
              <PrimaryButton label="Volver al inicio" onPress={handleFinish} />
            </MotiView>
          )}
        </View>
      </ScrollView>
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 120,
  },
  container: {
    paddingTop: 64,
    paddingHorizontal: 24,
    gap: 24,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: 15,
  },
  amountCard: {
    borderRadius: 32,
    padding: 24,
    gap: 10,
  },
  amountLabel: {
    color: palette.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  amountValue: {
    color: palette.textPrimary,
    fontSize: 36,
    fontWeight: "800",
  },
  summary: {
    gap: 16,
    padding: 20,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCopy: {
    flex: 1,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryValue: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: palette.danger,
    textAlign: "center",
  },
  helper: {
    color: palette.textMuted,
    textAlign: "center",
    fontSize: 12,
  },
  successState: {
    alignItems: "center",
    gap: 24,
    marginTop: 80,
  },
  successBadge: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    color: palette.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  successCopy: {
    color: palette.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default ConfirmTransferScreen;
