import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import NeonSelectField from "@/components/NeonSelectField";
import NeonTextField from "@/components/NeonTextField";
import PrimaryButton from "@/components/PrimaryButton";
import { useBankStore } from "@/store/useBankStore";
import { palette } from "@/theme/colors";

const ID_TYPE_OPTIONS = [
  {
    value: "cedula-persona",
    label: "Cédula de identidad",
    description: "Ciudadanía nacional",
    placeholder: "1-1234-5678",
  },
  {
    value: "cedula-juridica",
    label: "Cédula jurídica",
    description: "Empresas y organizaciones",
    placeholder: "3-101-123456",
  },
  {
    value: "pasaporte",
    label: "Pasaporte",
    description: "Documentos internacionales",
    placeholder: "AA1234567",
  },
  {
    value: "dimex",
    label: "DIMEX",
    description: "Documento para extranjeros residentes",
    placeholder: "123456789012",
  },
  {
    value: "didi",
    label: "DIDI",
    description: "Documento de identidad digital",
    placeholder: "CR-DIDI-1234",
  },
] as const;

const LoginScreen = () => {
  const router = useRouter();
  const { login, isAuthenticated, user } = useBankStore();
  const [cedula, setCedula] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idType, setIdType] = useState<string>(() => {
    const found = ID_TYPE_OPTIONS.find(
      (option) => option.label === user.idType,
    );
    return found?.value ?? ID_TYPE_OPTIONS[0].value;
  });

  useEffect(() => {
    const match = ID_TYPE_OPTIONS.find(
      (option) => option.label === user.idType,
    );
    if (match) {
      setIdType(match.value);
    }
  }, [user.idType]);

  const selectedIdType = useMemo(
    () =>
      ID_TYPE_OPTIONS.find((option) => option.value === idType) ??
      ID_TYPE_OPTIONS[0],
    [idType],
  );

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(app)/home");
    }
  }, [isAuthenticated, router]);

  const welcomeMessage = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  const handleSubmit = () => {
    setError(null);
    if (!cedula.trim() || cedula.length < 9) {
      setError("Ingresa una cédula válida.");
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const success = login({
        id: cedula,
        phone,
        idType: selectedIdType.label,
      });
      setLoading(false);
      if (!success) {
        setError("No pudimos validar tus datos, intenta de nuevo.");
        return;
      }
      router.replace("/(app)/home");
    }, 600);
  };

  return (
    <FuturisticBackground>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <MotiView
          style={styles.container}
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
        >
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600 }}
            style={styles.header}
          >
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons
                name="bank-transfer"
                size={36}
                color={palette.textPrimary}
              />
            </View>
            <Text style={styles.greeting}>{welcomeMessage}</Text>
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>
              Gestiona tu SINPE Móvil con una experiencia futurista y segura.
            </Text>
          </MotiView>

          <View style={styles.form}>
            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 600, delay: 150 }}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>Datos de acceso</Text>
              <NeonSelectField
                label="Tipo de identificación"
                value={idType}
                onValueChange={setIdType}
                options={ID_TYPE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                  description: option.description,
                }))}
                placeholder="Selecciona un documento"
                helpText="Selecciona el documento con el que deseas iniciar sesión."
                icon={
                  <MaterialCommunityIcons
                    name="card-account-details"
                    size={20}
                    color={palette.accentCyan}
                  />
                }
              />
              <NeonTextField
                label="Número de identificación"
                placeholder={selectedIdType.placeholder}
                value={cedula}
                autoCapitalize="characters"
                onChangeText={setCedula}
                keyboardType="numbers-and-punctuation"
                icon={
                  <MaterialCommunityIcons
                    name="card-account-details-outline"
                    size={20}
                    color={palette.accentCyan}
                  />
                }
              />
              <NeonTextField
                label="Número telefónico"
                placeholder={user.phone}
                value={phone}
                keyboardType="phone-pad"
                onChangeText={setPhone}
                icon={
                  <MaterialCommunityIcons
                    name="cellphone"
                    size={20}
                    color={palette.accentCyan}
                  />
                }
                errorMessage={error || undefined}
              />
              <PrimaryButton
                label="Ingresar"
                onPress={handleSubmit}
                loading={loading}
              />
              <Text style={styles.helper}>
                Tus datos se quedan en tu dispositivo. Sin conexiones externas.
              </Text>
            </MotiView>
          </View>
        </MotiView>
      </ScrollView>
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 40,
  },
  header: {
    gap: 16,
    alignItems: "flex-start",
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  greeting: {
    fontSize: 16,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: palette.textMuted,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    color: palette.textPrimary,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  card: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: "rgba(8, 16, 34, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  helper: {
    fontSize: 12,
    color: palette.textMuted,
    textAlign: "center",
  },
});

export default LoginScreen;
