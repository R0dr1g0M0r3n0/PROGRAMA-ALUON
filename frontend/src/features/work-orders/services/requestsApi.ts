import type { WorkOrderRequest } from '../models';
import { staffAuthHeaders } from '../../../services/staffAuthApi';

type OrderStatusApi = {
  id: string;
  customerId?: string | null;
  codigoOrden: string;
  parentOrderId?: string | null;
  revision?: number | null;
  estado: string;
  workflowStep: string;
  workflowStage?: string;
  assignedUserId?: number | null;
  assignedUserName?: string | null;
  customerName: string;
  modeloPuerta?: string | null;
  anchoMm?: number | null;
  altoMm?: number | null;
  notes?: string | null;
  color?: string | null;
  installerName?: string | null;
  requestDate?: string | null;
  m2?: number | null;
};

type WorkOrderCreateResponseApi = {
  id: string;
  codigoOrden: string;
};

type WorkOrderCreatePayload = {
  customerId?: string;
  customerName: string;
  modeloPuerta: string;
  anchoMm: number;
  altoMm: number;
  reference: string;
  notes: string;
  color?: string;
  installerName?: string;
};

const resolveModelId = (modeloPuerta?: string | null) => {
  const text = (modeloPuerta ?? '').toLowerCase();
  if (text.includes('classic')) return 'CLASSIC';
  if (text.includes('premium')) return 'PREMIUM';
  if (text.includes('inox')) return 'INOX';
  if (text.includes('veneciana')) return 'VENECIANA';
  if (text.includes('pro')) return 'PREMIUM';
  if (text.includes('lux')) return 'PREMIUM';
  return 'CLASSIC';
};

const resolveRequestDate = (value?: string | null) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.slice(0, 10);
};

const buildNotesPayload = (reference: string, notes: string): string => {
  const cleanReference = reference.trim();
  const cleanNotes = notes.trim();
  if (!cleanReference && !cleanNotes) return '';
  if (!cleanReference) return cleanNotes;
  if (!cleanNotes) return `REF:${cleanReference}`;
  return `REF:${cleanReference}\n${cleanNotes}`;
};

const splitReferenceFromNotes = (notes: string, fallbackReference: string): { reference: string; notes: string } => {
  const raw = notes.trim();
  if (!raw) return { reference: fallbackReference, notes: '' };
  const [firstLine, ...rest] = raw.split('\n');
  const match = /^REF:(.+)$/.exec(firstLine.trim());
  if (!match) return { reference: fallbackReference, notes: raw };
  const parsedReference = match[1].trim();
  const remainingNotes = rest.join('\n').trim();
  return {
    reference: parsedReference || fallbackReference,
    notes: remainingNotes,
  };
};

export const fetchWorkOrderRequests = async (): Promise<WorkOrderRequest[]> => {
  const response = await fetch('/api/orders/status');
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'No se pudo cargar la bandeja.');
  }

  const data = (await response.json()) as OrderStatusApi[];
  const mapped = data.map(item => {
    const fallbackReference = item.codigoOrden || item.id;
    const notesSplit = splitReferenceFromNotes(item.notes ?? '', fallbackReference);
    return ({
      id: item.codigoOrden || item.id,
      orderId: item.id,
      customerId: item.customerId ?? undefined,
      customerName: item.customerName,
      modelId: resolveModelId(item.modeloPuerta),
      modelLabel: item.modeloPuerta ?? '—',
      m2: item.m2 ?? 0,
      widthMm: item.anchoMm ?? undefined,
      heightMm: item.altoMm ?? undefined,
      color: item.color ?? undefined,
      installerName: item.installerName ?? undefined,
      reference: notesSplit.reference,
      googleView: false,
      notes: notesSplit.notes,
      requestDate: resolveRequestDate(item.requestDate),
      workflowStep: (item.workflowStage as WorkOrderRequest['workflowStep'])
        ?? (item.workflowStep as WorkOrderRequest['workflowStep'])
        ?? 'INBOX',
      assignedUserId: item.assignedUserId ?? undefined,
      assignedUserName: item.assignedUserName ?? undefined,
    });
  });
  console.info('[work-orders] Loaded requests', mapped.length, mapped.map(item => ({
    id: item.id,
    orderId: item.orderId,
    workflowStep: item.workflowStep,
  })));
  return mapped;
};

export const createWorkOrderRequest = async (payload: WorkOrderCreatePayload): Promise<WorkOrderCreateResponseApi> => {
  const form = new FormData();
  if (payload.customerId) {
    form.set('customerId', payload.customerId);
  }
  form.set('customerName', payload.customerName);
  form.set('modeloPuerta', payload.modeloPuerta);
  form.set('anchoMm', String(payload.anchoMm));
  form.set('altoMm', String(payload.altoMm));
  form.set('notes', buildNotesPayload(payload.reference, payload.notes));
  if (payload.color) {
    form.set('color', payload.color);
  }
  if (payload.installerName) {
    form.set('installerName', payload.installerName);
  }

  const response = await fetch('/api/orders/requests', {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'No se pudo crear la solicitud.');
  }
  return (await response.json()) as WorkOrderCreateResponseApi;
};

export const deleteWorkOrderRequest = async (orderId: string): Promise<void> => {
  const response = await fetch(`/api/orders/requests/${orderId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'No se pudo eliminar la solicitud.');
  }
};

export const duplicateWorkOrder = async (orderId: string): Promise<{ id: string; codigoOrden: string; revision: number }> => {
  const response = await fetch(`/api/orders/${orderId}/duplicate`, {
    method: 'POST',
    headers: staffAuthHeaders(),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'No se pudo duplicar la orden.');
  }
  return (await response.json()) as { id: string; codigoOrden: string; revision: number };
};

export const updateWorkOrderWorkflowStep = async (
  requestId: string,
  workflowStep: string,
  authorizerUserId?: string,
): Promise<void> => {
  console.info('[work-orders] Persist workflow step', { requestId, workflowStep, authorizerUserId });
  const response = await fetch(`/api/orders/requests/${requestId}/workflow-step`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflowStep, authorizerUserId }),
  });
  if (!response.ok) {
    const message = await response.text();
    console.error('[work-orders] Persist failed', { requestId, workflowStep, status: response.status, message });
    throw new Error(message || 'No se pudo actualizar el estado.');
  }
  console.info('[work-orders] Persist ok', { requestId, workflowStep });
};

export const assignWorkOrderUser = async (
  orderId: string,
  userId: number,
): Promise<void> => {
  const response = await fetch(`/api/orders/${orderId}/assigned-user`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'No se pudo asignar el usuario.');
  }
};

export const assignWorkOrderCustomer = async (
  orderId: string,
  customerId: string,
): Promise<void> => {
  const response = await fetch(`/api/orders/${orderId}/customer`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'No se pudo asignar el cliente.');
  }
};
