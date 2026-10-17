import { useEffect, useMemo, useState } from 'react';
import type { QuoteResponse } from '../../customer-onboarding/models';
import type { ProjectDocumentRow } from '../ProjectManagement.types';
import { DocumentDrawerShell } from './DocumentDrawerShell';
import { DocumentDrawerHeader } from './DocumentDrawerHeader';
import type { DocumentDrawerSubview } from './DocumentDrawerView.types';
import { DocumentDrawerLinesView } from './DocumentDrawerLinesView';
import { DocumentDrawerFooter } from './DocumentDrawerFooter';
import { DocumentDrawerMetaGrid } from './DocumentDrawerMetaGrid';
import { DocumentDrawerTotalsPanel } from './DocumentDrawerTotalsPanel';
import { ManualDocumentDrawerFooter } from './ManualDocumentDrawerFooter';
import { ManualDocumentDrawerPanel } from './ManualDocumentDrawerPanel';
import { useDocumentDrawer } from './useDocumentDrawer';
import { useDocumentDrawerEdit } from './useDocumentDrawerEdit';
import { useManualDocumentDrawerEdit } from './useManualDocumentDrawerEdit';
import { emitQuoteDocument } from '../services/quoteDetailsApi';
import { documentManagementTheme } from '../documentManagementTheme';
import type { ProjectDocumentKind } from '../ProjectManagement.types';
import { DocumentThumbnail } from '../../../components/DocumentThumbnail';
import { ProposalDetailFrame, ProposalDetailStepper } from '../../../components/ProposalDetailFrame';

type Props = {
  open: boolean;
  row: ProjectDocumentRow | null;
  onClose: () => void;
  onOpenPreview?: (row: ProjectDocumentRow) => void;
  onRowUpdated?: (row: ProjectDocumentRow) => void;
};

const fmtEur = (value: number): string => {
  const fixed = Number.isFinite(value) ? value : 0;
  return fixed.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="px-5 py-4" style={{ borderBottom: `1px solid ${documentManagementTheme.border}` }}>
    <div className="flex items-center justify-between">
      <div className="text-xs font-black uppercase tracking-wide" style={{ color: documentManagementTheme.muted }}>
        {title}
      </div>
    </div>
    <div className="mt-3">{children}</div>
  </div>
);

export const DocumentProposalStepper = ProposalDetailStepper;

const toQuoteRowUpdate = (row: ProjectDocumentRow, quote: QuoteResponse): ProjectDocumentRow => ({
  ...row,
  customerName: quote.customerNombreComercial?.trim() || quote.customerName || row.customerName,
});

const toManualType = (value: string): Exclude<ProjectDocumentKind, 'PRESUPUESTO'> =>
  (value as Exclude<ProjectDocumentKind, 'PRESUPUESTO'>);

