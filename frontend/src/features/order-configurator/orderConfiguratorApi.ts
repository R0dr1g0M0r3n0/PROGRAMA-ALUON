export type SavedOrderConfiguration = {
  id: string;
  customerId?: string;
  customerName?: string;
  reference: string;
  productType: string;
  status: string;
  version: number;
  payload?: unknown;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
};

export type OrderConfigurationAudit = {
  id: string;
  configurationId: string;
  version: number;
  action: string;
  status: string;
  changedBy: string;
  snapshot: unknown;
  createdAt: string;
};

export const saveOrderConfiguration = async (payload: {
  customerId?: string;
  customerName: string;
  reference: string;
  productType: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'CONFIRMED' | 'IN_PRODUCTION' | 'FINALIZED' | 'CANCELLED';
  payload: unknown;
}): Promise<SavedOrderConfiguration> => {
  const response = await fetch('/api/order-configurations', {
    method: 'POST',
    headers: staffAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'No se pudo guardar la configuración.');
  }
  return response.json() as Promise<SavedOrderConfiguration>;
};

export const updateOrderConfiguration = async (id: string, payload: Parameters<typeof saveOrderConfiguration>[0]): Promise<SavedOrderConfiguration> => {
  const response = await fetch(`/api/order-configurations/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: staffAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'No se pudo actualizar la configuración.');
  }
  return response.json() as Promise<SavedOrderConfiguration>;
};

export const listOrderConfigurations = async (status?: string): Promise<SavedOrderConfiguration[]> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(`/api/order-configurations${query}`, { headers: staffAuthHeaders() });
  if (!response.ok) throw new Error('No se pudieron cargar los borradores.');
  return response.json() as Promise<SavedOrderConfiguration[]>;
};

export const getOrderConfiguration = async (id: string): Promise<SavedOrderConfiguration> => {
  const response = await fetch(`/api/order-configurations/${encodeURIComponent(id)}`, { headers: staffAuthHeaders() });
  if (!response.ok) throw new Error('No se pudo recuperar la configuración.');
  return response.json() as Promise<SavedOrderConfiguration>;
};

export const getOrderConfigurationHistory = async (id: string): Promise<OrderConfigurationAudit[]> => {
  const response = await fetch(`/api/order-configurations/${encodeURIComponent(id)}/history`, { headers: staffAuthHeaders() });
  if (!response.ok) throw new Error('No se pudo cargar el historial.');
  return response.json() as Promise<OrderConfigurationAudit[]>;
};
import { staffAuthHeaders } from '../../services/staffAuthApi';

