import { create } from "zustand";

import { formatCurrency } from "@/utils/currency";
import { createId } from "@/utils/id";

export type Contact = {
  id: string;
  name: string;
  phone: string;
  avatarColor: string;
  favorite: boolean;
  lastUsedAt?: string;
};

export type ContactDraft = {
  name: string;
  phone: string;
  avatarColor?: string;
  favorite?: boolean;
};

export type ContactUpdate = Partial<Omit<Contact, "id" | "phone">> & {
  phone?: string;
};

export type TransferRecord = {
  id: string;
  contactName: string;
  phone: string;
  amount: number;
  note?: string;
  createdAt: string;
};

export type RechargeRecord = {
  id: string;
  provider: string;
  phone: string;
  amount: number;
  createdAt: string;
};

export type NotificationCategory =
  | "transfer"
  | "recharge"
  | "security"
  | "general";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: NotificationCategory;
};

export type NotificationDraft = {
  title: string;
  message: string;
  category?: NotificationCategory;
};

export type BiometricAttemptResult = "success" | "mismatch" | "timeout";

export type UserProfile = {
  name: string;
  id: string;
  phone: string;
  avatarColor: string;
  idType: string;
};

export type TransferDraft = {
  contactName: string;
  phone: string;
  amount: number;
  note?: string;
};

export type RechargeDraft = {
  provider: string;
  phone: string;
  amount: number;
};

export type BankState = {
  initialBalance: number;
  balance: number;
  isAuthenticated: boolean;
  user: UserProfile;
  biometricRegistered: boolean;
  biometricLastSync?: string;
  biometricAttempts: Array<{
    id: string;
    label: string;
    result: BiometricAttemptResult;
    timestamp: string;
    device: string;
  }>;
  contacts: Contact[];
  transfers: TransferRecord[];
  recharges: RechargeRecord[];
  notifications: NotificationItem[];
  addContact: (draft: ContactDraft) => Contact;
  updateContact: (id: string, updates: ContactUpdate) => void;
  removeContact: (id: string) => void;
  toggleFavoriteContact: (id: string) => void;
  recordContactUsage: (phone: string, name?: string) => void;
  login: (payload: { id: string; phone: string; idType?: string }) => boolean;
  simulateBiometricValidation: (payload?: {
    latencyMs?: number;
    expectedMatch?: boolean;
  }) => Promise<{ success: boolean; deviceName: string }>;
  registerBiometrics: (provider: { displayName: string }) => void;
  logout: () => void;
  sendTransfer: (draft: TransferDraft) => TransferRecord;
  makeRecharge: (draft: RechargeDraft) => RechargeRecord;
  addNotification: (draft: NotificationDraft) => NotificationItem;
  markNotificationRead: (id: string) => void;
  toggleNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
};

const STARTING_BALANCE = 509_015.4;
const DEFAULT_USER: UserProfile = {
  name: "María Rodríguez",
  id: "1-1234-5678",
  phone: "6203-4545",
  avatarColor: "#FF3358",
  idType: "Cédula de identidad",
};

const CONTACT_COLORS = [
  "#00F0FF",
  "#FF8A65",
  "#8F9BFF",
  "#4ADE80",
  "#FACC15",
  "#7A2BFF",
];

const DEFAULT_CONTACTS: Contact[] = [
  {
    id: createId("contact"),
    name: "Juan Perez Rojas",
    phone: "6203-4545",
    avatarColor: CONTACT_COLORS[0],
    favorite: true,
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: createId("contact"),
    name: "Laura Hernández",
    phone: "7102-9090",
    avatarColor: CONTACT_COLORS[1],
    favorite: true,
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: createId("contact"),
    name: "Carlos Jiménez",
    phone: "8803-1212",
    avatarColor: CONTACT_COLORS[2],
    favorite: false,
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: createId("notification"),
    title: "Transferencia recibida",
    message: `Carlos Jiménez te envió ${formatCurrency(35_000)} hace unas horas.`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    read: false,
    category: "transfer",
  },
  {
    id: createId("notification"),
    title: "Alerta de seguridad",
    message: "Recordatorio: actualiza tu PIN de SINPE Móvil periódicamente.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: false,
    category: "security",
  },
  {
    id: createId("notification"),
    title: "Recarga exitosa",
    message: `Se acreditaron ${formatCurrency(10_000)} a tu línea prepago.`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    read: true,
    category: "recharge",
  },
];

const getDefaultNotifications = () => DEFAULT_NOTIFICATIONS.map((item) => ({ ...item }));
const getDefaultContacts = () => DEFAULT_CONTACTS.map((contact) => ({ ...contact }));

type SetState = (
  partial:
    | BankState
    | Partial<BankState>
    | ((state: BankState) => BankState | Partial<BankState>),
  replace?: boolean,
) => void;

type GetState = () => BankState;

