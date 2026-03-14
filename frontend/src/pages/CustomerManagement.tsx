import React, { useState } from 'react';
import { useCustomers, Customer } from '../hooks/useCustomers';
import CustomerModal from '../components/CustomerModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Genera un color de avatar determinístico a partir del texto */
const avatarColor = (name: string): string => {
  const colors = [
    '#3b82f6','#8b5cf6','#ec4899','#f59e0b',
    '#10b981','#6366f1','#ef4444','#14b8a6',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % colors.length;
  return colors[h];
};

/** Obtiene las iniciales de un nombre */
const initials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Micro components ─────────────────────────────────────────────────────────

/** Avatar circular con iniciales */
const Avatar = ({ name }: { name: string }) => {
  const bg = avatarColor(name || 'X');
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
      style={{ background: bg, fontSize: 9, fontWeight: 700 }}
    >
      {initials(name || '?')}
    </div>
  );
};

/** Badge de tarifa con color */
const TarifaBadge = ({ value }: { value: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    'A':       { bg: '#fef3c7', color: '#92400e' },
    'B':       { bg: '#dbeafe', color: '#1e40af' },
    'C':       { bg: '#f3f4f6', color: '#374151' },
    'VIP':     { bg: '#fae8ff', color: '#7c3aed' },
    'PREMIUM': { bg: '#fdf4ff', color: '#9333ea' },
    'GENERAL': { bg: '#f0fdf4', color: '#15803d' },
  };
  const upper = (value || '').toUpperCase();
  const style = map[upper] ?? { bg: '#f3f4f6', color: '#6b7280' };
  if (!upper) return <span style={{ color: '#d1d5db' }}>—</span>;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
      style={{ background: style.bg, color: style.color, fontSize: 10 }}
    >
      {upper}
    </span>
  );
};

/** Badge de forma de pago */
const PagoBadge = ({ value }: { value: string }) => {
  if (!value) return <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
      style={{ background: '#f1f5f9', color: '#64748b', fontSize: 10, fontWeight: 600 }}
    >
      {value}
    </span>
  );
};

