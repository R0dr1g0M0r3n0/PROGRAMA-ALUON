import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCustomers, Customer } from '../../hooks/useCustomers';
import CustomerModal from '../../components/CustomerModal';
import ConfirmDialog from '../../components/feedback/ConfirmDialog';
import ErrorDialog from '../../components/feedback/ErrorDialog';
import CustomerManagementEmptyState from './CustomerManagementEmptyState';
import { openBudgetWizardForCustomer } from '../budget-wizard/services/budgetWizardLaunch';
import { Customer360Modal } from '../customer-360/Customer360Modal';
import { CustomerTariffBadge } from './CustomerTariffBadge';

/** Genera un color de avatar determinístico a partir del texto */
const avatarColor = (name: string): string => {
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#6366f1', '#ef4444', '#14b8a6',
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

// ─── Main page ────────────────────────────────────────────────────────────────
const CustomerManagement: React.FC = () => {
  const { customers, loading, saveCustomer, deleteCustomer } = useCustomers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
  const [deleteError, setDeleteError] = useState<{ title: string; description: string; detail?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [visionCustomer, setVisionCustomer] = useState<Customer | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const visibleCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return customers;
    }

    return customers.filter(customer => {
      const fields = [
        customer.nombreComercial,
        customer.razonSocial,
        customer.personaContacto,
        customer.tarifa,
        customer.formaPago,
        customer.poblacion,
        customer.provincia,
        customer.telefono,
        customer.email,
        customer.numeroDocumento,
        customer.cp,
      ];

      return fields.some(value => value?.toLowerCase().includes(term));
    });
  }, [customers, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(visibleCustomers.length / pageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return visibleCustomers.slice(start, start + pageSize);
  }, [page, pageSize, visibleCustomers]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);

  useEffect(() => {
    setPage(current => Math.min(current, totalPages));
  }, [totalPages]);

  const handleEdit = (c: Customer) => { setSelectedCustomer(c); setIsModalOpen(true); };
  const handleCreate = () => { setSelectedCustomer(undefined); setIsModalOpen(true); };
  const handleOpenBudget = (customer: Customer) => {
    if (!customer.id) return;
    setIsModalOpen(false);
    openBudgetWizardForCustomer(customer);
  };
  const handleOpenVision360 = (customer: Customer) => {
    if (!customer.id) return;
    setIsModalOpen(false);
    setVisionCustomer(customer);
  };

  const handleAskDelete = useCallback((customer: Customer) => {
    setConfirmDelete(customer);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete?.id) {
      setConfirmDelete(null);
      return;
    }
    setIsDeleting(true);
    try {
      await deleteCustomer(confirmDelete.id);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'No se pudo eliminar el cliente.';
      const name = confirmDelete.nombreComercial || confirmDelete.razonSocial || 'este cliente';
      setDeleteError({
        title: 'No pudimos eliminar al cliente',
        description: `Eliminación cancelada para ${name}. Revisa que no tenga presupuestos o pedidos en curso antes de intentarlo de nuevo.`,
        detail,
      });
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  }, [confirmDelete, deleteCustomer]);

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const visibleIds = paginatedCustomers.map(customer => customer.id ?? '');
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selected.has(id));

    setSelected(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach(id => next.delete(id));
      } else {
        visibleIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const allSelected = paginatedCustomers.length > 0
    && paginatedCustomers.every(customer => selected.has(customer.id ?? ''));
  const firstVisible = visibleCustomers.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, visibleCustomers.length);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 128px)', minHeight: 400 }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selected.size > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'var(--notice-bg)', color: 'var(--notice-text)', border: '1px solid var(--notice-border)' }}
            >
              {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
              <button
                onClick={() => setSelected(new Set())}
                className="ml-1 opacity-60 hover:opacity-100"
              >✕</button>
            </div>
          )}
          {/* Search */}
          <div className="relative hidden md:block flex-1 min-w-0">
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9ca3af' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              placeholder="Buscar cliente..."
              className="pl-9 pr-4 py-2 rounded-xl text-sm border"
              style={{ border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', background: '#fff', width: '100%' }}
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                    style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
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
                : visibleCustomers.length === 0
                  ? <CustomerManagementEmptyState onAdd={handleCreate} filtered={searchTerm.trim().length > 0} />
                  : paginatedCustomers.map((c, idx) => {
                    const id = c.id ?? idx.toString();
                    const isChecked = selected.has(id);

                    return (
                      <tr
                        key={id}
                        className="group transition-colors duration-100"
                        role="button"
                        tabIndex={0}
                        style={{
                          borderBottom: '1px solid #f3f4f6',
                          background: isChecked ? 'var(--accent-soft)' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleEdit(c)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleEdit(c);
                          }
                        }}
                        onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = '#f9fafb'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isChecked ? 'var(--accent-soft)' : 'transparent'; }}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-2" onClick={event => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRow(id)}
                            className="rounded cursor-pointer"
                            style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
                          />
                        </td>

                        {/* Nombre comercial — con barra de acento izquierda si está seleccionado */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {isChecked && (
                              <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                            )}
                            <span className="font-semibold transition-colors" style={{ color: '#111827' }}>
                              {c.nombreComercial || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Razón social */}
                        <td className="px-3 py-2.5" style={{ color: '#6b7280' }}>
                          {c.razonSocial || '—'}
                        </td>

                        {/* Contacto con avatar */}
                        <td className="px-3 py-2.5" onClick={event => event.stopPropagation()}>
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
                        <td className="px-3 py-2.5" onClick={event => event.stopPropagation()}>
                          <CustomerTariffBadge value={c.tarifa} />
                        </td>

                        {/* Forma de pago */}
                        <td className="px-3 py-2.5" onClick={event => event.stopPropagation()}>
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
                        <td className="px-3 py-2.5" style={{ color: '#6b7280', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={event => event.stopPropagation()}>
                          {c.email
                            ? <a href={`mailto:${c.email.toLowerCase()}`} className="hover:text-brand transition-colors" style={{ color: '#6b7280' }} onClick={event => event.stopPropagation()}>{c.email.toLowerCase()}</a>
                            : <span style={{ color: '#d1d5db' }}>—</span>
                          }
                        </td>

                        {/* Actions */}
                        <td className="px-2 py-2.5 text-right" onClick={event => event.stopPropagation()}>
                          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => handleEdit(c)}
                              title="Editar"
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer"
                              style={{ color: '#9ca3af' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = 'var(--accent)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleAskDelete(c)}
                              title="Eliminar"
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer"
                              style={{ color: '#9ca3af' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)'; }}
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
              Mostrando <strong style={{ color: '#111827' }}>{firstVisible}-{lastVisible}</strong> de <strong style={{ color: '#111827' }}>{visibleCustomers.length}</strong> clientes
              {searchTerm.trim() ? (
                <span>
                  {' '}
                  de <strong style={{ color: '#111827' }}>{customers.length}</strong>
                </span>
              ) : null}
            </span>
            {selected.size > 0 && (
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#6b7280' }}>
            <span>Por página:</span>
              <select
              className="rounded px-2 py-1 text-xs border"
              style={{ border: '1px solid #e5e7eb', outline: 'none', background: '#fff', fontSize: 11 }}
                value={pageSize}
                onChange={event => setPageSize(Number(event.target.value))}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <div className="flex items-center gap-0.5 ml-2">
              <button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage(current => Math.max(1, current - 1))} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white border border-transparent hover:border-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed" style={{ color: '#9ca3af' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: 'var(--accent)', color: '#fff', minWidth: 42, textAlign: 'center' }}>{page} / {totalPages}</span>
              <button type="button" aria-label="Página siguiente" disabled={page >= totalPages} onClick={() => setPage(current => Math.min(totalPages, current + 1))} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white border border-transparent hover:border-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed" style={{ color: '#9ca3af' }}>
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
          onOpenBudget={handleOpenBudget}
          onOpenVision360={handleOpenVision360}
        />
      )}
      <Customer360Modal
        open={Boolean(visionCustomer)}
        customer={visionCustomer}
        onClose={() => setVisionCustomer(null)}
      />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Eliminar cliente"
        description={`Vas a eliminar el cliente "${confirmDelete?.nombreComercial || confirmDelete?.razonSocial || 'Sin nombre'}". Esto puede afectar presupuestos, órdenes de trabajo y facturación asociada.`}
        confirmLabel="Eliminar cliente"
        cancelLabel="Mantener cliente"
        tone="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete(null)}
      />
      <ErrorDialog
        open={Boolean(deleteError)}
        title={deleteError?.title ?? ''}
        description={deleteError?.description ?? ''}
        detail={deleteError?.detail}
        onClose={() => setDeleteError(null)}
      />
    </div>
  );
};

export default CustomerManagement;
