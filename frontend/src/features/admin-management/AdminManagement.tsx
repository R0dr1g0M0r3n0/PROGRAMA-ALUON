import { useState } from 'react';
import { AdminUsersPanel } from './AdminUsersPanel';
import { ProductCatalogManagement } from './ProductCatalogManagement';
import { CatalogRulesManagement } from './CatalogRulesManagement';
import { CatalogOptionsManagement } from './CatalogOptionsManagement';
import SocialMediaManagement from './SocialMediaManagement';
import { DistributorsManagement } from './DistributorsManagement';
import { OrdersManagement } from './OrdersManagement';
import type { AdminManagementTab } from './AdminManagement.types';

const tabs: Array<{ id: AdminManagementTab; label: string; description: string }> = [
  { id: 'USERS', label: 'Usuarios', description: 'Alta, edición y eliminación de empleados.' },
  { id: 'PRODUCT_FAMILIES', label: 'Familias de producto', description: 'Catálogo visual para presupuestos.' },
  { id: 'CATALOG_RULES', label: 'Reglas y tarifas', description: 'Límites, compatibilidades y precios configurables.' },
  { id: 'CATALOG_OPTIONS', label: 'Opciones de catálogo', description: 'Colores, acabados, herrajes y condiciones comerciales.' },
  { id: 'DISTRIBUTORS', label: 'Distribuidores', description: 'Datos, estado y usuarios asociados.' },
  { id: 'ORDERS', label: 'Pedidos', description: 'Revisión, estados, duplicado y exportación.' },
  { id: 'SOCIAL_MEDIA', label: 'RRSS', description: 'Publicaciones internas y configuración por red.' },
];

const AdminManagement = () => {
  const [activeTab, setActiveTab] = useState<AdminManagementTab>('USERS');

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-brand" />
            <h1 className="text-xl font-black uppercase tracking-tight" style={{ color: '#0d1117' }}>
              Sistema · Administración
            </h1>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide ml-3.5 mt-0.5" style={{ color: '#9ca3af' }}>
            Usuarios, catálogo y publicaciones RRSS
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="rounded-2xl px-4 py-3 text-left min-w-[220px] transition-all duration-200"
              style={{
                border: active ? '1px solid #2563eb' : '1px solid #e5e7eb',
                background: active ? 'rgba(37,99,235,0.08)' : '#ffffff',
              }}
            >
              <div className="text-xs font-black uppercase tracking-wider" style={{ color: active ? '#1d4ed8' : '#111827' }}>
                {tab.label}
              </div>
              <div className="text-[11px] mt-1" style={{ color: '#6b7280' }}>
                {tab.description}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'USERS' ? <AdminUsersPanel /> : activeTab === 'PRODUCT_FAMILIES' ? <ProductCatalogManagement /> : activeTab === 'CATALOG_OPTIONS' ? <CatalogOptionsManagement /> : activeTab === 'CATALOG_RULES' ? <CatalogRulesManagement /> : activeTab === 'DISTRIBUTORS' ? <DistributorsManagement /> : activeTab === 'ORDERS' ? <OrdersManagement /> : <SocialMediaManagement />}
      </div>
    </div>
  );
};

export default AdminManagement;
