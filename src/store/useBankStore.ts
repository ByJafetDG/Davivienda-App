import { create } from "zustand";

import { createId } from "@/utils/id";

export type Contact = {
  id: string;
  name: string;
  phone: string;
  avatarColor: string;
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
  contacts: Contact[];
  transfers: TransferRecord[];
  recharges: RechargeRecord[];
  login: (payload: { id: string; phone: string; idType?: string }) => boolean;
  logout: () => void;
  sendTransfer: (draft: TransferDraft) => TransferRecord;
  makeRecharge: (draft: RechargeDraft) => RechargeRecord;
};

const STARTING_BALANCE = 509_015.4;
const DEFAULT_USER: UserProfile = {
  name: "María Rodríguez",
  id: "1-1234-5678",
  phone: "6203-4545",
  avatarColor: "#FF3358",
  idType: "Cédula de identidad",
};

const DEFAULT_CONTACTS: Contact[] = [
  {
    id: createId("contact"),
    name: "Juan Perez Rojas",
    phone: "6203-4545",
    avatarColor: "#00F0FF",
  },
  {
    id: createId("contact"),
    name: "Laura Hernández",
    phone: "7102-9090",
    avatarColor: "#FF8A65",
  },
  {
    id: createId("contact"),
    name: "Carlos Jiménez",
    phone: "8803-1212",
    avatarColor: "#8F9BFF",
  },
];

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
    contacts: DEFAULT_CONTACTS,
    transfers: [],
    recharges: [],
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
    logout: () => {
      set((state: BankState) => ({
        isAuthenticated: false,
        balance: state.initialBalance,
        transfers: [],
        recharges: [],
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

      set((state: BankState) => {
        const hasContact = state.contacts.some(
          (contact: Contact) => contact.phone === record.phone,
        );
        return {
          balance: state.balance - amount,
          transfers: [record, ...state.transfers].slice(0, 20),
          contacts: hasContact
            ? state.contacts
            : [
                {
                  id: createId("contact"),
                  name: record.contactName || record.phone,
                  phone: record.phone,
                  avatarColor: "#4C6BFF",
                },
                ...state.contacts,
              ],
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

      set((state: BankState) => ({
        balance: state.balance - amount,
        recharges: [record, ...state.recharges].slice(0, 20),
      }));

      return record;
    },
  }),
);
