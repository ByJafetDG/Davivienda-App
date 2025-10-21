import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  PressableStateCallbackType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import NeonTextField from "@/components/NeonTextField";
import PrimaryButton from "@/components/PrimaryButton";
import { useBankStore, Contact } from "@/store/useBankStore";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";

const MoneyTransferScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contactName?: string;
    phone?: string;
    amount?: string;
    note?: string;
  }>();
  const { contacts, balance } = useBankStore();

  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const didPrefill = useRef(false);

  useEffect(() => {
    if (didPrefill.current) {
      return;
    }

    const hasAnyPrefill =
      (typeof params.contactName === "string" &&
        params.contactName.length > 0) ||
      (typeof params.phone === "string" && params.phone.length > 0) ||
      (typeof params.amount === "string" && params.amount.length > 0) ||
      (typeof params.note === "string" && params.note.length > 0);

    if (!hasAnyPrefill) {
      return;
    }

    if (typeof params.contactName === "string") {
      setContactName(params.contactName);
    }
    if (typeof params.phone === "string") {
      setPhone(params.phone);
    }
    if (typeof params.amount === "string") {
      setAmount(params.amount);
    }
    if (typeof params.note === "string") {
      setNote(params.note);
    }

    didPrefill.current = true;
  }, [params.amount, params.contactName, params.note, params.phone]);

  const topContacts = useMemo(() => contacts.slice(0, 5), [contacts]);

  const handleSelectContact = (contact: Contact) => {
    setContactName(contact.name);
    setPhone(contact.phone);
  };

  const handleContinue = () => {
    setError(null);
    const amountNumber = parseFloat(amount.replace(/,/g, "."));
    if (!contactName.trim()) {
      setError("Agrega un nombre para identificar a quién envías.");
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setError("Ingresa un número telefónico válido.");
      return;
    }
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setError("Ingresa un monto mayor a cero.");
      return;
    }
    if (amountNumber > balance) {
      setError("No tienes saldo suficiente para esta transferencia.");
      return;
    }

    router.push({
      pathname: "/(app)/confirm-transfer",
      params: {
        contactName,
        phone,
        amount: amountNumber.toString(),
        note,
      },
    });
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
            <Pressable onPress={() => router.back()}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={26}
                color={palette.textPrimary}
              />
            </Pressable>
            <Text style={styles.title}>Nueva transferencia</Text>
            <View style={{ width: 26 }} />
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 32 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600 }}
            style={styles.balanceSummary}
          >
            <Text style={styles.balanceCaption}>Saldo disponible</Text>
            <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
            <Text style={styles.balanceHint}>
              Recuerda que todo queda almacenado localmente.
            </Text>
          </MotiView>

          <View style={styles.contactRow}>
            <Text style={styles.sectionTitle}>Contactos frecuentes</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              keyboardShouldPersistTaps="handled"
            >
              {topContacts.map((contact: Contact) => (
                <Pressable
                  key={contact.id}
                  onPress={() => handleSelectContact(contact)}
                  style={styles.contactChip}
                >
                  {(state: PressableStateCallbackType) => (
                    <MotiView
                      animate={{
                        scale: state.pressed ? 0.95 : 1,
                        opacity: state.pressed ? 0.7 : 1,
                      }}
                      style={styles.contactBadge}
                    >
                      <View
                        style={[
                          styles.contactAvatar,
                          { backgroundColor: contact.avatarColor },
                        ]}
                      >
                        <Text style={styles.contactAvatarLabel}>
                          {contact.name.charAt(0)}
                        </Text>
                      </View>
                      <Text style={styles.contactName}>
                        {contact.name.split(" ")[0]}
                      </Text>
                    </MotiView>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.form}>
            <NeonTextField
              label="Nombre del destinatario"
              placeholder="Juan Pérez"
              value={contactName}
              onChangeText={setContactName}
              icon={
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color={palette.accentCyan}
                />
              }
            />
            <NeonTextField
              label="Número telefónico"
              placeholder="0000 0000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              icon={
                <MaterialCommunityIcons
                  name="cellphone-nfc"
                  size={20}
                  color={palette.accentCyan}
                />
              }
            />
            <NeonTextField
              label="Monto a enviar"
              placeholder="₡10,000"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              icon={
                <MaterialCommunityIcons
                  name="currency-usd"
                  size={20}
                  color={palette.accentCyan}
                />
              }
            />
            <NeonTextField
              label="Mensaje (opcional)"
              placeholder="Cena viernes"
              value={note}
              onChangeText={setNote}
              icon={
                <MaterialCommunityIcons
                  name="message-text-outline"
                  size={20}
                  color={palette.accentCyan}
                />
              }
              helpText="Se mostrará en tu historial local."
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Continuar" onPress={handleContinue} />
          </View>
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
    paddingTop: 28,
    paddingHorizontal: 20,
    gap: 32,
  },
  header: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  balanceSummary: {
    backgroundColor: "rgba(8, 16, 30, 0.7)",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 8,
  },
  balanceCaption: {
    color: palette.textMuted,
    fontSize: 13,
    letterSpacing: 0.5,
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
  contactRow: {
    gap: 12,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  chipsRow: {
    gap: 12,
  },
  contactChip: {
    borderRadius: 22,
    overflow: "hidden",
  },
  contactBadge: {
    borderRadius: 22,
    backgroundColor: "rgba(9, 22, 40, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarLabel: {
    color: palette.textPrimary,
    fontWeight: "700",
  },
  contactName: {
    color: palette.textPrimary,
    fontWeight: "600",
  },
  form: {
    gap: 18,
  },
  error: {
    color: palette.danger,
    fontSize: 13,
    textAlign: "center",
  },
});

export default MoneyTransferScreen;
