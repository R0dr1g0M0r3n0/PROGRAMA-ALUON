import type { CatalogRule, CatalogRuleForm } from './AdminManagement.types';
import { staffAuthHeaders } from '../../services/staffAuthApi';

const readError = async (response: Response) => (await response.text().catch(() => '')) || 'Error inesperado';

export const listCatalogRules = async (): Promise<CatalogRule[]> => {
  const response = await fetch('/api/admin/catalog/rules', { headers: staffAuthHeaders() });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<CatalogRule[]>;
};

const toPayload = (form: CatalogRuleForm) => ({
  productType: form.productType,
  technicalModel: form.technicalModel || null,
  ruleKey: form.ruleKey,
  ruleValue: JSON.parse(form.ruleValue),
  description: form.description || null,
  active: form.active,
  provisional: form.provisional,
});

export const createCatalogRule = async (form: CatalogRuleForm): Promise<CatalogRule> => {
  const response = await fetch('/api/admin/catalog/rules', { method: 'POST', headers: staffAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(toPayload(form)) });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<CatalogRule>;
};

export const updateCatalogRule = async (id: string, form: CatalogRuleForm): Promise<CatalogRule> => {
  const response = await fetch(`/api/admin/catalog/rules/${encodeURIComponent(id)}`, { method: 'PUT', headers: staffAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(toPayload(form)) });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<CatalogRule>;
};

export const deleteCatalogRule = async (id: string): Promise<void> => {
  const response = await fetch(`/api/admin/catalog/rules/${encodeURIComponent(id)}`, { method: 'DELETE', headers: staffAuthHeaders() });
  if (!response.ok) throw new Error(await readError(response));
};
