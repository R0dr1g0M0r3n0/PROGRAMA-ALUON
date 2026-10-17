import { useEffect, useState } from 'react';
import { deactivateDistributor, listDistributors, saveDistributor } from './adminOperationsApi';
import type { AdminDistributor, AdminDistributorForm } from './AdminManagement.types';
import { useAdminUsers } from '../../hooks/useAdminUsers';

const empty: AdminDistributorForm = {
  code: '', name: '', legalName: '', email: '', phone: '', address: '',
  sortOrder: 0, active: true, userIds: [],
};

export const DistributorsManagement = () => {
  const { users } = useAdminUsers();
  const [items, setItems] = useState<AdminDistributor[]>([]);
  const [form, setForm] = useState<AdminDistributorForm>(empty);
  const [editing, setEditing] = useState<string>();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const refresh = async () => {
    try { setItems(await listDistributors()); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar los distribuidores.'); }
  };
  useEffect(() => { void refresh(); }, []);

  const save = async () => {
    setError('');
    try {
      await saveDistributor(form, editing);
      setMessage('Distribuidor guardado y auditado.');
      setEditing(undefined); setForm(empty); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar.'); }
  };

  const fields = [
    ['Código', 'code'], ['Nombre', 'name'], ['Razón social', 'legalName'],
    ['Email', 'email'], ['Teléfono', 'phone'], ['Dirección', 'address'],
  ] as const;

  return <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 h-fit">
      <div className="text-sm font-black uppercase tracking-wider">Distribuidor</div>
      <p className="text-xs text-slate-500 mt-1 mb-4">Alta, estado y usuarios asociados. La baja es lógica.</p>
      <div className="space-y-3">
        {fields.map(([label, key]) => <label key={key} className="field-label">{label}
          <input className="field mt-1" value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
        </label>)}
        <label className="field-label">Usuarios asociados
          <select multiple className="field mt-1 min-h-28" value={form.userIds.map(String)} onChange={e => setForm({ ...form, userIds: Array.from(e.target.selectedOptions).map(o => Number(o.value)) })}>
            {users.filter(user => user.id).map(user => <option key={user.id} value={user.id}>{user.nombre} {user.apellidos} · {user.role}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Activo</label>
        {error && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">{error}</div>}
        {message && <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs font-semibold text-blue-700">{message}</div>}
        <div className="flex gap-2"><button className="btn-primary" onClick={() => void save()}>{editing ? 'Actualizar' : 'Crear distribuidor'}</button>{editing && <button className="btn-ghost" onClick={() => { setEditing(undefined); setForm(empty); }}>Cancelar</button>}</div>
      </div>
    </section>
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4"><div><div className="text-sm font-black uppercase tracking-wider">Distribuidores</div><div className="text-xs text-slate-500 mt-1">Los cambios quedan registrados en auditoría.</div></div><button className="btn-ghost" onClick={() => void refresh()}>Actualizar</button></div>
      <div className="space-y-3">{items.map(item => <article key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-3"><div><div className="font-black">{item.name} <span className="text-xs text-slate-400">{item.code}</span></div><div className="text-xs text-slate-500">{item.email || 'Sin email'} · {item.phone || 'Sin teléfono'}</div><div className="mt-2 text-xs">{item.userIds.length} usuario(s) asociado(s) · <strong>{item.active ? 'Activo' : 'Inactivo'}</strong></div></div><div className="flex gap-2"><button className="btn-ghost" onClick={() => { setEditing(item.id); setForm({ code: item.code, name: item.name, legalName: item.legalName || '', email: item.email || '', phone: item.phone || '', address: item.address || '', sortOrder: item.sortOrder, active: item.active, userIds: item.userIds }); }}>Editar</button><button className="btn-ghost" disabled={!item.active} onClick={async () => { await deactivateDistributor(item.id); await refresh(); }}>Dar de baja</button></div></div></article>)}</div>
    </section>
  </div>;
};
