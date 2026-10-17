import type { DoorType } from '../customer-onboarding/models';
import type { ProductCategory } from '../budget-wizard/BudgetWizard.types';

export type AdminManagementTab = 'USERS' | 'PRODUCT_FAMILIES' | 'CATALOG_OPTIONS' | 'CATALOG_RULES' | 'DISTRIBUTORS' | 'ORDERS' | 'SOCIAL_MEDIA';

export type CatalogOption = {
  id: string;
  kind: string;
  code: string;
  label: string;
  description?: string | null;
  imageUrl?: string | null;
  metadata?: string | null;
  sortOrder: number;
  active: boolean;
};

export type CatalogOptionForm = Omit<CatalogOption, 'id'>;

export type AdminDistributor = { id: string; code: string; name: string; legalName?: string | null; email?: string | null; phone?: string | null; address?: string | null; sortOrder: number; active: boolean; userIds: number[]; updatedAt?: string };
export type AdminDistributorForm = Omit<AdminDistributor, 'id' | 'updatedAt' | 'userIds'> & { userIds: number[] };
export type AdminOrderConfiguration = { id: string; reference: string; productType: string; status: string; version: number; customerName?: string | null; distributorName?: string | null; model?: string | null; color?: string | null; finish?: string | null; updatedAt: string; createdAt: string };

export type CatalogRule = {
  id: string;
  productType: string;
  technicalModel: string | null;
  ruleKey: string;
  ruleValue: unknown;
  description: string | null;
  active: boolean;
  provisional: boolean;
  updatedAt: string;
};

export type CatalogRuleForm = {
  productType: string;
  technicalModel: string;
  ruleKey: string;
  ruleValue: string;
  description: string;
  active: boolean;
  provisional: boolean;
};

export type ProductCatalogChild = {
  id: string;
  familyId: string;
  productCategory: ProductCategory;
  doorType: DoorType;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
};

export type ProductCatalogFamily = {
  id: string;
  technicalModel: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  children: ProductCatalogChild[];
};

export type ProductCatalogFamilyForm = {
  technicalModel: string;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
};

export type ProductCatalogChildForm = {
  familyId: string;
  productCategory: ProductCategory;
  doorType: DoorType;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
};
