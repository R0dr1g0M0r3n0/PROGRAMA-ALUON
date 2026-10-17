import { navigateToModule } from '../../../services/moduleNavigation';
import {
  buildBudgetWizardPrefillCustomer,
  clearBudgetWizardPrefillCustomer,
  setBudgetWizardPrefillCustomer,
  setBudgetWizardPrefillOrderConfiguration,
} from './budgetWizardPrefill';

const LAUNCH_EVENT_NAME = 'aluon:budget-wizard-launch';

type BudgetWizardLaunchMode = 'MODELO' | 'CLIENTE';

type BudgetWizardLaunchDetail = {
  mode: BudgetWizardLaunchMode;
};

const isHistoryStateRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const emitBudgetWizardLaunch = (mode: BudgetWizardLaunchMode): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<BudgetWizardLaunchDetail>(LAUNCH_EVENT_NAME, { detail: { mode } }));
};

export const onBudgetWizardLaunch = (handler: (mode: BudgetWizardLaunchMode) => void): (() => void) => {
  const listener = (event: Event) => {
    if (!(event instanceof CustomEvent)) return;
    const detailUnknown: unknown = event.detail;
    if (typeof detailUnknown !== 'object' || detailUnknown === null || Array.isArray(detailUnknown)) return;
    const mode = (detailUnknown as Record<string, unknown>).mode;
    if (mode !== 'MODELO' && mode !== 'CLIENTE') return;
    handler(mode);
  };

  window.addEventListener(LAUNCH_EVENT_NAME, listener);
  return () => window.removeEventListener(LAUNCH_EVENT_NAME, listener);
};

const setWizardStepInHistory = (step: 'MODELO' | 'CLIENTE'): void => {
  if (typeof window === 'undefined') return;
  const currentState = isHistoryStateRecord(window.history.state) ? window.history.state : {};
  window.history.replaceState(
    {
      ...currentState,
      budgetWizardStep: step,
    },
    '',
    `${window.location.pathname}${window.location.hash}`,
  );
};

export const startBudgetWizard = (): void => {
  clearBudgetWizardPrefillCustomer();
  setWizardStepInHistory('MODELO');
  emitBudgetWizardLaunch('MODELO');
  navigateToModule('presupuestos');
};

export const openBudgetWizardForCustomer = (customer: {
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
}, orderConfiguration?: Parameters<typeof setBudgetWizardPrefillOrderConfiguration>[0]): void => {
  const prefill = buildBudgetWizardPrefillCustomer(customer);
  if (!prefill) return;

  setBudgetWizardPrefillCustomer(customer);
  if (orderConfiguration) setBudgetWizardPrefillOrderConfiguration(orderConfiguration);

  if (typeof window !== 'undefined') {
    const currentState = isHistoryStateRecord(window.history.state) ? window.history.state : {};
    window.history.replaceState(
      {
        ...currentState,
        budgetWizardStep: 'MODELO',
        budgetWizardPrefillCustomer: prefill,
      },
      '',
      `${window.location.pathname}${window.location.hash}`,
    );
  }
  emitBudgetWizardLaunch('MODELO');
  navigateToModule('presupuestos');
};
