import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { Theme, useTheme } from "@/theme/ThemeProvider";
import { themes, type ThemeName } from "@/theme/colors";
import { useChatStore } from "@/store/useChatStore";

const themeCopy: Record<ThemeName, string> = {
  pionero: "Tema original de la aplicación, inspirado en la estética futurista.",
  aurora: "Tema oscuro minimalista con acentos turquesa elegantes.",
};

const SettingsScreen = () => {
  const router = useRouter();
  const { theme, themeName, setTheme, availableThemes } = useTheme();
  const { supportAssistantEnabled, toggleSupportAssistant } = useChatStore(
    (state) => ({
      supportAssistantEnabled: state.supportAssistantEnabled,
      toggleSupportAssistant: state.toggleSupportAssistant,
    }),
  );
  const styles = useMemo(() => createStyles(theme), [theme]);

  const themeOptions = useMemo(
    () =>
      availableThemes.map((name) => ({
        name,
        label: themes[name].name,
        description: themeCopy[name] ?? "",
      })),
    [availableThemes],
  );

  return (
    <FuturisticBackground>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            style={styles.container}
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420 }}
          >
            <View style={styles.header}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.push("/(app)/home")}
                accessibilityRole="button"
                accessibilityLabel="Volver"
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={26}
                  color={theme.palette.textPrimary}
                />
              </Pressable>
              <Text style={styles.title}>Ajustes</Text>
              <View style={styles.headerSpacer} />
            </View>

            <GlassCard>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tema de la aplicación</Text>
                <Text style={styles.sectionSubtitle}>
                  Personaliza la apariencia general eligiendo uno de los temas
                  disponibles.
                </Text>
                <View style={styles.optionList}>
                  {themeOptions.map((option) => {
                    const selected = option.name === themeName;
                    return (
                      <Pressable
                        key={option.name}
                        style={[
                          styles.optionRow,
                          selected && {
                            borderColor: theme.palette.primary,
                            backgroundColor: theme.components.card.overlay,
                          },
                        ]}
                        onPress={() => setTheme(option.name)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <View style={styles.optionTextGroup}>
                          <Text style={styles.optionLabel}>{option.label}</Text>
                          {option.description ? (
                            <Text style={styles.optionDescription}>
                              {option.description}
                            </Text>
                          ) : null}
                        </View>
                        <View
                          style={[styles.radio, selected && styles.radioActive]}
                        >
                          {selected ? (
                            <MaterialCommunityIcons
                              name="check"
                              size={18}
                              color={theme.palette.textPrimary}
                            />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </GlassCard>

            <GlassCard>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Asistente virtual</Text>
                <Text style={styles.sectionSubtitle}>
                  Controla la disponibilidad del chat de soporte. Al
                  desactivarlo, el botón flotante desaparecerá de la pantalla de
                  inicio.
                </Text>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextBlock}>
                    <Text style={styles.toggleLabel}>Mostrar botón de soporte</Text>
                    <Text style={styles.toggleDescription}>
                      Mantén activo el acompañamiento virtual para recibir ayuda
                      inmediata.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => toggleSupportAssistant(!supportAssistantEnabled)}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: supportAssistantEnabled }}
                    style={({ pressed }) => [
                      styles.switchBase,
                      supportAssistantEnabled
                        ? styles.switchBaseOn
                        : styles.switchBaseOff,
                      pressed && styles.switchBasePressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.switchThumb,
                        supportAssistantEnabled
                          ? styles.switchThumbOn
                          : styles.switchThumbOff,
                      ]}
                    />
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          </MotiView>
        </ScrollView>
      </View>
    </FuturisticBackground>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
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
      width: 40,
      height: 40,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.05)",
    },
    headerSpacer: {
      width: 40,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.palette.textPrimary,
    },
    section: {
      gap: 18,
      padding: 22,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.palette.textPrimary,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: theme.palette.textSecondary,
      lineHeight: 19,
    },
    optionList: {
      gap: 14,
    },
    optionRow: {
      padding: 16,
      borderRadius: 18,
      backgroundColor: "rgba(10, 10, 10, 0.28)",
      borderWidth: 1,
      borderColor: theme.palette.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    optionTextGroup: {
      flex: 1,
      gap: 6,
    },
    optionLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.palette.textPrimary,
    },
    optionDescription: {
      fontSize: 12,
      color: theme.palette.textMuted,
    },
    radio: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.4)",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    radioActive: {
      backgroundColor: theme.palette.primary,
      borderColor: theme.components.button.primaryHighlight,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 18,
    },
    toggleTextBlock: {
      flex: 1,
      gap: 6,
    },
    toggleLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.palette.textPrimary,
    },
    toggleDescription: {
      fontSize: 12,
      color: theme.palette.textSecondary,
      lineHeight: 18,
    },
    switchBase: {
      width: 52,
      height: 30,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.24)",
      backgroundColor: "rgba(255,255,255,0.2)",
      padding: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
    },
    switchBaseOn: {
      backgroundColor: "rgba(255,255,255,0.32)",
      justifyContent: "flex-end",
    },
    switchBaseOff: {
      justifyContent: "flex-start",
    },
    switchBasePressed: {
      opacity: 0.8,
    },
    switchThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#ffffff",
      shadowColor: "#000000",
      shadowOpacity: 0.18,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    switchThumbOn: {
      backgroundColor: "#ffffff",
    },
    switchThumbOff: {
      backgroundColor: "#ffffff",
    },
  });

export default SettingsScreen;
