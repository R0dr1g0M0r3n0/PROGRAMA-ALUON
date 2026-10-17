import { normalizeCustomerTariffCode } from '../../../components/customer-modal/customerTariffOptions';

const STORAGE_KEY = 'aluon.budget-wizard.prefill.v1';
const ORDER_STORAGE_KEY = 'aluon.budget-wizard.order-prefill.v1';
const HISTORY_STATE_KEY = 'budgetWizardPrefillCustomer';

type PrefillState = {
  customerId: string;
  nombreComercial: string;
  razonSocial: string;
  email: string;
  telefono: string;
  tarifa: string;
  direccionesEntrega: Array<{
    id: string;
    nombreAlias: string;
    direccion: string;
    cp: string;
    poblacion: string;
    provincia: string;
    telefono: string;
    contacto: string;
  }>;
};

export type BudgetOrderPrefill = {
  productType: string;
  model: string;
  color: string;
  widthMm: number;
  heightMm: number;
  groundClearanceMm: number;
  useMode: string;
  electricStrike: boolean;
  automaticDoorPhone: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

const readStorageRaw = (): unknown => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

const readHistoryRaw = (): unknown => {
  if (typeof window === 'undefined') return null;
  const state = window.history.state;
  if (!isRecord(state)) return null;
  return state[HISTORY_STATE_KEY] ?? null;
};

const toPrefillState = (raw: unknown): PrefillState | null => {
  if (!isRecord(raw)) return null;
  const customerId = raw.customerId;
  if (typeof customerId !== 'string' || customerId.trim().length === 0) return null;

  const direccionesEntrega = isArray(raw.direccionesEntrega)
    ? raw.direccionesEntrega.flatMap(address => {
      if (!isRecord(address)) return [];
      const id = typeof address.id === 'string' ? address.id : '';
      if (!id) return [];

      return [{
        id,
        nombreAlias: typeof address.nombreAlias === 'string' ? address.nombreAlias : '',
        direccion: typeof address.direccion === 'string' ? address.direccion : '',
        cp: typeof address.cp === 'string' ? address.cp : '',
        poblacion: typeof address.poblacion === 'string' ? address.poblacion : '',
        provincia: typeof address.provincia === 'string' ? address.provincia : '',
        telefono: typeof address.telefono === 'string' ? address.telefono : '',
        contacto: typeof address.contacto === 'string' ? address.contacto : '',
      }];
    })
    : [];

  return {
    customerId,
    nombreComercial: typeof raw.nombreComercial === 'string' ? raw.nombreComercial : '',
    razonSocial: typeof raw.razonSocial === 'string' ? raw.razonSocial : '',
    email: typeof raw.email === 'string' ? raw.email : '',
    telefono: typeof raw.telefono === 'string' ? raw.telefono : '',
    tarifa: normalizeCustomerTariffCode(typeof raw.tarifa === 'string' ? raw.tarifa : ''),
    direccionesEntrega,
  };
};

export const buildBudgetWizardPrefillCustomer = (customer: {
  id?: string;
  nombreComercial?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  tarifa?: string;
  direccionesEntrega?: Array<{
    id?: string;
    nombreAlias?: string;
    direccion?: string;
    cp?: string;
    poblacion?: string;
    provincia?: string;
    telefono?: string;
    contacto?: string;
  }>;
}): PrefillState | null => {
  const customerId = customer.id?.trim() ?? '';
  if (!customerId) return null;

  return {
    customerId,
    nombreComercial: customer.nombreComercial?.trim() ?? '',
    razonSocial: customer.razonSocial?.trim() ?? '',
    email: customer.email?.trim() ?? '',
    telefono: customer.telefono?.trim() ?? '',
    tarifa: normalizeCustomerTariffCode(customer.tarifa),
    direccionesEntrega: (customer.direccionesEntrega ?? []).flatMap(address => {
      const id = address.id?.trim() ?? '';
      if (!id) return [];
      return [{
        id,
        nombreAlias: address.nombreAlias?.trim() ?? '',
        direccion: address.direccion?.trim() ?? '',
        cp: address.cp?.trim() ?? '',
        poblacion: address.poblacion?.trim() ?? '',
        provincia: address.provincia?.trim() ?? '',
        telefono: address.telefono?.trim() ?? '',
        contacto: address.contacto?.trim() ?? '',
      }];
    }),
  };
};

export const setBudgetWizardPrefillCustomerId = (customerId: string): void => {
  const next: PrefillState = {
    customerId,
    nombreComercial: '',
    razonSocial: '',
    email: '',
    telefono: '',
    tarifa: '',
    direccionesEntrega: [],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

export const setBudgetWizardPrefillCustomer = (customer: {
  id?: string;
  nombreComercial?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  tarifa?: string;
  direccionesEntrega?: Array<{
    id?: string;
    nombreAlias?: string;
    direccion?: string;
    cp?: string;
    poblacion?: string;
    provincia?: string;
    telefono?: string;
    contacto?: string;
  }>;
}): void => {
  const next = buildBudgetWizardPrefillCustomer(customer);
  if (!next) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

export const clearBudgetWizardPrefillCustomer = (): void => {
  if (typeof window !== 'undefined' && isRecord(window.history.state)) {
    const nextState = { ...window.history.state };
    delete nextState[HISTORY_STATE_KEY];
    window.history.replaceState(nextState, '', `${window.location.pathname}${window.location.hash}`);
  }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ORDER_STORAGE_KEY);
};

export const setBudgetWizardPrefillOrderConfiguration = (order: BudgetOrderPrefill): void => {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
};

export const readBudgetWizardPrefillOrderConfiguration = (): BudgetOrderPrefill | null => {
  const raw = localStorage.getItem(ORDER_STORAGE_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<BudgetOrderPrefill>;
    if (typeof value.productType !== 'string' || typeof value.model !== 'string') return null;
    return {
      productType: value.productType,
      model: value.model,
      color: typeof value.color === 'string' ? value.color : '',
      widthMm: Number(value.widthMm) || 0,
      heightMm: Number(value.heightMm) || 0,
      groundClearanceMm: Number(value.groundClearanceMm) || 0,
      useMode: typeof value.useMode === 'string' ? value.useMode : 'MANUAL',
      electricStrike: Boolean(value.electricStrike),
      automaticDoorPhone: Boolean(value.automaticDoorPhone),
    };
  } catch {
    return null;
  }
};

export const consumeBudgetWizardPrefillOrderConfiguration = (): BudgetOrderPrefill | null => {
  const value = readBudgetWizardPrefillOrderConfiguration();
  localStorage.removeItem(ORDER_STORAGE_KEY);
  return value;
};

export const readBudgetWizardPrefillCustomer = (): PrefillState | null => {
  const raw = readStorageRaw();
  return toPrefillState(raw);
};

export const peekBudgetWizardPrefillCustomer = (): PrefillState | null => {
  return toPrefillState(readHistoryRaw()) ?? toPrefillState(readStorageRaw());
};

export const consumeBudgetWizardPrefillCustomer = (): PrefillState | null => {
  const prefill = readBudgetWizardPrefillCustomer();
  if (!prefill) return null;
  localStorage.removeItem(STORAGE_KEY);
  return prefill;
};
