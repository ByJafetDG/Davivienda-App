import { MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  BarCodeScannerModule,
  BarCodeScannerProps,
  BarCodeScannerResult,
  PermissionResponse,
} from "expo-barcode-scanner";
import { useLocalSearchParams, useRouter } from "expo-router";
import { NativeModulesProxy } from "expo-modules-core";
import { MotiView } from "moti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  PressableStateCallbackType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Easing } from "react-native-reanimated";

import FuturisticBackground from "@/components/FuturisticBackground";
import NeonTextField from "@/components/NeonTextField";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { useBankStore, Contact } from "@/store/useBankStore";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";
import { formatPhoneNumber, sanitizePhoneInput, PHONE_REQUIRED_LENGTH } from "@/utils/phone";
import MarqueeText from "@/components/MarqueeText";

const sanitizeAmountInput = (value: string) => {
  const cleaned = value.replace(/[^0-9.,]/g, "");
  if (!cleaned) {
    return "";
  }

  const dotCount = (cleaned.match(/\./g) ?? []).length;
  const commaCount = (cleaned.match(/,/g) ?? []).length;
  let decimalSeparator: "." | "," | null = null;

  if (commaCount > 0 && dotCount > 0) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot) {
      const decimalsCount = cleaned.length - lastComma - 1;
      if (decimalsCount > 0 && decimalsCount <= 2) {
        decimalSeparator = ",";
      }
    }
    if (!decimalSeparator) {
      const decimalsCount = cleaned.length - lastDot - 1;
      if (decimalsCount > 0 && decimalsCount <= 2) {
        decimalSeparator = ".";
      }
    }
  } else if (commaCount === 1) {
    const lastComma = cleaned.lastIndexOf(",");
    const decimalsCount = cleaned.length - lastComma - 1;
    if (decimalsCount > 0 && decimalsCount <= 2) {
      decimalSeparator = ",";
    }
  } else if (dotCount === 1) {
    const lastDot = cleaned.lastIndexOf(".");
    const decimalsCount = cleaned.length - lastDot - 1;
    if (decimalsCount > 0 && decimalsCount <= 2) {
      decimalSeparator = ".";
    }
  }

  let normalized: string;
  if (decimalSeparator === ",") {
    normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
  } else if (decimalSeparator === ".") {
    normalized = cleaned.replace(/,/g, "");
  } else {
    normalized = cleaned.replace(/[.,]/g, "");
  }

  const [rawInteger = "", rawDecimals = ""] = normalized.split(".");
  const integerDigits = rawInteger.replace(/^0+(?=\d)/, "");
  const decimals = rawDecimals.slice(0, 2);
  const hasDecimals = decimals.length > 0;
  const integerPart = integerDigits || (hasDecimals ? "0" : "");

  if (!integerPart && !hasDecimals) {
    return "";
  }

  return hasDecimals ? `${integerPart}.${decimals}` : integerPart;
};

const formatAmountDisplay = (raw: string) => {
  if (!raw) {
    return "";
  }
  const [integerPartRaw, decimalsRaw] = raw.split(".");
  const integerPart = integerPartRaw || "0";
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimals = decimalsRaw ? `,${decimalsRaw}` : "";
  return `₡${formattedInteger}${decimals}`;
};

const parseAmountToNumber = (raw: string) => {
  if (!raw) {
    return NaN;
  }
  return Number(raw);
};

const MoneyTransferScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contactName?: string;
    phone?: string;
    amount?: string;
    note?: string;
  }>();
  const { contacts, balance, recordContactUsage } = useBankStore();

  const [contactName, setContactName] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showRecipientField, setShowRecipientField] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerPermission, setScannerPermission] = useState<null | boolean>(null);
  const [scannerBusy, setScannerBusy] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scanExpanded, setScanExpanded] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const hasHandledScan = useRef(false);

  const formattedPhone = useMemo(() => formatPhoneNumber(phoneRaw), [phoneRaw]);
  const formattedAmount = useMemo(() => formatAmountDisplay(amountRaw), [amountRaw]);

  type ScannerModule = {
    BarCodeScanner: ComponentType<BarCodeScannerProps>;
    getPermissionsAsync?: () => Promise<PermissionResponse>;
    requestPermissionsAsync: () => Promise<PermissionResponse>;
  };

  const barCodeScannerModuleRef = useRef<ScannerModule | null>(null);
  const [scannerModule, setScannerModule] = useState<ScannerModule | null>(null);
  const hasNativeScanner = Boolean(
    (NativeModulesProxy as Record<string, unknown>)?.ExpoBarCodeScanner,
  );

  const loadScannerModule = useCallback(async () => {
    if (barCodeScannerModuleRef.current) {
      return barCodeScannerModuleRef.current;
    }

    try {
      const module = await import("expo-barcode-scanner");
      const resolved: ScannerModule = {
        BarCodeScanner: module.BarCodeScanner,
        getPermissionsAsync: module.getPermissionsAsync,
        requestPermissionsAsync: module.requestPermissionsAsync,
      };
      barCodeScannerModuleRef.current = resolved;
      setScannerModule(resolved);
      return resolved;
    } catch (error) {
      barCodeScannerModuleRef.current = null;
      throw error;
    }
  }, []);

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
      setPhoneRaw(sanitizePhoneInput(params.phone));
    }
    if (typeof params.amount === "string") {
      setAmountRaw(sanitizeAmountInput(params.amount));
    }
    if (typeof params.note === "string") {
      setNote(params.note);
    }

    if (typeof params.contactName === "string" || typeof params.phone === "string") {
      setShowRecipientField(true);
    }

    didPrefill.current = true;
  }, [params.amount, params.contactName, params.note, params.phone]);

  useEffect(() => {
    let isMounted = true;
    if (!scannerVisible) {
      return;
    }

    setScannerPermission(null);
    setScannerError(null);
    hasHandledScan.current = false;

    if (!hasNativeScanner) {
      setScannerPermission(false);
      setScannerError(
        "Este build de Expo Go no incluye el lector. Usa 'npm run start:classic' o un dev build personalizado.",
      );
      return;
    }

    loadScannerModule()
      .then(async (module) => {
        if (!scannerModule) {
          setScannerModule(module);
        }

        const initial = module.getPermissionsAsync
          ? await module.getPermissionsAsync()
          : await module.requestPermissionsAsync();

        if (!isMounted) {
          return;
        }

        if (initial?.status === "granted" || initial?.granted) {
          setScannerPermission(true);
          return;
        }

        const requested = await module.requestPermissionsAsync();
        if (!isMounted) {
          return;
        }

        const granted = Boolean(requested?.status === "granted" || requested?.granted);
        if (granted) {
          setScannerPermission(true);
          return;
        }

        setScannerPermission(false);
        setScannerError(
          requested?.canAskAgain === false
            ? "La cámara está bloqueada. Activa el permiso desde Ajustes para usar el escáner."
            : "Necesitas conceder acceso a la cámara para escanear códigos.",
        );
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setScannerPermission(false);
        setScannerError(
          "No se pudo inicializar el escáner. Usa 'npm run start:classic' o un build personalizado.",
        );
      });

    return () => {
      isMounted = false;
    };
  }, [hasNativeScanner, loadScannerModule, scannerModule, scannerVisible]);

  const topContacts = useMemo(() => {
    return [...contacts]
      .sort((a, b) => {
        if (a.favorite !== b.favorite) {
          return Number(b.favorite) - Number(a.favorite);
        }
        const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        if (aTime !== bTime) {
          return bTime - aTime;
        }
        return a.name.localeCompare(b.name, "es");
      })
      .slice(0, 6);
  }, [contacts]);

  const handleSelectContact = (contact: Contact) => {
    if (selectedContactId === contact.id) {
      setSelectedContactId(null);
      setContactName("");
      setPhoneRaw("");
      setShowRecipientField(false);
      return;
    }

    setSelectedContactId(contact.id);
    setContactName(contact.name);
    setPhoneRaw(sanitizePhoneInput(contact.phone));
    setShowRecipientField(true);
    recordContactUsage(contact.phone, contact.name);
  };

  const applyScanResult = (payload: Partial<{ name: string; phone: string; amount: string | number; note: string }>) => {
    const nextName = payload.name?.trim() ?? "";
    const nextPhone = payload.phone?.trim() ?? "";
    const nextAmount = payload.amount;
    const nextNote = payload.note?.trim() ?? "";

    if (nextName) {
      setContactName(nextName);
      setShowRecipientField(true);
    }
    if (nextPhone) {
      setPhoneRaw(sanitizePhoneInput(nextPhone));
    }
    if (typeof nextAmount === "number" && Number.isFinite(nextAmount)) {
      setAmountRaw(sanitizeAmountInput(nextAmount.toString()));
    } else if (typeof nextAmount === "string" && nextAmount.trim()) {
      setAmountRaw(sanitizeAmountInput(nextAmount.trim()));
    }
    if (nextNote) {
      setNote(nextNote);
    }
    setError(null);
  };

  const parseBarcodePayload = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          name: typeof parsed.name === "string" ? parsed.name : undefined,
          phone: typeof parsed.phone === "string" ? parsed.phone : undefined,
          amount: typeof parsed.amount === "number" || typeof parsed.amount === "string" ? parsed.amount : undefined,
          note: typeof parsed.note === "string" ? parsed.note : undefined,
        };
      }
    } catch (err) {
      // ignore, will attempt other formats
    }

    const cleaned = raw.trim();
    if (cleaned.includes("=")) {
      try {
        const search = cleaned.includes("?") ? cleaned.split("?").pop() ?? cleaned : cleaned;
        const params = new URLSearchParams(search);
        return {
          name: params.get("name") ?? params.get("contact") ?? undefined,
          phone: params.get("phone") ?? params.get("tel") ?? undefined,
          amount: params.get("amount") ?? params.get("value") ?? undefined,
          note: params.get("note") ?? params.get("concept") ?? undefined,
        };
      } catch (err) {
        return {};
      }
    }

    const tokens = cleaned.split(/[;|,\n]/).map((token) => token.trim());
    let phone: string | undefined;
    let amount: string | number | undefined;
    let name: string | undefined;
    let note: string | undefined;

    tokens.forEach((token) => {
      if (!token) {
        return;
      }
      const [rawKey, rawValue] = token.split(":");
      if (!rawValue) {
        return;
      }
      const key = rawKey.toLowerCase();
      const value = rawValue.trim();
      if (!value) {
        return;
      }
      if (!phone && key.includes("tel")) {
        phone = value;
      } else if (!amount && key.includes("monto")) {
        amount = value;
      } else if (!name && key.includes("nombre")) {
        name = value;
      } else if (!note && key.includes("nota")) {
        note = value;
      }
    });

    return { phone, amount, name, note };
  };

  const handleBarCodeScanned = ({ data }: BarCodeScannerResult) => {
    if (hasHandledScan.current) {
      return;
    }
    hasHandledScan.current = true;
    setScannerBusy(true);

    const parsed = parseBarcodePayload(data ?? "");
    applyScanResult(parsed);
    setScannerBusy(false);
    setScannerVisible(false);
  };

  const openScanner = () => {
    setScannerError(null);
    setScanExpanded(false);
    setScannerVisible(true);
  };

  const closeScanner = () => {
    setScannerVisible(false);
  };

  const toggleScanHint = () => {
    setScanExpanded((prev) => !prev);
  };

  const handlePhoneChange = (text: string) => {
    setError(null);
    setPhoneRaw(sanitizePhoneInput(text));
  };

  const handleAmountChange = (text: string) => {
    setError(null);
    setAmountRaw(sanitizeAmountInput(text));
  };

  const handleContinue = () => {
    setError(null);
    const amountNumber = parseAmountToNumber(amountRaw);
    const resolvedContactName = contactName.trim() || formattedPhone.trim();
    if (!resolvedContactName) {
      setError("Selecciona un destinatario o ingresa un número válido.");
      return;
    }
    if (!phoneRaw || phoneRaw.length < PHONE_REQUIRED_LENGTH) {
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
        contactName: resolvedContactName,
        phone: formattedPhone,
        amount: amountNumber.toString(),
        note,
      },
    });
  };

  const shouldShowRecipientInput = showRecipientField || contactName.trim().length > 0;
  const ScannerComponent: ComponentType<BarCodeScannerProps> | null = hasNativeScanner
    ? scannerModule?.BarCodeScanner ?? null
    : null;

  const requestScannerPermission = useCallback(async () => {
    setScannerError(null);
    if (!hasNativeScanner) {
      setScannerError(
        "Este build de Expo Go no incluye el lector. Usa 'npm run start:classic' o un dev build personalizado.",
      );
      return;
    }
    setRequestingPermission(true);
    try {
      const module = await loadScannerModule();
      const result = await module.requestPermissionsAsync();
      const granted = Boolean(result?.status === "granted" || result?.granted);
      setScannerPermission(granted);
      if (!granted) {
        setScannerError(
          result?.canAskAgain === false
            ? "La cámara está bloqueada. Activa el permiso desde Ajustes para usar el escáner."
            : "Permite el acceso a la cámara para continuar.",
        );
      }
    } catch (err) {
      setScannerPermission(false);
      setScannerError("No se pudo solicitar el permiso de cámara. Intenta nuevamente.");
    } finally {
      setRequestingPermission(false);
    }
  }, [hasNativeScanner, loadScannerModule]);

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
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                style={styles.backButton}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={26}
                  color={palette.textPrimary}
                />
              </Pressable>
              <Text style={styles.title}>Nueva transferencia</Text>
              <ProfileAvatarButton
                size={40}
                onPress={() => router.push("/(app)/profile")}
                accessibilityLabel="Ir a tu perfil"
                style={styles.profileShortcut}
              />
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
              <View style={styles.contactHeader}>
                <Text style={styles.sectionTitle}>Contactos frecuentes</Text>
                <Pressable
                  onPress={() => router.push("/(app)/contacts")}
                  accessibilityRole="button"
                  accessibilityLabel="Gestionar contactos"
                >
                  {({ pressed }: PressableStateCallbackType) => (
                    <Text
                      style={[
                        styles.contactsLink,
                        pressed && styles.contactsLinkPressed,
                      ]}
                    >
                      Ver contactos
                    </Text>
                  )}
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
                keyboardShouldPersistTaps="handled"
              >
                {topContacts.map((contact: Contact) => {
                  const isSelected = contact.id === selectedContactId;
                  return (
                    <Pressable
                      key={contact.id}
                      onPress={() => handleSelectContact(contact)}
                      style={styles.contactChip}
                      accessibilityRole="button"
                    >
                      {(state: PressableStateCallbackType) => (
                        <MotiView
                          animate={{
                            scale: state.pressed ? 0.95 : 1,
                            opacity: state.pressed ? 0.75 : 1,
                          }}
                          style={[
                            styles.contactBadge,
                            isSelected && styles.contactBadgeActive,
                          ]}
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
                          <View style={styles.contactLabelWrapper}>
                            <Text style={styles.contactName}>
                              {contact.name.split(" ")[0]}
                            </Text>
                            {contact.favorite ? (
                              <MaterialCommunityIcons
                                name="star"
                                size={16}
                                color={palette.accentCyan}
                              />
                            ) : null}
                          </View>
                        </MotiView>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <MotiView
              style={styles.form}
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 520, delay: 150 }}
            >
              <View style={styles.scanInlineRow}>
                <Pressable
                  onPress={openScanner}
                  accessibilityRole="button"
                  accessibilityLabel="Escanear código QR"
                  style={styles.scanActionWrapper}
                >
                  {(state: PressableStateCallbackType) => (
                    <MotiView
                      style={styles.scanInlineButton}
                      animate={{
                        width: scanExpanded ? 290 : 56,
                        paddingHorizontal: scanExpanded ? 18 : 0,
                        paddingVertical: scanExpanded ? 14 : 0,
                        borderRadius: scanExpanded ? 20 : 18,
                        backgroundColor: scanExpanded
                          ? "rgba(0, 240, 255, 0.1)"
                          : "rgba(0, 240, 255, 0.16)",
                        borderColor: scanExpanded
                          ? "rgba(0, 240, 255, 0.3)"
                          : "rgba(0, 240, 255, 0.42)",
                        scale: state.pressed ? 0.96 : 1,
                        opacity: state.pressed ? 0.82 : 1,
                        height: scanExpanded ? 56 : 48,
                      }}
                      transition={{ type: "timing", duration: 230, easing: Easing.out(Easing.cubic) }}
                    >
                      <MotiView
                        style={styles.scanInlineIconWrapper}
                        animate={{
                          marginRight: scanExpanded ? 14 : 0,
                          backgroundColor: scanExpanded
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(0, 12, 24, 0.24)",
                        }}
                        transition={{ type: "timing", duration: 220, easing: Easing.out(Easing.cubic) }}
                      >
                        <MaterialCommunityIcons
                          name="qrcode-scan"
                          size={22}
                          color={palette.textPrimary}
                        />
                      </MotiView>
                      <MotiView
                        pointerEvents="none"
                        style={styles.scanInlineTextWrapper}
                        animate={{
                          opacity: scanExpanded ? 1 : 0,
                          maxWidth: scanExpanded ? 220 : 0,
                        }}
                        transition={{ type: "timing", duration: 220, easing: Easing.out(Easing.cubic) }}
                      >
                        <Text style={styles.scanInlineTitle}>Escanear QR</Text>
                        <MarqueeText
                          text="Autocompleta la información del código QR de tu contacto"
                          textStyle={styles.scanInlineHint}
                          containerStyle={styles.scanInlineHintMarquee}
                          speedFactor={42}
                          gap={28}
                          delay={680}
                          isActive={scanExpanded}
                        />
                      </MotiView>
                      {scanExpanded ? (
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={24}
                          color={palette.textSecondary}
                        />
                      ) : null}
                    </MotiView>
          )}
        </Pressable>
                <Pressable
                  onPress={toggleScanHint}
                  accessibilityRole="button"
                  accessibilityLabel="Mostrar información del escáner QR"
                  style={styles.scanHelpButton}
                >
                  {(state: PressableStateCallbackType) => (
                    <MotiView
                      style={styles.scanHelpInner}
                      animate={{
                        scale: state.pressed ? 0.92 : 1,
                        rotate: scanExpanded ? "180deg" : "0deg",
                        backgroundColor: scanExpanded
                          ? "rgba(0, 240, 255, 0.22)"
                          : "rgba(255, 255, 255, 0.08)",
                      }}
                      transition={{ type: "timing", duration: 220, easing: Easing.out(Easing.cubic) }}
                    >
                      <Text style={styles.scanHelpLabel}>➜</Text>
                    </MotiView>
                  )}
                </Pressable>
              </View>
              {shouldShowRecipientInput ? (
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
              ) : null}
              <NeonTextField
                label="Número telefónico"
                placeholder="0000-0000"
                value={formattedPhone}
                onChangeText={handlePhoneChange}
                allowOnlyNumeric
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
                value={formattedAmount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                allowOnlyNumeric
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
            </MotiView>
          </MotiView>
        </ScrollView>
      </View>

      <Modal
        visible={scannerVisible}
        transparent
        animationType="fade"
        onRequestClose={closeScanner}
      >
        <View style={styles.scannerBackdrop}>
          <View style={styles.scannerCard}>
            <View style={styles.scannerHeader}>
              <Text style={styles.scannerTitle}>Escanear código QR</Text>
              <Pressable
                onPress={closeScanner}
                accessibilityRole="button"
                accessibilityLabel="Cerrar escáner"
                style={styles.scannerClose}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={palette.textSecondary}
                />
              </Pressable>
            </View>
            {scannerPermission === null ? (
              <View style={styles.scannerPlaceholder}>
                <ActivityIndicator color={palette.accentCyan} size="large" />
                <Text style={styles.scannerHint}>Solicitando permiso…</Text>
              </View>
            ) : scannerPermission === false ? (
              <View style={styles.scannerPlaceholder}>
                <MaterialCommunityIcons
                  name="lock-alert"
                  size={42}
                  color={palette.danger}
                />
                <Text style={styles.scannerHint}>
                  Sin acceso a la cámara. Habilita el permiso desde ajustes.
                </Text>
                {scannerError ? (
                  <Text style={styles.scannerError}>{scannerError}</Text>
                ) : null}
              </View>
            ) : scannerPermission && ScannerComponent ? (
              <View style={styles.scannerViewport}>
                <ScannerComponent
                  onBarCodeScanned={handleBarCodeScanned}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.scannerOverlay}>
                  <View style={styles.scannerReticle} />
                </View>
              </View>
            ) : (
              <View style={styles.scannerPlaceholder}>
                <ActivityIndicator color={palette.accentCyan} size="large" />
                <Text style={styles.scannerHint}>
                  {scannerError ?? "Necesitamos tu permiso para usar la cámara."}
                </Text>
                <PrimaryButton
                  label={requestingPermission ? "Solicitando…" : "Permitir cámara"}
                  onPress={requestScannerPermission}
                  disabled={requestingPermission}
                  style={styles.permissionButton}
                />
              </View>
            )}
            <Text style={styles.scannerFooter}>
              Aceptamos códigos con formato JSON, query string o lista clave-valor.
            </Text>
            {scannerBusy ? (
              <View style={styles.scannerBusyRow}>
                <ActivityIndicator color={palette.accentCyan} />
                <Text style={styles.scannerHint}>Procesando…</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: "relative",
  },
  scroll: {
    paddingBottom: 260,
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
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  profileShortcut: {
    shadowOpacity: 0.32,
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
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  contactsLink: {
    color: palette.accentCyan,
    fontSize: 13,
    fontWeight: "600",
  },
  contactsLinkPressed: {
    opacity: 0.7,
  },
  chipsRow: {
    gap: 12,
    paddingRight: 12,
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
  contactBadgeActive: {
    borderColor: palette.accentCyan,
    backgroundColor: "rgba(0, 240, 255, 0.16)",
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
  contactLabelWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  form: {
    gap: 18,
  },
  scanInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scanActionWrapper: {
    flexShrink: 1,
    alignItems: "flex-start",
  },
  scanInlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 48,
  },
  scanInlineIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  scanInlineTextWrapper: {
    flex: 1,
    gap: 4,
  },
  scanInlineTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  scanInlineHint: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  scanInlineHintMarquee: {
    width: "100%",
  },
  scanHelpButton: {
    width: 48,
    height: 48,
    borderRadius: 20,
    overflow: "hidden",
  },
  scanHelpInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.25)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  scanHelpLabel: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  error: {
    color: palette.danger,
    fontSize: 13,
    textAlign: "center",
  },
  scannerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 4, 12, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  scannerCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    padding: 22,
    backgroundColor: "rgba(6, 12, 24, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 16,
  },
  scannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scannerTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  scannerClose: {
    width: 34,
    height: 34,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  scannerPlaceholder: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  permissionButton: {
    alignSelf: "stretch",
    marginTop: 4,
  },
  scannerHint: {
    color: palette.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  scannerError: {
    color: palette.danger,
    fontSize: 12,
    textAlign: "center",
  },
  scannerViewport: {
    borderRadius: 22,
    overflow: "hidden",
    height: 240,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.28)",
    backgroundColor: "rgba(2, 8, 18, 0.95)",
    marginTop: 8,
  },
  scannerOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerReticle: {
    width: "70%",
    height: "60%",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: palette.accentCyan,
    backgroundColor: "rgba(0, 12, 24, 0.25)",
  },
  scannerFooter: {
    color: palette.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  scannerBusyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});

export default MoneyTransferScreen;