export const useBankStore = create<BankState>(
  (set: SetState, get: GetState) => ({
    initialBalance: STARTING_BALANCE,
    balance: STARTING_BALANCE,
    isAuthenticated: false,
    user: DEFAULT_USER,
    biometricRegistered: false,
    biometricLastSync: undefined,
    biometricAttempts: [],
    contacts: getDefaultContacts(),
    transfers: [],
    recharges: [],
    notifications: getDefaultNotifications(),
    addContact: (draft: ContactDraft) => {
      const phone = draft.phone.trim();
      if (!phone) {
        throw new Error("El número telefónico es requerido");
      }
      const name = draft.name.trim() || phone;
      const now = new Date().toISOString();
      const existing = get().contacts.find((item: Contact) => item.phone === phone);
      const colorFallback = draft.avatarColor || CONTACT_COLORS[Math.floor(Math.random() * CONTACT_COLORS.length)];

      if (existing) {
        const updated: Contact = {
          ...existing,
          name,
          avatarColor: draft.avatarColor || existing.avatarColor,
          favorite: draft.favorite ?? existing.favorite,
          lastUsedAt: now,
        };
        set((state: BankState) => ({
          contacts: [
            updated,
            ...state.contacts.filter((contact: Contact) => contact.id !== existing.id),
          ],
        }));
        return updated;
      }

      const contact: Contact = {
        id: createId("contact"),
        name,
        phone,
        avatarColor: colorFallback,
        favorite: draft.favorite ?? false,
        lastUsedAt: now,
      };

      set((state: BankState) => ({
        contacts: [contact, ...state.contacts],
      }));

      return contact;
    },
    updateContact: (id: string, updates: ContactUpdate) => {
      set((state: BankState) => ({
        contacts: state.contacts.map((contact: Contact) => {
          if (contact.id !== id) {
            return contact;
          }
          const nextPhone = updates.phone?.trim() || contact.phone;
          return {
            ...contact,
            name: updates.name?.trim() || contact.name,
            phone: nextPhone,
            avatarColor: updates.avatarColor || contact.avatarColor,
            favorite:
              typeof updates.favorite === "boolean"
                ? updates.favorite
                : contact.favorite,
            lastUsedAt: updates.lastUsedAt || contact.lastUsedAt,
          };
        }),
      }));
    },
    removeContact: (id: string) => {
      set((state: BankState) => ({
        contacts: state.contacts.filter((contact: Contact) => contact.id !== id),
      }));
    },
    toggleFavoriteContact: (id: string) => {
      set((state: BankState) => ({
        contacts: state.contacts.map((contact: Contact) =>
          contact.id === id
            ? {
                ...contact,
                favorite: !contact.favorite,
              }
            : contact,
        ),
      }));
    },
    recordContactUsage: (phone: string, name?: string) => {
      const normalized = phone.trim();
      if (!normalized) {
        return;
      }
      const now = new Date().toISOString();
      set((state: BankState) => {
        const current = state.contacts.find(
          (item: Contact) => item.phone === normalized,
        );
        if (!current) {
          const fallbackName = name?.trim() || normalized;
          const color = CONTACT_COLORS[Math.floor(Math.random() * CONTACT_COLORS.length)];
          const contact: Contact = {
            id: createId("contact"),
            name: fallbackName,
            phone: normalized,
            avatarColor: color,
            favorite: state.contacts.length < 3,
            lastUsedAt: now,
          };
          return {
            contacts: [contact, ...state.contacts],
          };
        }
        const updated: Contact = {
          ...current,
          name: name?.trim() || current.name,
          lastUsedAt: now,
        };
        return {
          contacts: [
            updated,
            ...state.contacts.filter((contact: Contact) => contact.id !== current.id),
          ],
        };
      });
    },
    login: ({
      id,
      phone,
      idType,
    }: {
      id: string;
      phone: string;
      idType?: string;
    }) => {
      if (!id.trim() || !phone.trim()) {
        return false;
      }
      set((state: BankState) => ({
        isAuthenticated: true,
        user: {
          ...state.user,
          id: id.trim(),
          phone: phone.trim(),
          idType: idType?.trim() || state.user.idType,
        },
      }));
      return true;
    },
    simulateBiometricValidation: async ({ latencyMs = 1200, expectedMatch = true } = {}) => {
      const attemptId = createId("biometric");
      const deviceName = "FaceGraph Sensor v2";
      const delay = Math.max(400, latencyMs + Math.floor(Math.random() * 240 - 120));
      const rawResult: BiometricAttemptResult = expectedMatch
        ? "success"
        : Math.random() > 0.5
        ? "mismatch"
        : "timeout";

      await new Promise((resolve) => setTimeout(resolve, delay));

      const timestamp = new Date().toISOString();
      set((state: BankState) => ({
        biometricAttempts: [
          {
            id: attemptId,
            label: expectedMatch ? "Reconocimiento facial" : "Huella digital",
            device: deviceName,
            result: rawResult,
            timestamp,
          },
          ...state.biometricAttempts,
        ].slice(0, 5),
        biometricLastSync: timestamp,
      }));

      if (rawResult === "success") {
        set({ biometricRegistered: true });
      }

      return { success: rawResult === "success", deviceName };
    },
    registerBiometrics: ({ displayName }) => {
      const timestamp = new Date().toISOString();
      set((state: BankState) => ({
        biometricRegistered: true,
        biometricLastSync: timestamp,
        biometricAttempts: [
          {
            id: createId("biometric"),
            label: `Registro en ${displayName}`,
            result: "success" as BiometricAttemptResult,
            timestamp,
            device: displayName,
          },
          ...state.biometricAttempts,
        ].slice(0, 5),
      }));
    },
    logout: () => {
      set((state: BankState) => ({
        isAuthenticated: false,
        balance: state.initialBalance,
        transfers: [],
        recharges: [],
        contacts: getDefaultContacts(),
        notifications: getDefaultNotifications(),
      }));
    },
    sendTransfer: (draft: TransferDraft) => {
      const amount = Number.isFinite(draft.amount) ? draft.amount : 0;
      if (amount <= 0) {
        throw new Error("El monto debe ser mayor a cero");
      }
      if (amount > get().balance) {
        throw new Error("Saldo insuficiente");
      }
      const record: TransferRecord = {
        id: createId("transfer"),
        contactName: draft.contactName.trim(),
        phone: draft.phone.trim(),
        amount,
        note: draft.note?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      const notification: NotificationItem = {
        id: createId("notification"),
        title: "Transferencia enviada",
        message: `Enviaste ${formatCurrency(amount)} a ${
          record.contactName || record.phone
        }`,
        timestamp: record.createdAt,
        read: false,
        category: "transfer",
      };

      set((state: BankState) => {
        const now = record.createdAt;
        const existing = state.contacts.find(
          (contact: Contact) => contact.phone === record.phone,
        );
        let contacts: Contact[];

        if (existing) {
          const updatedContact: Contact = {
            ...existing,
            name: record.contactName || existing.name,
            lastUsedAt: now,
          };
          contacts = [
            updatedContact,
            ...state.contacts.filter((contact: Contact) => contact.id !== existing.id),
          ];
        } else {
          const color = CONTACT_COLORS[Math.floor(Math.random() * CONTACT_COLORS.length)];
          const contact: Contact = {
            id: createId("contact"),
            name: record.contactName || record.phone,
            phone: record.phone,
            avatarColor: color,
            favorite: state.contacts.length < 3,
            lastUsedAt: now,
          };
          contacts = [contact, ...state.contacts];
        }

        return {
          balance: state.balance - amount,
          transfers: [record, ...state.transfers].slice(0, 20),
          contacts,
          notifications: [notification, ...state.notifications].slice(0, 30),
        };
      });

      return record;
    },
    makeRecharge: (draft: RechargeDraft) => {
      const amount = Number.isFinite(draft.amount) ? draft.amount : 0;
      if (amount <= 0) {
        throw new Error("El monto debe ser mayor a cero");
      }
      if (amount > get().balance) {
        throw new Error("Saldo insuficiente");
      }
      const record: RechargeRecord = {
        id: createId("recharge"),
        provider: draft.provider,
        phone: draft.phone.trim(),
        amount,
        createdAt: new Date().toISOString(),
      };
      const notification: NotificationItem = {
        id: createId("notification"),
        title: "Recarga realizada",
        message: `Recargaste ${formatCurrency(amount)} con ${record.provider}`,
        timestamp: record.createdAt,
        read: false,
        category: "recharge",
      };

      set((state: BankState) => ({
        balance: state.balance - amount,
        recharges: [record, ...state.recharges].slice(0, 20),
        notifications: [notification, ...state.notifications].slice(0, 30),
      }));

      return record;
    },
    addNotification: ({ title, message, category }: NotificationDraft) => {
      const notification: NotificationItem = {
        id: createId("notification"),
        title: title.trim(),
        message: message.trim(),
        timestamp: new Date().toISOString(),
        read: false,
        category: category ?? "general",
      };

      set((state: BankState) => ({
        notifications: [notification, ...state.notifications].slice(0, 30),
      }));

      return notification;
    },
    markNotificationRead: (id: string) => {
      set((state: BankState) => ({
        notifications: state.notifications.map((item: NotificationItem) =>
          item.id === id
            ? {
                ...item,
                read: true,
              }
            : item,
        ),
      }));
    },
    toggleNotificationRead: (id: string) => {
      set((state: BankState) => ({
        notifications: state.notifications.map((item: NotificationItem) =>
          item.id === id
            ? {
                ...item,
                read: !item.read,
              }
            : item,
        ),
      }));
    },
    markAllNotificationsRead: () => {
      set((state: BankState) => ({
        notifications: state.notifications.map((item: NotificationItem) => ({
          ...item,
          read: true,
        })),
      }));
    },
    clearNotifications: () => {
      set({ notifications: [] });
    },
  }),
);
