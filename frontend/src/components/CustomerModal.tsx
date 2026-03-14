import React, { useState } from 'react';
import { Customer, DeliveryAddress } from '../hooks/useCustomers';

interface Props {
  customer?: Customer;
  onClose:   () => void;
  onSave:    (c: Customer) => void;
}

type TabKey = 'GENERAL' | 'ADDRESSES';

const EMPTY_CUSTOMER: Customer = {
  nombreComercial: '', razonSocial: '', personaContacto: '',
  tarifa: '', tipoDocumento: 'CIF', telefono: '', email: '',
  direccion: '', cp: '', poblacion: '', provincia: '', pais: 'ESPAÑA',
  iban: '', formaPago: '', diasVencimiento: 0, remanente: 0, direccionesEntrega: [],
};

const EMPTY_ADDR: DeliveryAddress = {
  nombreAlias: '', direccion: '', cp: '', poblacion: '', provincia: '', telefono: '', contacto: '',
};

// ── Simple helpers ─────────────────────────────────────────────────────────────
const FL = ({ children }: { children: React.ReactNode }) => (
  <label className="field-label">{children}</label>
);

const FI = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className="field" autoComplete="off" />
);

const SectionTitle = ({ n, label }: { n: string; label: string }) => (
  <div className="flex items-center gap-3 mb-5">
    <span style={{ fontSize: 9, fontWeight: 900, color: '#e5534b', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
      {n} · {label}
    </span>
    <div className="flex-1 h-px" style={{ backgroundColor: '#e8eaed' }} />
  </div>
);

// ── Modal ──────────────────────────────────────────────────────────────────────
const CustomerModal: React.FC<Props> = ({ customer, onClose, onSave }) => {
  const [tab,     setTab]     = useState<TabKey>('GENERAL');
  const [form,    setForm]    = useState<Customer>(customer ?? EMPTY_CUSTOMER);
  const [newAddr, setNewAddr] = useState<DeliveryAddress>(EMPTY_ADDR);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value.toUpperCase() }));
  };

  const handleAddrField = (name: keyof DeliveryAddress, value: string) =>
    setNewAddr(p => ({ ...p, [name]: value.toUpperCase() }));

  const addAddr = () => {
    if (!newAddr.nombreAlias) return;
    setForm(p => ({ ...p, direccionesEntrega: [...p.direccionesEntrega, newAddr] }));
    setNewAddr(EMPTY_ADDR);
  };

  const removeAddr = (i: number) =>
    setForm(p => ({ ...p, direccionesEntrega: p.direccionesEntrega.filter((_, j) => j !== i) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  const isEdit = Boolean(customer?.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(13,17,23,0.70)', backdropFilter: 'blur(6px)' }}
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-4xl rounded-2xl flex flex-col overflow-hidden animate-fade-up"
        style={{ background: '#ffffff', maxHeight: 'calc(100vh - 48px)', boxShadow: '0 24px 70px rgba(0,0,0,0.32)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ background: '#0d1117', borderBottom: '1px solid #21262d' }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(229,83,75,0.15)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#e5534b' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isEdit ? 'Editar cliente' : 'Nuevo cliente'}
              </h2>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
                {isEdit ? form.nombreComercial : 'Completa los datos del cliente'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200"
            style={{ color: '#8b949e' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#21262d'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b949e'; }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ background: '#f8f9fb', borderBottom: '1px solid #e8eaed' }}>
          {(['GENERAL', 'ADDRESSES'] as TabKey[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="flex items-center gap-2 px-6 py-3.5 cursor-pointer transition-all duration-200"
              style={{
                fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em',
                borderBottom: `2px solid ${tab === t ? '#e5534b' : 'transparent'}`,
                color: tab === t ? '#e5534b' : '#8b949e',
                background: tab === t ? '#ffffff' : 'transparent',
              }}
            >
              {t === 'GENERAL' ? 'Datos generales' : 'Direcciones'}
              {t === 'ADDRESSES' && (
                <span style={{
                  fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 4,
                  background: tab === 'ADDRESSES' ? '#e5534b' : '#e8eaed',
                  color: tab === 'ADDRESSES' ? '#fff' : '#8b949e'
                }}>
                  {form.direccionesEntrega.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Form body */}
        <form id="cm-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-7 space-y-8">

          {tab === 'GENERAL' ? (
            <>
              {/* 01 Empresa */}
              <section>
                <SectionTitle n="01" label="Empresa" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-2"><FL>Nombre Comercial *</FL><FI name="nombreComercial" value={form.nombreComercial} onChange={handleChange} required /></div>
                  <div><FL>Razón Social</FL><FI name="razonSocial" value={form.razonSocial} onChange={handleChange} /></div>
                  <div><FL>Persona de Contacto</FL><FI name="personaContacto" value={form.personaContacto} onChange={handleChange} /></div>
                  <div><FL>Tipo de Documento</FL>
                    <select name="tipoDocumento" value={form.tipoDocumento} onChange={handleChange} className="field">
                      {['CIF','DNI','NIE','PASAPORTE'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div><FL>Tarifa</FL><FI name="tarifa" value={form.tarifa} onChange={handleChange} /></div>
                  <div><FL>Teléfono</FL><FI name="telefono" value={form.telefono} onChange={handleChange} /></div>
                  <div><FL>Email</FL><FI name="email" type="email" value={form.email} onChange={handleChange} /></div>
                </div>
              </section>

              {/* 02 Dirección fiscal */}
              <section>
                <SectionTitle n="02" label="Dirección fiscal" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-2"><FL>Calle / Dirección</FL><FI name="direccion" value={form.direccion} onChange={handleChange} /></div>
                  <div><FL>CP</FL><FI name="cp" value={form.cp} onChange={handleChange} /></div>
                  <div><FL>Población</FL><FI name="poblacion" value={form.poblacion} onChange={handleChange} /></div>
                  <div><FL>Provincia</FL><FI name="provincia" value={form.provincia} onChange={handleChange} /></div>
                  <div><FL>País</FL><FI name="pais" value={form.pais} onChange={handleChange} /></div>
                </div>
              </section>

              {/* 03 Finanzas */}
              <section>
                <SectionTitle n="03" label="Finanzas" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-2"><FL>IBAN</FL><FI name="iban" value={form.iban} onChange={handleChange} /></div>
                  <div><FL>Forma de pago</FL><FI name="formaPago" value={form.formaPago} onChange={handleChange} /></div>
                  <div><FL>Días vencimiento</FL><FI name="diasVencimiento" type="number" value={form.diasVencimiento} onChange={handleChange} /></div>
                  <div><FL>Remanente</FL><FI name="remanente" type="number" value={form.remanente} onChange={handleChange} /></div>
                </div>
              </section>
            </>
          ) : (
            /* Addresses tab */
            <div className="space-y-6">
              <div className="p-6 rounded-xl space-y-3" style={{ background: '#f8f9fb', border: '1px solid #e8eaed' }}>
                <p style={{ fontSize: 10, fontWeight: 900, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>
                  Nueva dirección de entrega
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FI placeholder="ALIAS (ej: ALMACÉN SUR)" value={newAddr.nombreAlias} onChange={e => handleAddrField('nombreAlias', e.target.value)} />
                  <FI placeholder="PERSONA DE CONTACTO"    value={newAddr.contacto}    onChange={e => handleAddrField('contacto',    e.target.value)} />
                  <FI placeholder="TELÉFONO"               value={newAddr.telefono}    onChange={e => handleAddrField('telefono',    e.target.value)} />
                  <div className="sm:col-span-2">
                    <FI placeholder="CALLE / DIRECCIÓN"   value={newAddr.direccion}  onChange={e => handleAddrField('direccion',  e.target.value)} />
                  </div>
                  <FI placeholder="POBLACIÓN"              value={newAddr.poblacion}  onChange={e => handleAddrField('poblacion',  e.target.value)} />
                  <FI placeholder="PROVINCIA"              value={newAddr.provincia}  onChange={e => handleAddrField('provincia',  e.target.value)} />
                </div>
                <button
                  type="button"
                  onClick={addAddr}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide text-white cursor-pointer transition-colors duration-200"
                  style={{ background: '#0d1117', marginTop: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#21262d')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#0d1117')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Añadir dirección
                </button>
              </div>

              {form.direccionesEntrega.length === 0 ? (
                <p className="text-center py-10 text-xs font-semibold uppercase tracking-wide" style={{ color: '#8b949e' }}>
                  No hay direcciones añadidas todavía.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.direccionesEntrega.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl group transition-colors duration-200 cursor-default"
                      style={{ background: '#ffffff', border: '1px solid #e8eaed' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#c7392f')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8eaed')}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: '#f8f9fb', border: '1px solid #e8eaed' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8b949e' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 900, color: '#0d1117', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{a.nombreAlias}</div>
                          <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>
                            {[a.direccion, a.poblacion, a.provincia].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAddr(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200"
                        style={{ color: '#8b949e' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-4 px-7 py-5"
          style={{ borderTop: '1px solid #e8eaed', background: '#f8f9fb' }}
        >
          <p style={{ fontSize: 10, color: '#8b949e', fontWeight: 600 }} className="hidden sm:block">* Campos obligatorios</p>
          <div className="flex items-center gap-3 ml-auto">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" form="cm-form" className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              {isEdit ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
