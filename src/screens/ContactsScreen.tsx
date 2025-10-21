import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import NeonTextField from "@/components/NeonTextField";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import PrimaryButton from "@/components/PrimaryButton";
import {
  useBankStore,
  Contact,
  ContactDraft,
} from "@/store/useBankStore";
import { palette } from "@/theme/colors";

const ContactFormModal = ({
  visible,
  onClose,
  onSubmit,
  form,
  setForm,
  error,
  editing,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: ContactDraft;
  setForm: Dispatch<SetStateAction<ContactDraft>>;
  error: string | null;
  editing: boolean;
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 220 }}
          style={styles.modalCard}
        >
          <Text style={styles.modalTitle}>
            {editing ? "Editar contacto" : "Nuevo contacto"}
          </Text>
          <NeonTextField
            label="Nombre"
            placeholder="Ej. Ana Gómez"
            value={form.name}
            onChangeText={(value) => setForm({ ...form, name: value })}
            icon={
              <MaterialCommunityIcons
                name="account"
                size={20}
                color={palette.accentCyan}
              />
            }
          />
          <NeonTextField
            label="Teléfono"
            placeholder="0000 0000"
            value={form.phone}
            onChangeText={(value) => setForm({ ...form, phone: value })}
            keyboardType="phone-pad"
            icon={
              <MaterialCommunityIcons
                name="phone"
                size={20}
                color={palette.accentCyan}
              />
            }
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalSecondaryButton}>
              <Text style={styles.modalSecondaryLabel}>Cancelar</Text>
            </Pressable>
            <PrimaryButton
              label={editing ? "Guardar" : "Crear"}
              onPress={onSubmit}
            />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