// ─── Column header ────────────────────────────────────────────────────────────
const TH = ({ label, right }: { label: string; right?: boolean }) => (
  <th
    className={`px-3 py-2 whitespace-nowrap select-none cursor-pointer group ${right ? 'text-right' : ''}`}
    style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}
  >
    <span className="flex items-center gap-1 group-hover:text-gray-900 transition-colors" style={{ justifyContent: right ? 'flex-end' : 'flex-start' }}>
      {label}
      <svg className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 12V4m0 16l-4-4m4 4l4-4" />
      </svg>
    </span>
  </th>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonRows = () => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
        {[24, 140, 80, 100, 60, 70, 80, 90, 120, 60].map((w, j) => (
          <td key={j} className="px-3 py-2.5">
            <div className="h-2.5 rounded-full animate-pulse" style={{ width: w, backgroundColor: '#f3f4f6' }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <tr>
    <td colSpan={10}>
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9ca3af' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-bold text-sm" style={{ color: '#374151' }}>No hay clientes</p>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Añade tu primer cliente para empezar.</p>
        </div>
        <button onClick={onAdd} className="btn-primary text-sm px-4 py-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Añadir cliente
        </button>
      </div>
    </td>
  </tr>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const CustomerManagement: React.FC = () => {
  const { customers, loading, saveCustomer, deleteCustomer } = useCustomers();
  const [isModalOpen,      setIsModalOpen]      = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [selected,         setSelected]         = useState<Set<string>>(new Set());

  const handleEdit   = (c: Customer) => { setSelectedCustomer(c);         setIsModalOpen(true); };
  const handleCreate = ()            => { setSelectedCustomer(undefined); setIsModalOpen(true); };

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === customers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(customers.map(c => c.id ?? '')));
    }
  };

  const allSelected = customers.length > 0 && selected.size === customers.length;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 128px)', minHeight: 400 }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-brand" />
            <h1 className="text-xl font-black uppercase tracking-tight" style={{ color: '#0d1117' }}>
              Gestión de Clientes
            </h1>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide ml-3.5 mt-0.5" style={{ color: '#9ca3af' }}>
            GUM · CRM
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}
            >
              {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
              <button
                onClick={() => setSelected(new Set())}
                className="ml-1 opacity-60 hover:opacity-100"
              >✕</button>
            </div>
          )}
          {/* Search */}
          <div className="relative hidden md:block">
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9ca3af' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              placeholder="Buscar cliente..."
              className="pl-9 pr-4 py-2 rounded-xl text-sm border"
              style={{ border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', background: '#fff', width: 220 }}
            />
          </div>
          <button id="btn-nuevo-cliente" onClick={handleCreate} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo cliente
          </button>
        </div>
      </div>

      {/* ── Table container ── */}
      <div
        className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-0"
        style={{ border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
      >
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse" style={{ fontSize: 12 }}>

            {/* Head */}
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                {/* Checkbox */}
                <th className="px-3 py-2" style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', width: 36 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded cursor-pointer"
                    style={{ accentColor: '#e5534b', width: 14, height: 14 }}
                  />
                </th>
                <TH label="Nombre" />
                <TH label="Razón Social" />
                <TH label="Contacto" />
                <TH label="Tarifa" />
                <TH label="Forma Pago" />
                <TH label="Población" />
                <TH label="Teléfono" />
                <TH label="Email" />
                <th style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', width: 60 }} />
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {loading
                ? <SkeletonRows />
                : customers.length === 0
                  ? <EmptyState onAdd={handleCreate} />
                  : customers.map((c, idx) => {
                    const id       = c.id ?? idx.toString();
                    const isChecked = selected.has(id);

                    return (
                      <tr
                        key={id}
                        className="group transition-colors duration-100"
                        style={{
                          borderBottom: '1px solid #f3f4f6',
                          background: isChecked ? '#fff7f7' : 'transparent',
                          cursor: 'default',
                        }}
                        onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = '#f9fafb'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isChecked ? '#fff7f7' : 'transparent'; }}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRow(id)}
                            className="rounded cursor-pointer"
                            style={{ accentColor: '#e5534b', width: 14, height: 14 }}
                          />
                        </td>

                        {/* Nombre comercial — con barra de acento izquierda si está seleccionado */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {isChecked && (
                              <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background: '#e5534b' }} />
                            )}
                            <span
                              className="font-semibold hover:text-brand cursor-pointer transition-colors"
                              style={{ color: '#111827' }}
                              onClick={() => handleEdit(c)}
                            >
                              {c.nombreComercial || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Razón social */}
                        <td className="px-3 py-2.5" style={{ color: '#6b7280' }}>
                          {c.razonSocial || '—'}
                        </td>

                        {/* Contacto con avatar */}
                        <td className="px-3 py-2.5">
                          {c.personaContacto ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar name={c.personaContacto} />
                              <span style={{ color: '#374151' }}>{c.personaContacto}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#d1d5db' }}>—</span>
                          )}
                        </td>

                        {/* Tarifa */}
                        <td className="px-3 py-2.5">
                          <TarifaBadge value={c.tarifa} />
                        </td>

                        {/* Forma de pago */}
                        <td className="px-3 py-2.5">
                          <PagoBadge value={c.formaPago} />
                        </td>

                        {/* Población */}
                        <td className="px-3 py-2.5" style={{ color: '#6b7280' }}>
                          {c.poblacion
                            ? <span>{c.poblacion}{c.provincia ? `, ${c.provincia}` : ''}</span>
                            : <span style={{ color: '#d1d5db' }}>—</span>
                          }
                        </td>

                        {/* Teléfono */}
                        <td className="px-3 py-2.5" style={{ color: '#6b7280' }}>
                          {c.telefono || <span style={{ color: '#d1d5db' }}>—</span>}
                        </td>

                        {/* Email */}
                        <td className="px-3 py-2.5" style={{ color: '#6b7280', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.email
                            ? <a href={`mailto:${c.email}`} className="hover:text-brand transition-colors" style={{ color: '#6b7280' }}>{c.email}</a>
                            : <span style={{ color: '#d1d5db' }}>—</span>
                          }
                        </td>

                        {/* Actions */}
                        <td className="px-2 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => handleEdit(c)}
                              title="Editar"
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer"
                              style={{ color: '#9ca3af' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#e5534b'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => c.id && deleteCustomer(c.id)}
                              title="Eliminar"
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer"
                              style={{ color: '#9ca3af' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* ── Footer bar ── */}
        <div
          className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}
        >
          <div className="flex items-center gap-4 text-xs" style={{ color: '#6b7280' }}>
            <span>
              <strong style={{ color: '#111827' }}>{customers.length}</strong> clientes
            </span>
            {selected.size > 0 && (
              <span style={{ color: '#e5534b', fontWeight: 700 }}>
                {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#6b7280' }}>
            <span>Por página:</span>
            <select
              className="rounded px-2 py-1 text-xs border"
              style={{ border: '1px solid #e5e7eb', outline: 'none', background: '#fff', fontSize: 11 }}
            >
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <div className="flex items-center gap-0.5 ml-2">
              <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white border border-transparent hover:border-gray-200 transition-all" style={{ color: '#9ca3af' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: '#e5534b', color: '#fff', minWidth: 24, textAlign: 'center' }}>1</span>
              <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white border border-transparent hover:border-gray-200 transition-all" style={{ color: '#9ca3af' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setIsModalOpen(false)}
          onSave={saveCustomer}
        />
      )}
    </div>
  );
};

export default CustomerManagement;
