import type { CatalogOption, CatalogOptionForm } from './AdminManagement.types';
import { staffAuthHeaders } from '../../services/staffAuthApi';

const readError = async (response: Response) => (await response.text().catch(() => '')) || 'Error inesperado';

export const listCatalogOptions = async (): Promise<CatalogOption[]> => {
  const response = await fetch('/api/admin/catalog/options', { headers: staffAuthHeaders() });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<CatalogOption[]>;
};

const save = async (url: string, method: string, form: CatalogOptionForm): Promise<CatalogOption> => {
  const response = await fetch(url, { method, headers: staffAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(form) });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<CatalogOption>;
};

export const createCatalogOption = (form: CatalogOptionForm) => save('/api/admin/catalog/options', 'POST', form);
export const updateCatalogOption = (id: string, form: CatalogOptionForm) => save(`/api/admin/catalog/options/${encodeURIComponent(id)}`, 'PUT', form);
export const deleteCatalogOption = async (id: string) => {
  const response = await fetch(`/api/admin/catalog/options/${encodeURIComponent(id)}`, { method: 'DELETE', headers: staffAuthHeaders() });
  if (!response.ok) throw new Error(await readError(response));
};
