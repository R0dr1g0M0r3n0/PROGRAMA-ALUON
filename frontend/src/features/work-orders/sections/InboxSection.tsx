import { useCallback, useMemo, useState } from 'react';
import type { WorkOrderRequest } from '../models';
import { WORKFLOW_STEP_LABELS } from '../constants';
import { cardStyle, uiColors } from '../components/ui';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog';
import ErrorDialog from '../../../components/feedback/ErrorDialog';
import { OriginalRequestDialog } from '../components/OriginalRequestDialog';
import type { CatalogModelOption } from '../utils/catalogModels';
import { resolveCatalogModelOption } from '../utils/catalogModels';
import { duplicateWorkOrder } from '../services/requestsApi';

const statusStyles: Record<string, { background: string; color: string; border: string }> = {
  INBOX: { background: 'var(--accent-soft-2)', color: uiColors.accent, border: 'var(--accent-border)' },
  REQUEST: { background: 'var(--accent-soft-2)', color: 'var(--accent-dark)', border: 'var(--accent-border)' },
  BUDGET: { background: '#fefce8', color: '#a16207', border: '#fde68a' },
  VALIDATION: { background: '#ecfdf3', color: uiColors.success, border: '#bbf7d0' },
  DEV: { background: '#f3f4f6', color: uiColors.textMuted, border: uiColors.borderLight },
  PROD: { background: 'var(--accent-soft-2)', color: 'var(--accent-dark)', border: 'var(--accent-border)' },
  FINAL: { background: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
};

const statusProgress: Record<string, number> = {
  INBOX: 10,
  REQUEST: 25,
  BUDGET: 40,
  VALIDATION: 55,
  DEV: 70,
  PROD: 85,
  FINAL: 100,
};

export const InboxSection = ({
  requests,
  selectedRequestId,
  customerId,
  modelOptions,
  onApplyRequest,
  onDeleteRequest,
  onSelectRequest,
}: {
  requests: WorkOrderRequest[];
  selectedRequestId: string | null;
  customerId: string;
  modelOptions: CatalogModelOption[];
  onApplyRequest: (req: WorkOrderRequest) => void;
  onDeleteRequest: (req: WorkOrderRequest) => Promise<void>;
  onSelectRequest: (id: string) => void;
}) => {
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<WorkOrderRequest | null>(null);
  const [deleteError, setDeleteError] = useState<{ title: string; description: string; detail?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOriginalRequest, setShowOriginalRequest] = useState(false);
  const [originalRequest, setOriginalRequest] = useState<WorkOrderRequest | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);

  const handleAskDelete = useCallback((request: WorkOrderRequest) => {
    setConfirmDelete(request);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) {
      setConfirmDelete(null);
      return;
    }
    setIsDeleting(true);
    try {
      await onDeleteRequest(confirmDelete);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'No se pudo eliminar la solicitud.';
      setDeleteError({
        title: 'No pudimos eliminar la solicitud',
        description: `La solicitud ${confirmDelete.reference} sigue activa. Revisa si ya está en producción o validación antes de volver a intentarlo.`,
        detail,
      });
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  }, [confirmDelete, onDeleteRequest]);

  const handleShowOriginal = useCallback((request: WorkOrderRequest) => {
    setOriginalRequest(request);
    setShowOriginalRequest(true);
  }, []);

  const handleDuplicate = useCallback(async (request: WorkOrderRequest) => {
    setDuplicatingId(request.orderId);
    setDuplicateMessage(null);
    try {
      const duplicated = await duplicateWorkOrder(request.orderId);
      setDuplicateMessage(`Orden duplicada: ${duplicated.codigoOrden} (revisión ${duplicated.revision}). Actualiza la bandeja para verla.`);
    } catch (error) {
      setDuplicateMessage(error instanceof Error ? error.message : 'No se pudo duplicar la orden.');
    } finally {
      setDuplicatingId(null);
    }
  }, []);

  const filteredRequests = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    return requests.filter(req => {
      const modelLabel = req.modelLabel ?? (resolveCatalogModelOption(req.modelId, modelOptions)?.label ?? '');
      const matchesText = !query || [
        req.customerName,
        req.id,
        req.reference,
        req.notes,
        modelLabel,
      ].some(value => value.toLowerCase().includes(query));
      const matchesStatus = !filterStatus || req.workflowStep === filterStatus;
      const matchesDate = !filterDate || req.requestDate === filterDate;
      return matchesText && matchesStatus && matchesDate;
    });
  }, [filterDate, filterStatus, filterText, modelOptions, requests]);

  return (
    <section className="p-6 rounded-2xl" style={cardStyle}>
      <div
        className="flex flex-col lg:flex-row lg:items-end gap-3 p-4 rounded-2xl border mb-4"
        style={{ borderColor: uiColors.border, background: '#ffffff' }}
      >
        <div className="flex-1">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: uiColors.textSubtle }}>
            Buscar
          </div>
          <input
            className="field"
            placeholder="Cliente, modelo o referencia"
            value={filterText}
            onChange={event => setFilterText(event.target.value)}
          />
        </div>
        <div className="w-full lg:w-56">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: uiColors.textSubtle }}>
            Estado
          </div>
          <select className="field" value={filterStatus} onChange={event => setFilterStatus(event.target.value)}>
            <option value="">Todos</option>
            <option value="INBOX">Solicitudes</option>
            <option value="REQUEST">Solicitud</option>
            <option value="BUDGET">Presupuesto</option>
            <option value="VALIDATION">Validación</option>
            <option value="DEV">Desarrollo</option>
            <option value="PROD">Producción</option>
            <option value="FINAL">Final</option>
          </select>
        </div>
        <div className="w-full lg:w-56">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: uiColors.textSubtle }}>
            Fecha solicitud
          </div>
          <input
            className="field"
            type="date"
            value={filterDate}
            onChange={event => setFilterDate(event.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: uiColors.border }}>
        <div className="min-w-[1040px]">
        <div
          className="grid gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em]"
          style={{ color: uiColors.textSubtle, background: '#f9fafb', borderBottom: `1px solid ${uiColors.border}` }}
        >
          <div className="grid grid-cols-[0.9fr_1.6fr_1fr_1fr_0.8fr_1.1fr_1.4fr_0.9fr_auto] items-center gap-3">
            <span>Fecha</span>
            <span>Cliente</span>
            <span>Solicitud</span>
            <span>Modelo</span>
            <span>m²</span>
            <span>Referencia</span>
            <span>Estado</span>
            <span>Estado</span>
            <span className="text-right">Acción</span>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: uiColors.border }}>
          {filteredRequests.map(req => {
            const active = selectedRequestId === req.id;
            const modelLabel = req.modelLabel ?? (resolveCatalogModelOption(req.modelId, modelOptions)?.label ?? '—');
            const statusStyle = statusStyles[req.workflowStep] ?? statusStyles.INBOX;
            const progress = statusProgress[req.workflowStep] ?? 0;
              return (
                <div
                  key={req.id}
                  className={[
                    'grid grid-cols-[0.9fr_1.6fr_1fr_1fr_0.8fr_1.1fr_1.4fr_0.9fr_auto] items-center gap-3 px-4 py-3 text-xs transition-colors cursor-pointer hover:bg-[#f8f9fb]',
                    active ? 'bg-white' : 'bg-white',
                  ].join(' ')}
                  style={{
                    background: active ? 'var(--accent-soft)' : '#ffffff',
                    boxShadow: active ? 'inset 0 0 0 1px var(--accent-shadow-strong)' : 'none',
                    borderLeft: active ? '4px solid var(--accent)' : '4px solid transparent',
                    paddingLeft: active ? '0.75rem' : undefined,
                  }}
                  onClick={() => {
                    const el = document.activeElement;
                    if (el instanceof HTMLElement) {
                      el.blur();
                    }
                    onSelectRequest(req.id);
                  }}
                >
                <div className="font-semibold" style={{ color: uiColors.textPrimary }}>
                  {req.requestDate}
                </div>
                  <div className="min-w-0">
                    <div className="font-bold uppercase tracking-[0.08em]" style={{ color: uiColors.textPrimary }}>
                      {req.customerName}
                    </div>
                    <div className="text-[11px]" style={{ color: uiColors.textGhost }}>
                      {req.notes || 'Sin notas'}
                    </div>
                  </div>
                  <div className="font-semibold" style={{ color: uiColors.textPrimary }}>
                    {req.id}
                  </div>
                  <div className="font-semibold" style={{ color: uiColors.textPrimary }}>
                    {modelLabel}
                  </div>
                  <div className="font-semibold" style={{ color: uiColors.textPrimary }}>
                    {req.m2}
                  </div>
                <div className="text-[11px] font-semibold" style={{ color: uiColors.textMuted }}>
                  {req.reference}
                </div>
                <div className="min-w-0">
                  <div className="h-2.5 rounded-full" style={{ background: '#f3f4f6' }}>
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{ width: `${progress}%`, background: uiColors.accent }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] font-semibold" style={{ color: uiColors.textSubtle }}>
                    {progress}% completado
                  </div>
                </div>
                <div>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-black uppercase"
                    style={{
                      background: statusStyle.background,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`,
                    }}
                  >
                    {WORKFLOW_STEP_LABELS[req.workflowStep]}
                  </span>
                </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg border transition-colors inline-flex items-center justify-center"
                      style={{
                        color: uiColors.textPrimary,
                        borderColor: active ? uiColors.accent : uiColors.border,
                        background: active ? 'var(--accent-soft-2)' : '#f9fafb',
                      }}
                      onClick={event => {
                        event.stopPropagation();
                        onApplyRequest(req);
                      }}
                      aria-label="Cargar solicitud"
                      title="Cargar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 15v4a1 1 0 001 1h14a1 1 0 001-1v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg border transition-colors inline-flex items-center justify-center"
                      style={{ color: uiColors.textPrimary, borderColor: uiColors.border, background: '#f9fafb' }}
                      disabled={duplicatingId === req.orderId}
                      onClick={event => { event.stopPropagation(); void handleDuplicate(req); }}
                      aria-label="Duplicar orden"
                      title="Duplicar / nueva revisión"
                    >
                      <span className="text-[11px] font-black">+1</span>
                    </button>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg border transition-colors inline-flex items-center justify-center"
                      style={{
                        color: uiColors.textPrimary,
                        borderColor: uiColors.border,
                        background: '#f9fafb',
                      }}
                      onClick={event => {
                        event.stopPropagation();
                        handleShowOriginal(req);
                      }}
                      aria-label="Ver solicitud original"
                      title="Solicitud original"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5h6m-6 4h6m-7 4h8m-9 4h10M6 3h9l3 3v15a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg border transition-colors inline-flex items-center justify-center"
                      style={{
                        color: uiColors.danger,
                        borderColor: uiColors.danger,
                        background: '#fff5f5',
                      }}
                      onClick={async event => {
                        event.stopPropagation();
                        handleAskDelete(req);
                      }}
                      aria-label="Eliminar solicitud"
                      title="Eliminar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3-3h8m-6 3v10m4-10v10" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {duplicateMessage && (
        <p className="text-xs mt-3" style={{ color: uiColors.accent }}>{duplicateMessage}</p>
      )}
      {selectedRequestId && !customerId && (
        <p className="text-xs mt-3" style={{ color: uiColors.danger }}>
          No se encontró el cliente en CRM. Selecciónalo manualmente en la solicitud.
        </p>
      )}
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Eliminar solicitud"
        description={`Vas a eliminar la solicitud ${confirmDelete?.reference ?? 'sin referencia'}. Esto eliminará su rastro en la bandeja y sus notas asociadas.`}
        confirmLabel="Eliminar solicitud"
        cancelLabel="Mantener solicitud"
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
      <OriginalRequestDialog
        open={showOriginalRequest}
        request={originalRequest}
        onClose={() => { setShowOriginalRequest(false); setOriginalRequest(null); }}
      />
    </section>
  );
};
