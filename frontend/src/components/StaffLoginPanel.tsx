import { FormEvent, useState } from 'react';
import { loginStaff, StaffUser } from '../services/staffAuthApi';

type Props = {
  onAuthenticated: (user: StaffUser) => void;
  onClose: () => void;
};

const StaffLoginPanel = ({ onAuthenticated, onClose }: Props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginStaff(username, password);
      onAuthenticated(result.user);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4" role="dialog" aria-modal="true" aria-labelledby="staff-login-title">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">ALUON · DEV2</p>
            <h2 id="staff-login-title" className="mt-1 text-xl font-black text-slate-900">Acceso de personal</h2>
            <p className="mt-1 text-sm text-slate-500">Necesario para administración y producción; también traza los cambios realizados.</p>
          </div>
          <button type="button" className="btn-ghost px-3" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <label className="field-label" htmlFor="staff-username">Usuario</label>
        <input id="staff-username" className="field mb-4" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" autoFocus />
        <label className="field-label" htmlFor="staff-password">Contraseña</label>
        <input id="staff-password" type="password" className="field" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" />
        {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Comprobando…' : 'Entrar'}</button>
        </div>
      </form>
    </div>
  );
};

export default StaffLoginPanel;