export const DocumentDrawer = ({ open, row, onClose, onOpenPreview, onRowUpdated }: Props) => {
  const { loading, error, data } = useDocumentDrawer(row);
  const [quoteOverride, setQuoteOverride] = useState<QuoteResponse | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [activeTipo, setActiveTipo] = useState<string | null>(null);
  const [optimisticByTipo, setOptimisticByTipo] = useState<Record<string, string>>({});
  const [subview, setSubview] = useState<DocumentDrawerSubview>('document');
  const [isEditing, setIsEditing] = useState(false);

  const quoteData = data?.kind === 'quote' ? data : null;
  const manualData = data?.kind === 'manual' ? data.document : null;
  const quoteForDisplay = quoteData ? (quoteOverride ?? quoteData.quote) : null;
  const quoteEdit = useDocumentDrawerEdit(quoteForDisplay);
  const manualEdit = useManualDocumentDrawerEdit(manualData ? row : null);

  const effectiveTipo = (activeTipo ?? row?.type ?? '').toString().toUpperCase();

  const existingByTipo = useMemo(() => {
    const map = new Map<string, string>();
    if (!quoteData) return map;
    for (const doc of quoteData.existingDocuments) {
      if (!doc?.tipo || !doc?.numeroDocumento) continue;
      map.set(String(doc.tipo).toUpperCase(), doc.numeroDocumento);
    }
    for (const [tipo, numeroDocumento] of Object.entries(optimisticByTipo)) {
      if (!tipo || !numeroDocumento) continue;
      map.set(tipo.toUpperCase(), numeroDocumento);
    }
    return map;
  }, [quoteData, optimisticByTipo]);

  const lifecycleByTipo = useMemo(() => {
    const map = new Map<string, string>();
    if (!quoteData) return map;
    map.set('PRESUPUESTO', quoteData.lifecycle.presupuesto);
    map.set('PEDIDO', quoteData.lifecycle.pedido);
    map.set('ALBARAN', quoteData.lifecycle.albaran);
    map.set('FACTURA', quoteData.lifecycle.factura);
    map.set('ABONO', quoteData.lifecycle.abono);
    return map;
  }, [quoteData]);

  const title = useMemo(() => {
    if (!row) return 'Documento';
    if (manualData) {
      return `${row.type} #${row.number}`;
    }
    if (!quoteData) return `${row.type} #${row.number}`;

    const label =
      effectiveTipo === 'PRESUPUESTO' ? 'Presupuesto'
        : effectiveTipo === 'PEDIDO' ? 'Pedido'
          : effectiveTipo === 'ALBARAN' ? 'Albarán'
            : effectiveTipo === 'FACTURA' ? 'Factura'
              : effectiveTipo === 'ABONO' ? 'Abono'
                : effectiveTipo;
    const number = existingByTipo.get(effectiveTipo) ?? lifecycleByTipo.get(effectiveTipo) ?? row.number;
    return `${label} #${number}`;
  }, [row, manualData, quoteData, effectiveTipo, existingByTipo, lifecycleByTipo]);

  const canEmit = (tipo: string): boolean => {
    if (!quoteData) return false;
    const t = tipo.toUpperCase();
    if (t === 'PRESUPUESTO') return false;
    if (t === 'PEDIDO') return true;
    if (t === 'ALBARAN') return existingByTipo.has('PEDIDO');
    if (t === 'FACTURA') return existingByTipo.has('ALBARAN');
    if (t === 'ABONO') return existingByTipo.has('FACTURA');
    return false;
  };

  const emitOpen = async (tipo: string): Promise<void> => {
    if (!quoteData || !row?.quoteId) return;
    const upper = tipo.toUpperCase();
    if (!canEmit(upper)) return;
    setIsConverting(true);
    try {
      let emittedNumber = existingByTipo.get(upper) ?? row.number;
      if (!existingByTipo.has(upper)) {
        const created = await emitQuoteDocument(row.quoteId, upper);
        setOptimisticByTipo(prev => ({
          ...prev,
          [String(created.tipo).toUpperCase()]: created.numeroDocumento,
        }));
        setActiveTipo(String(created.tipo).toUpperCase());
        emittedNumber = created.numeroDocumento;
      }
      onOpenPreview?.({
        ...row,
        type: upper as ProjectDocumentKind,
        number: emittedNumber,
        quoteId: row.quoteId,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo generar el documento.');
    } finally {
      setIsConverting(false);
    }
  };

  const primaryEmitTarget = useMemo(() => {
    if (!quoteData) return null;
    if (effectiveTipo === 'PEDIDO') return 'ALBARAN' as const;
    if (effectiveTipo === 'ALBARAN') return 'FACTURA' as const;
    return null;
  }, [quoteData, effectiveTipo]);

  const relatedCodesByTipo = useMemo(() => {
    if (!quoteData) return new Map<string, string>();
    const relatedTypes = ['PEDIDO', 'ALBARAN', 'FACTURA'] as const;
    return new Map(
      relatedTypes
        .filter(tipo => tipo !== effectiveTipo)
        .map((tipo) => [tipo, existingByTipo.get(tipo) ?? ''] as const)
        .filter(([, code]) => Boolean(code)),
    );
  }, [quoteData, effectiveTipo, existingByTipo]);

  // Reset navigation when opening a new document/quote.
  useEffect(() => {
    if (!row) return;
    setActiveTipo(row.type);
    setOptimisticByTipo({});
    setSubview('document');
    setIsEditing(false);
    setQuoteOverride(null);
  }, [row]);

  const handleView = async () => {
    if (!row) return;
    onOpenPreview?.(row);
  };

  const handleQuoteSave = () => {
    void (async () => {
      const updated = await quoteEdit.save();
      if (updated && row) {
        const updatedRow = toQuoteRowUpdate(row, updated);
        setQuoteOverride(updated);
        setIsEditing(false);
        onRowUpdated?.(updatedRow);
      }
    })();
  };

  const handleManualSave = () => {
    void (async () => {
      const updated = await manualEdit.save();
      if (updated) {
        setIsEditing(false);
        onRowUpdated?.(updated);
      }
    })();
  };

  const manualValues = manualEdit.draft
    ? {
        customerName: manualEdit.draft.customerName,
        type: manualEdit.draft.type,
        number: manualEdit.draft.number,
        statusLabel: manualData?.statusLabel ?? row?.statusLabel ?? '',
        createdAt: manualData?.createdAt ?? row?.createdAt ?? '',
      }
    : {
        customerName: manualData?.customerName ?? row?.customerName ?? '',
        type: toManualType(manualData?.type ?? row?.type ?? 'PEDIDO'),
        number: manualData?.number ?? row?.number ?? '',
        statusLabel: manualData?.statusLabel ?? row?.statusLabel ?? '',
        createdAt: manualData?.createdAt ?? row?.createdAt ?? '',
      };

  return (
    <DocumentDrawerShell open={open} onClose={onClose}>
      <DocumentDrawerHeader
        title={title}
        subtitle={row?.customerName ?? undefined}
        badge={effectiveTipo || row?.type || ''}
        subview={subview}
        onChangeSubview={setSubview}
        onClose={onClose}
        showSubviewToggle={Boolean(quoteData)}
        documentType={(effectiveTipo || row?.type || 'PEDIDO') as ProjectDocumentKind}
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-2" style={{ background: documentManagementTheme.panelSoftBg }}>
        {loading ? (
          <div className="px-3 py-4 text-sm font-semibold" style={{ color: documentManagementTheme.muted }}>
            Cargando…
          </div>
        ) : null}

        {error ? (
          <div className="px-3 py-3">
            <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#fecaca', background: '#fff1f2', color: '#9f1239' }}>
              {error}
            </div>
          </div>
        ) : null}

        {quoteData && row ? (
          subview === 'lines' ? null : (
            <>
            <ProposalDetailFrame className="document-detail-configurator-like min-h-full">
              <aside className="document-detail-legacy-cover bg-[#0d1117] p-5 text-white">
                <DocumentThumbnail type={(effectiveTipo || row.type) as ProjectDocumentKind} size="hero" />
                <div className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">Documento ALUON</div>
                <h3 className="mt-2 text-2xl font-black tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Configuración preparada para revisar, convertir y enviar a producción.</p>
                <div className="mt-8 border-t border-slate-700 pt-5 text-xs">
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Cliente</span><strong className="text-right">{row.customerName || '—'}</strong></div>
                  <div className="mt-3 flex justify-between gap-3"><span className="text-slate-400">Creado</span><strong>{new Date(row.createdAt).toLocaleDateString('es-ES')}</strong></div>
                  <div className="mt-3 flex justify-between gap-3"><span className="text-slate-400">Estado</span><strong className="text-blue-300">{row.statusLabel || '—'}</strong></div>
                </div>
              </aside>

              <section className="bg-[#f8f9fb] p-5 md:p-7">
                <DocumentThumbnail type={(effectiveTipo || row.type) as ProjectDocumentKind} size="md" />
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Ficha técnica</div>
                    <h3 className="mt-1 text-3xl font-black tracking-tight text-[#0d1117]">Datos del pedido</h3>
                    <p className="mt-1 text-sm text-slate-500">Información del cliente y líneas configuradas.</p>
                  </div>
                  <div className="hidden text-right text-xs text-slate-500 md:block"><div className="font-black uppercase tracking-widest">{quoteData.items.length} líneas</div><div className="mt-1">Vista operativa</div></div>
                </div>
                <div className="document-configurator-readonly">
                  <div>
                    <section>
                      <h4>1. Modelo disponible</h4>
                      <div className="document-model-card">
                        <DocumentThumbnail type={(effectiveTipo || row.type) as ProjectDocumentKind} size="lg" />
                        <div><strong>{quoteData.items[0]?.doorModel || 'Modelo del pedido'}</strong><span>{quoteData.items[0]?.productCategory || 'Producto configurado'}</span></div>
                      </div>
                    </section>
                    <section>
                      <h4>2. Color y acabado</h4>
                      <div className="document-choice-card"><span className="document-color-swatch" /><div><strong>{quoteData.items[0]?.colorCode || 'No especificado'}</strong><span>{quoteData.items[0]?.primerRequired ? 'Imprimación requerida' : 'Acabado registrado en el pedido'}</span></div></div>
                    </section>
                    <section>
                      <h4>3. Medidas</h4>
                      <div className="document-measure-grid"><div><span>Ancho total (mm)</span><strong>{quoteData.items[0]?.widthMm ?? '—'}</strong></div><div><span>Alto total (mm)</span><strong>{quoteData.items[0]?.heightMm ?? '—'}</strong></div><div><span>Holgura (mm)</span><strong>{quoteData.items[0]?.floorClearanceMm ?? '—'}</strong></div></div>
                    </section>
                  </div>
                  <div className="document-configurator-visual"><DocumentThumbnail type={(effectiveTipo || row.type) as ProjectDocumentKind} size="hero" /><div className="document-dimension-sketch"><span>{quoteData.items[0]?.widthMm ?? '—'} mm</span><strong>{quoteData.items[0]?.doorModel || 'Configuración del pedido'}</strong><span>{quoteData.items[0]?.heightMm ?? '—'} mm</span></div></div>
                </div>
                <DocumentDrawerMetaGrid
                  mode={isEditing ? 'edit' : 'read'}
                  values={quoteEdit.draft ?? { nombreComercial: '', contactEmail: '', telefono: '', direccionEntrega: '', direccion: '', cp: '', poblacion: '', provincia: '' }}
                  onChange={isEditing ? quoteEdit.patch : undefined}
                />
                <Section title="Líneas del pedido">
                  <DocumentDrawerLinesView items={quoteData.items} totals={quoteData.totals} formatEur={fmtEur} variant="embedded" onLineClick={() => void handleView()} />
                </Section>
              </section>

              <aside className="border-l border-slate-200 bg-white p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Resumen del pedido</div>
                <div className="mt-5 space-y-4 text-sm">
                  <div><div className="text-xs text-slate-400">Documento</div><div className="mt-1 font-black text-slate-900">{title}</div></div>
                  <div><div className="text-xs text-slate-400">Cliente</div><div className="mt-1 font-bold text-slate-900">{row.customerName || '—'}</div></div>
                  <div><div className="text-xs text-slate-400">Estado</div><div className="mt-1 font-black text-blue-700">{row.statusLabel || '—'}</div></div>
                </div>
                <div className="mt-8 border-t border-slate-200 pt-5"><DocumentDrawerTotalsPanel totals={quoteData.totals} formatEur={fmtEur} /></div>
                {relatedCodesByTipo.size > 0 ? <div className="mt-6 border-t border-slate-200 pt-5"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Documentos relacionados</div><div className="mt-3 space-y-2">{Array.from(relatedCodesByTipo.entries()).map(([tipo, code]) => <button key={tipo} type="button" onClick={() => { setActiveTipo(tipo); setSubview('document'); }} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-xs font-bold transition hover:border-blue-300 hover:bg-blue-50"><span>{tipo}</span><span className="text-blue-700">{code}</span></button>)}</div></div> : null}
              </aside>
            </ProposalDetailFrame>
            </>
          )
        ) : null}

        {manualData && row ? (
          <div className="document-manual-view px-3 py-2">
            <ProposalDetailFrame className="document-detail-configurator-like">
            <aside className="document-detail-legacy-cover bg-[#0d1117] p-5 text-white"><DocumentThumbnail type={row.type} size="hero" /><div className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Ficha del documento</div><div className="mt-1 text-xl font-black">{title}</div><div className="mt-1 text-sm text-slate-300">{row.customerName || 'Sin cliente'} · {row.statusLabel || 'Sin estado'}</div></aside>
            <section className="bg-[#f8f9fb] p-5 md:p-7"><DocumentThumbnail type={row.type} size="md" /><div className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Ficha técnica</div><h3 className="mt-1 text-3xl font-black tracking-tight text-[#0d1117]">Datos del documento</h3><p className="mt-1 text-sm text-slate-500">Información operativa y editable del documento.</p>
            <ManualDocumentDrawerPanel
              mode={isEditing ? 'edit' : 'read'}
              values={manualValues}
              onChange={isEditing ? manualEdit.patch : undefined}
            />
            </section><aside className="border-l border-slate-200 bg-white p-5"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Resumen del pedido</div><div className="mt-5 space-y-4 text-sm"><div><div className="text-xs text-slate-400">Documento</div><div className="mt-1 font-black text-slate-900">{title}</div></div><div><div className="text-xs text-slate-400">Cliente</div><div className="mt-1 font-bold text-slate-900">{row.customerName || '—'}</div></div><div><div className="text-xs text-slate-400">Estado</div><div className="mt-1 font-black text-blue-700">{row.statusLabel || '—'}</div></div></div></aside>
            </ProposalDetailFrame>
          </div>
        ) : null}
      </div>

      {quoteData && row ? (
        <DocumentDrawerFooter
          isConverting={isConverting}
          isEditing={isEditing}
          isSaving={quoteEdit.saving}
          saveError={quoteEdit.saveError}
          primaryEmitTarget={primaryEmitTarget}
          canEmit={(t) => canEmit(t)}
          onEmitOpen={(t) => void emitOpen(t)}
          onCancel={onClose}
          onEdit={() => setIsEditing(true)}
          onCancelEdit={() => {
            quoteEdit.reset();
            setIsEditing(false);
          }}
          onSave={handleQuoteSave}
          onPreview={() => void handleView()}
          relatedCodesByTipo={relatedCodesByTipo as Map<'PEDIDO' | 'ALBARAN' | 'FACTURA', string>}
          onNavigateRelated={(t) => {
            setActiveTipo(t);
            setSubview('document');
          }}
        />
      ) : null}

      {manualData && row ? (
        <ManualDocumentDrawerFooter
          isEditing={isEditing}
          isSaving={manualEdit.saving}
          saveError={manualEdit.saveError}
          onEdit={() => setIsEditing(true)}
          onCancelEdit={() => {
            manualEdit.reset();
            setIsEditing(false);
          }}
          onSave={handleManualSave}
          onCancel={onClose}
        />
      ) : null}
    </DocumentDrawerShell>
  );
};