const ContactsScreen = () => {
  const router = useRouter();
  const {
    contacts,
    addContact,
    updateContact,
    removeContact,
    toggleFavoriteContact,
  } = useBankStore();

  const [formVisible, setFormVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactDraft>({ name: "", phone: "" });
  const [error, setError] = useState<string | null>(null);

  const favorites = useMemo(
    () =>
      contacts
        .filter((contact: Contact) => contact.favorite)
        .sort((a, b) => {
          const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
          const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
          if (aTime !== bTime) {
            return bTime - aTime;
          }
          return a.name.localeCompare(b.name, "es");
        }),
    [contacts],
  );

  const others = useMemo(
    () =>
      contacts
        .filter((contact: Contact) => !contact.favorite)
        .sort((a, b) => {
          const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
          const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
          if (aTime !== bTime) {
            return bTime - aTime;
          }
          return a.name.localeCompare(b.name, "es");
        }),
    [contacts],
  );

  const totalContacts = contacts.length;
  const lastUsed = useMemo(() => {
    const latest = contacts.reduce<string | null>((acc, item) => {
      if (!item.lastUsedAt) {
        return acc;
      }
      if (!acc) {
        return item.lastUsedAt;
      }
      return new Date(item.lastUsedAt) > new Date(acc) ? item.lastUsedAt : acc;
    }, null);
    if (!latest) {
      return "Sin interacciones recientes";
    }
    const diff = Date.now() - new Date(latest).getTime();
    const hours = Math.round(diff / (1000 * 60 * 60));
    if (hours < 1) {
      return "Hace instantes";
    }
    if (hours < 24) {
      return `Hace ${hours} h`;
    }
    const days = Math.round(hours / 24);
    return `Hace ${days} d`;
  }, [contacts]);

  const openCreate = () => {
    setForm({ name: "", phone: "" });
    setEditingContact(null);
    setError(null);
    setFormVisible(true);
  };

  const openEdit = (contact: Contact) => {
    setForm({ name: contact.name, phone: contact.phone });
    setEditingContact(contact);
    setError(null);
    setFormVisible(true);
  };

  const closeModal = () => {
    setFormVisible(false);
    setForm({ name: "", phone: "" });
    setEditingContact(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (!form.phone.trim()) {
      setError("Ingresa un número telefónico válido.");
      return;
    }
    if (!/^[0-9\s+-]{8,}$/.test(form.phone.trim())) {
      setError("El número debe tener al menos 8 dígitos.");
      return;
    }

    try {
      if (editingContact) {
        updateContact(editingContact.id, {
          name: form.name,
          phone: form.phone,
          lastUsedAt: editingContact.lastUsedAt,
        });
      } else {
        addContact({
          name: form.name,
          phone: form.phone,
        });
      }
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    }
  };

  const handleRemove = (contact: Contact) => {
    Alert.alert(
      "Eliminar contacto",
      `¿Deseas eliminar a ${contact.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => removeContact(contact.id),
        },
      ],
    );
  };

  const handleTransfer = (contact: Contact) => {
    router.push({
      pathname: "/(app)/transfer",
      params: {
        contactName: contact.name,
        phone: contact.phone,
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
            <Text style={styles.title}>Contactos frecuentes</Text>
            <ProfileAvatarButton
              size={40}
              onPress={() => router.push("/(app)/profile")}
              accessibilityLabel="Ir a tu perfil"
              style={styles.profileShortcut}
            />
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 480 }}
          >
            <GlassCard>
              <View style={styles.summaryCard}>
                <View>
                  <Text style={styles.summaryLabel}>Contactos guardados</Text>
                  <Text style={styles.summaryValue}>{totalContacts}</Text>
                  <Text style={styles.summaryHint}>{lastUsed}</Text>
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Favoritos</Text>
                  <Text style={styles.summaryValue}>{favorites.length}</Text>
                  <Text style={styles.summaryHint}>
                    Presiona la estrella para fijarlos primero.
                  </Text>
                </View>
                <PrimaryButton
                  label="Nuevo contacto"
                  onPress={openCreate}
                  style={styles.summaryButton}
                />
              </View>
            </GlassCard>
          </MotiView>

          {contacts.length === 0 ? (
            <GlassCard>
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="account-box-outline"
                  size={46}
                  color={palette.accentCyan}
                />
                <Text style={styles.emptyTitle}>Aún no tienes contactos</Text>
                <Text style={styles.emptyCopy}>
                  Cada transferencia que realices se guardará automáticamente aquí.
                </Text>
                <PrimaryButton label="Agregar manualmente" onPress={openCreate} />
              </View>
            </GlassCard>
          ) : (
            <View style={styles.listSection}>
              {favorites.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Favoritos</Text>
                  {favorites.map((contact) => (
                    <GlassCard key={contact.id}>
                      <View style={styles.contactRow}>
                        <View
                          style={[styles.contactAvatarLarge, { backgroundColor: contact.avatarColor }]}
                        >
                          <Text style={styles.contactAvatarText}>
                            {contact.name.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.contactCopy}>
                          <Text style={styles.contactName}>{contact.name}</Text>
                          <Text style={styles.contactPhone}>{contact.phone}</Text>
                        </View>
                        <View style={styles.contactActions}>
                          <Pressable
                            onPress={() => toggleFavoriteContact(contact.id)}
                            style={styles.iconButton}
                            accessibilityRole="button"
                          >
                            <MaterialCommunityIcons
                              name={contact.favorite ? "star" : "star-outline"}
                              size={22}
                              color={palette.accentCyan}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => handleTransfer(contact)}
                            style={styles.iconButton}
                            accessibilityRole="button"
                          >
                            <MaterialCommunityIcons
                              name="send"
                              size={20}
                              color={palette.textSecondary}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => openEdit(contact)}
                            style={styles.iconButton}
                            accessibilityRole="button"
                          >
                            <MaterialCommunityIcons
                              name="pencil"
                              size={20}
                              color={palette.textSecondary}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => handleRemove(contact)}
                            style={styles.iconButton}
                            accessibilityRole="button"
                          >
                            <MaterialCommunityIcons
                              name="delete"
                              size={20}
                              color={palette.danger}
                            />
                          </Pressable>
                        </View>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              ) : null}

              {others.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Contactos</Text>
                  {others.map((contact) => (
                    <GlassCard key={contact.id}>
                      <View style={styles.contactRow}>
                        <View
                          style={[styles.contactAvatarLarge, { backgroundColor: contact.avatarColor }]}
                        >
                          <Text style={styles.contactAvatarText}>
                            {contact.name.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.contactCopy}>
                          <Text style={styles.contactName}>{contact.name}</Text>
                          <Text style={styles.contactPhone}>{contact.phone}</Text>
                        </View>
                        <View style={styles.contactActions}>
                          <Pressable
                            onPress={() => toggleFavoriteContact(contact.id)}
                            style={styles.iconButton}
                            accessibilityRole="button"
                          >
                            <MaterialCommunityIcons
                              name={contact.favorite ? "star" : "star-outline"}
                              size={22}
                              color={palette.textSecondary}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => handleTransfer(contact)}
                            style={styles.iconButton}
                            accessibilityRole="button"
                          >
                            <MaterialCommunityIcons
                              name="send"
                              size={20}
                              color={palette.textSecondary}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => openEdit(contact)}
                            style={styles.iconButton}
                            accessibilityRole="button"
                          >
                            <MaterialCommunityIcons
                              name="pencil"
                              size={20}
                              color={palette.textSecondary}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => handleRemove(contact)}
                            style={styles.iconButton}
                            accessibilityRole="button"
                          >
                            <MaterialCommunityIcons
                              name="delete"
                              size={20}
                              color={palette.danger}
                            />
                          </Pressable>
                        </View>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <ContactFormModal
        visible={formVisible}
        onClose={closeModal}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        error={error}
        editing={!!editingContact}
      />
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 180,
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
    gap: 18,
    padding: 22,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: palette.textPrimary,
    fontSize: 26,
    fontWeight: "800",
  },
  summaryHint: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  summaryButton: {
    marginTop: 8,
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
  listSection: {
    gap: 24,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 6,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    gap: 16,
  },
  contactAvatarLarge: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarText: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  contactCopy: {
    flex: 1,
    gap: 4,
  },
  contactName: {
    color: palette.textPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
  contactPhone: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 17, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: "rgba(10, 18, 32, 0.92)",
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  modalSecondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  modalSecondaryLabel: {
    color: palette.textSecondary,
    fontWeight: "600",
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
  },
});

export default ContactsScreen;
