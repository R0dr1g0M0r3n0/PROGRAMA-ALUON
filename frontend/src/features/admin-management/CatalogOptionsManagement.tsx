import { useEffect, useMemo, useState } from 'react';
import type { CatalogOption, CatalogOptionForm } from './AdminManagement.types';
import { createCatalogOption, deleteCatalogOption, listCatalogOptions, updateCatalogOption } from './catalogOptionsApi';

const empty: CatalogOptionForm = { kind: 'COLOR', code: '', label: '', description: '', imageUrl: '', metadata: '{}', sortOrder: 0, active: true };
const kinds = ['COLOR', 'ACABADO', 'HERRAJE', 'CERRADURA', 'PORTERO', 'AUTOMATIZACION', 'CARRIL', 'GUIA', 'TARIFA', 'DESCUENTO'];

export const CatalogOptionsManagement = () => {
  const [items, setItems] = useState<CatalogOption[]>([]);
  const [form, setForm] = useState<CatalogOptionForm>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const refresh = async () => { setLoading(true); try { setItems(await listCatalogOptions()); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar las opciones.'); } finally { setLoading(false); } };
  useEffect(() => { void refresh(); }, []);
  const grouped = useMemo(() => kinds.map(kind => ({ kind, items: items.filter(item => item.kind === kind) })).filter(group => group.items.length), [items]);
  const save = async () => { setSaving(true); setError(''); setMessage(''); try { if (editingId) await updateCatalogOption(editingId, form); else await createCatalogOption(form); setForm(empty); setEditingId(null); setMessage('Opción guardada.'); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar la opción.'); } finally { setSaving(false); } };
  return <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 h-fit"><div className="text-sm font-black uppercase tracking-wider">Opción de catálogo</div><p className="text-xs text-slate-500 mt-1 mb-4">Colores, acabados, herrajes, cerraduras y condiciones comerciales reutilizables.</p><div className="space-y-3">
      <label className="field-label">Grupo<select className="field mt-1" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}>{kinds.map(kind => <option key={kind}>{kind}</option>)}</select></label>
      <label className="field-label">Código<input className="field mt-1" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="RAL_7016" /></label>
      <label className="field-label">Etiqueta<input className="field mt-1" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Gris antracita" /></label>
      <label className="field-label">Descripción<input className="field mt-1" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
      <label className="field-label">Imagen o muestra (URL)<input className="field mt-1" value={form.imageUrl || ''} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." /></label>
      <label className="field-label">Restricciones futuras (JSON)<textarea className="field mt-1 min-h-20 font-mono text-xs" value={form.metadata || '{}'} onChange={e => setForm({ ...form, metadata: e.target.value })} /></label>
      <label className="field-label">Orden<input className="field mt-1" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} /></label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Activa</label>
      {error && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">{error}</div>}{message && <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs font-semibold text-blue-700">{message}</div>}
      <div className="flex gap-2"><button className="btn-primary" disabled={saving} onClick={() => void save()}>{saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Crear opción'}</button>{editingId && <button className="btn-ghost" onClick={() => { setEditingId(null); setForm(empty); }}>Cancelar</button>}</div>
    </div></section>
    <section className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between mb-4"><div><div className="text-sm font-black uppercase tracking-wider">Opciones configurables</div><div className="text-xs text-slate-500 mt-1">Solo las activas aparecen en el configurador.</div></div><button className="btn-ghost" onClick={() => void refresh()}>Actualizar</button></div>
      {loading ? <div className="text-sm text-slate-500">Cargando opciones…</div> : grouped.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No hay opciones configuradas.</div> : <div className="space-y-4">{grouped.map(group => <div key={group.kind}><div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{group.kind}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{group.items.map(item => <article key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3"><div><div className="font-black">{item.label}</div><div className="text-[11px] text-slate-500">{item.code} · orden {item.sortOrder} · {item.active ? 'Activa' : 'Inactiva'}</div></div><div className="flex gap-1"><button className="btn-ghost px-2" onClick={() => { setEditingId(item.id); setForm({ kind: item.kind, code: item.code, label: item.label, sortOrder: item.sortOrder, active: item.active }); }}>Editar</button><button className="btn-ghost px-2" onClick={async () => { if (window.confirm('¿Eliminar esta opción?')) { await deleteCatalogOption(item.id); await refresh(); } }}>Eliminar</button></div></article>)}</div></div>)}</div>}
    </section>
  </div>;
};
