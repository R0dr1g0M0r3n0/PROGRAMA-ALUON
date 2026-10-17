export type ConfigCatalogRule = {
  id: string;
  productType: string;
  technicalModel: string | null;
  ruleKey: string;
  ruleValue: Record<string, unknown>;
  description: string | null;
  active: boolean;
};

export type ConfigCatalogValidation = { valid: boolean; errors: string[]; warnings: string[]; matrixRuleId: string | null };

export const listConfigCatalogRules = async (productType: string): Promise<ConfigCatalogRule[]> => {
  const response = await fetch(`/api/catalog/rules?productType=${encodeURIComponent(productType)}`);
  if (!response.ok) throw new Error('No se pudieron cargar las reglas del catálogo.');
  return response.json() as Promise<ConfigCatalogRule[]>;
};

export const validateConfigCatalog = async (productType: string, configuration: unknown): Promise<ConfigCatalogValidation> => {
  const response = await fetch('/api/catalog/rules/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType, configuration }),
  });
  if (!response.ok) throw new Error('No se pudo validar la matriz de reglas del configurador.');
  return response.json() as Promise<ConfigCatalogValidation>;
};

export type ConfigCatalogOption = { id: string; kind: string; code: string; label: string; sortOrder: number; active: boolean };

export const listConfigCatalogOptions = async (kind: string): Promise<ConfigCatalogOption[]> => {
  const response = await fetch(`/api/catalog/options?kind=${encodeURIComponent(kind)}`);
  if (!response.ok) throw new Error('No se pudieron cargar las opciones del catálogo.');
  return response.json() as Promise<ConfigCatalogOption[]>;
};
