import { useEffect, useState } from 'react';
import type { CatalogRule, CatalogRuleForm } from './AdminManagement.types';
import { createCatalogRule, deleteCatalogRule, listCatalogRules, updateCatalogRule } from './catalogRulesApi';

const emptyForm: CatalogRuleForm = { productType: 'PUERTA_PEATONAL', technicalModel: '', ruleKey: 'WIDTH_RANGE', ruleValue: '{\n  "min": 600,\n  "max": 2500,\n  "unit": "mm"\n}', description: '', active: true, provisional: true };

const formFromRule = (rule: CatalogRule): CatalogRuleForm => ({ productType: rule.productType, technicalModel: rule.technicalModel ?? '', ruleKey: rule.ruleKey, ruleValue: JSON.stringify(rule.ruleValue, null, 2), description: rule.description ?? '', active: rule.active, provisional: rule.provisional });

export const CatalogRulesManagement = () => {
  const [rules, setRules] = useState<CatalogRule[]>([]);
  const [form, setForm] = useState<CatalogRuleForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const refresh = async () => { setLoading(true); try { setRules(await listCatalogRules()); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar las reglas.'); } finally { setLoading(false); } };
  useEffect(() => { void refresh(); }, []);

  const save = async () => {
    setSaving(true); setError(''); setMessage('');
    try {
      if (editingId) await updateCatalogRule(editingId, form); else await createCatalogRule(form);
      setForm(emptyForm); setEditingId(null); setMessage('Regla guardada.'); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar la regla.'); } finally { setSaving(false); }
  };

  return <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 h-fit">
      <div className="text-sm font-black uppercase tracking-wider">Regla configurable</div>
      <p className="text-xs text-slate-500 mt-1 mb-4">Define límites, tarifas o compatibilidades como JSON. No se convierten en bloqueos hasta aprobarlos.</p>
      <div className="space-y-3">
        <label className="field-label">Tipo de producto<select className="field mt-1" value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value })}><option>PUERTA_PEATONAL</option><option>ABATIBLE_UNA</option><option>ABATIBLE_DOS</option><option>CORREDERA</option><option>VALLA</option><option>GLOBAL</option></select></label>
        <label className="field-label">Modelo técnico (opcional)<input className="field mt-1" value={form.technicalModel} onChange={e => setForm({ ...form, technicalModel: e.target.value })} placeholder="CLASSIC" /></label>
        <label className="field-label">Clave<input className="field mt-1" value={form.ruleKey} onChange={e => setForm({ ...form, ruleKey: e.target.value.toUpperCase() })} placeholder="WIDTH_RANGE" /></label>
        <label className="field-label">Valor JSON<textarea className="field mt-1 min-h-32 font-mono text-xs" value={form.ruleValue} onChange={e => setForm({ ...form, ruleValue: e.target.value })} /></label>
        <label className="field-label">Descripción<input className="field mt-1" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Activa</label>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.provisional} onChange={e => setForm({ ...form, provisional: e.target.checked })} /> Dato provisional pendiente de confirmación ALUON</label>
        {error && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">{error}</div>}
        {message && <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs font-semibold text-blue-700">{message}</div>}
        <div className="flex gap-2"><button className="btn-primary" disabled={saving} onClick={() => void save()}>{saving ? 'Guardando…' : editingId ? 'Actualizar regla' : 'Crear regla'}</button>{editingId && <button className="btn-ghost" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</button>}</div>
      </div>
    </section>
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4"><div><div className="text-sm font-black uppercase tracking-wider">Reglas del catálogo</div><div className="text-xs text-slate-500 mt-1">Se aplicarán al configurador cuando estén aprobadas por ALUON.</div></div><button className="btn-ghost" onClick={() => void refresh()}>Actualizar</button></div>
      {loading ? <div className="text-sm text-slate-500">Cargando reglas…</div> : rules.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No hay reglas configuradas todavía.</div> : <div className="space-y-3">{rules.map(rule => <article key={rule.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="font-black">{rule.ruleKey}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{rule.productType}{rule.technicalModel ? ` · ${rule.technicalModel}` : ''}</span></div><div className="text-xs text-slate-500 mt-1">{rule.description || 'Sin descripción'} · {rule.active ? 'Activa' : 'Inactiva'}</div></div><div className="flex gap-2"><button className="btn-ghost" onClick={() => { setEditingId(rule.id); setForm(formFromRule(rule)); }}>Editar</button><button className="btn-ghost" onClick={async () => { if (window.confirm('¿Eliminar esta regla?')) { await deleteCatalogRule(rule.id); await refresh(); } }}>Eliminar</button></div></div><pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(rule.ruleValue, null, 2)}</pre></article>)}</div>}
    </section>
  </div>;
};
