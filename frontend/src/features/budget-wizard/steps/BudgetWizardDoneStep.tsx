import { useState, useEffect } from 'react';
import type { QuoteResponse } from '../../customer-onboarding/models';
import type { QuoteItemDraft } from '../BudgetWizard.types';
import AppDialog from '../../../components/feedback/AppDialog';
import { Customer360DocumentModal } from '../../customer-360/Customer360DocumentModal';
import type { Customer360DocumentItem } from '../../customer-360/customer360Types';
import { getQuoteWhatsappLink } from '../services/quoteWhatsappApi';
import { convertQuoteToOrder, duplicateQuote } from '../services/quotesApi';

type Props = {
  quote: QuoteResponse;
  submittedItems: QuoteItemDraft[];
  postFinalizeAction?: 'EMAIL' | 'WHATSAPP' | 'VIEW' | null;
  onNew: () => void;
  onSendChannel: (channel: 'EMAIL' | 'WHATSAPP' | 'BOTH') => Promise<void>;
  submitting: boolean;
};

export const BudgetWizardDoneStep = ({ quote, submittedItems, postFinalizeAction, onNew, onSendChannel, submitting }: Props) => {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [targetEmail, setTargetEmail] = useState(quote.contactEmail || '');
  const [sentStatus, setSentStatus] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Customer360DocumentItem | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [orderError, setOrderError] = useState('');
  const [duplicateNumber, setDuplicateNumber] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState('');

  const openPreviewModal = () => {
    setPreviewDocument({
      id: quote.id,
      type: 'PRESUPUESTO',
      number: quote.quoteNumber,
      statusLabel: String(quote.status),
      createdAt: quote.createdAt,
      quoteId: quote.id,
      customerName: quote.customerNombreComercial || quote.customerName,
      source: 'backend',
    });
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSentStatus('Enviando...');
      await onSendChannel('EMAIL');
      setSentStatus('¡Enviado con éxito!');
      setTimeout(() => setEmailModalOpen(false), 2000);
    } catch {
      setSentStatus('Error al enviar.');
    }
  };

  const handleSendWhatsapp = async () => {
    const popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
    try {
      await onSendChannel('WHATSAPP');
      const { url } = await getQuoteWhatsappLink(quote.id);
      if (popup) {
        popup.location.href = url;
        popup.focus();
      } else {
        window.location.href = url;
      }
    } catch {
      popup?.close();
      alert('Error al enviar por WhatsApp.');
    }
  };

  const handleConvertToOrder = async () => {
    setOrderError('');
    try {
      const order = await convertQuoteToOrder(quote.id);
      setOrderCode(order.codigoOrden);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'No se pudo crear la orden de trabajo.');
    }
  };

  const handleDuplicate = async () => {
    setDuplicateError('');
    try {
      const duplicate = await duplicateQuote(quote.id);
      setDuplicateNumber(duplicate.quoteNumber);
    } catch (error) {
      setDuplicateError(error instanceof Error ? error.message : 'No se pudo duplicar el presupuesto.');
    }
  };

  useEffect(() => {
    if (!postFinalizeAction) return;

    if (postFinalizeAction === 'EMAIL') {
      setEmailModalOpen(true);
    } else if (postFinalizeAction === 'WHATSAPP') {
      handleSendWhatsapp();
    } else if (postFinalizeAction === 'VIEW') {
      openPreviewModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postFinalizeAction]);

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-sm animate-bounce">
          <span className="material-symbols-outlined text-3xl font-black">done</span>
        </div>
        <h3 className="font-headline font-bold text-2xl text-on-surface mt-4">¡Presupuesto Generado!</h3>
        <p className="text-xs text-secondary mt-1">El presupuesto se ha guardado en tu cuenta.</p>
      </div>

      {/* Info Card */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5 space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-secondary font-bold uppercase tracking-wider">Nº Presupuesto</span>
          <span className="font-black text-on-surface bg-surface-container-high py-1 px-3 rounded-lg">
            {quote.quoteNumber}
          </span>
        </div>

        <div className="h-px bg-outline-variant/20" />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50 px-3 py-2 text-xs">
          <span className="font-semibold text-blue-900">Edición/versionado: este presupuesto puede clonarse como nueva revisión.</span>
          <button type="button" className="btn-ghost" onClick={() => void handleDuplicate()}>Duplicar presupuesto</button>
        </div>
        {duplicateNumber && <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">Nueva revisión creada: {duplicateNumber}</div>}
        {duplicateError && <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800">{duplicateError}</div>}

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-secondary font-bold block uppercase tracking-wider text-[10px]">Cliente</span>
            <span className="font-black text-on-surface mt-1 block">{quote.customerName}</span>
          </div>
          <div className="text-right">
            <span className="text-secondary font-bold block uppercase tracking-wider text-[10px]">Importe Total</span>
            <span className="text-lg font-black text-blue-600 mt-0.5 block">{quote.total.toFixed(2)} €</span>
          </div>
        </div>

        <div className="h-px bg-outline-variant/20" />

        <div className="flex justify-between items-center text-xs">
          <span className="text-secondary font-bold uppercase tracking-wider">Estado</span>
          <span className="font-black px-2.5 py-1 rounded-full uppercase tracking-widest text-[9px] bg-green-50 text-green-700">
            {quote.status}
          </span>
        </div>
      </div>

      {/* Detailed Budget Lines - "El Presupuesto Real" */}
      <div className="bg-surface rounded-3xl border border-outline-variant/35 p-5 space-y-4 shadow-sm print:border-none print:shadow-none">
        <h4 className="font-space font-black text-xs uppercase tracking-wider text-blue-600">Detalle del Presupuesto</h4>
        
        <div className="divide-y divide-outline-variant/20">
          {quote.items.map((item, idx) => {
            const submittedItem = submittedItems[idx];
            const familyLabel = submittedItem?.familyName ?? `Modelo ${item.doorModel}`;
            const childLabel = submittedItem?.childName ?? item.doorType.replace('_', ' ');

            return (
            <div key={idx} className="py-3.5 space-y-2 first:pt-0 last:pb-0">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest bg-blue-600/10 px-2 py-0.5 rounded-full">
                    Línea {idx + 1}
                  </span>
                  <div className="text-xs font-black text-on-surface mt-1.5 font-space">
                    {familyLabel} — {childLabel}
                  </div>
                  <div className="text-[10px] text-secondary mt-1 font-body">
                    Categoría: {item.productCategory.replace('_', ' ')} · Medidas: {item.widthMm} x {item.heightMm} mm ({item.m2.toFixed(2)} m²)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-on-surface font-space">
                    {item.lineTotal.toFixed(2)} €
                  </div>
                  <div className="text-[9px] text-secondary mt-0.5">
                    {item.pricePerM2.toFixed(2)} € / m²
                  </div>
                </div>
              </div>

              {/* Specs Badge list */}
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                <span className="text-[8px] font-bold text-secondary uppercase bg-surface-container px-2 py-0.5 rounded font-space flex items-center gap-1">
                  Color: {item.colorCode}
                  <div className="w-2 h-2 rounded-full border border-outline-variant/30" style={{ backgroundColor: item.colorCode }} />
                </span>
                {item.primerRequired && (
                  <span className="text-[8px] font-bold text-secondary uppercase bg-surface-container px-2 py-0.5 rounded font-space">
                    Imprimación
                  </span>
                )}
                {item.larguero && (
                  <span className="text-[8px] font-bold text-secondary uppercase bg-surface-container px-2 py-0.5 rounded font-space">
                    Larguero
                  </span>
                )}
                {item.marcoSuperior && (
                  <span className="text-[8px] font-bold text-secondary uppercase bg-surface-container px-2 py-0.5 rounded font-space">
                    Marco Sup.
                  </span>
                )}
                {item.bisagras && (
                  <span className="text-[8px] font-bold text-secondary uppercase bg-surface-container px-2 py-0.5 rounded font-space">
                    Apertura: Derecha
                  </span>
                )}
                {item.porteroAutomatico && (
                  <span className="text-[8px] font-bold text-secondary uppercase bg-surface-container px-2 py-0.5 rounded font-space">
                    Portero Auto.
                  </span>
                )}
              </div>
            </div>
            );
          })}
        </div>

        <div className="h-px bg-outline-variant/20 pt-1" />

        {/* Totals Summary */}
        <div className="flex justify-between items-center text-xs font-space pt-1">
          <span className="text-secondary font-black uppercase tracking-wider">Subtotal</span>
          <span className="font-bold text-on-surface">{(quote.total / 1.21).toFixed(2)} €</span>
        </div>
        <div className="flex justify-between items-center text-xs font-space">
          <span className="text-secondary font-black uppercase tracking-wider">I.V.A. (21%)</span>
          <span className="font-bold text-on-surface">{(quote.total - (quote.total / 1.21)).toFixed(2)} €</span>
        </div>
        <div className="flex justify-between items-center text-sm font-space pt-1.5 border-t border-dashed border-outline-variant/30">
          <span className="text-on-surface font-black uppercase tracking-wider">Total Presupuestado</span>
          <span className="text-base font-black text-blue-600">{quote.total.toFixed(2)} €</span>
        </div>
      </div>

      {/* Share / Action Buttons */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase tracking-widest text-secondary font-bold block">Compartir o Descargar</span>

        <div className="grid grid-cols-2 gap-3">
          {/* Email Button */}
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-outline-variant bg-surface text-on-surface hover:bg-surface-container font-black text-xs uppercase tracking-wider transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">mail</span>
            Email
          </button>

          {/* WhatsApp Button */}
          <button
            type="button"
            onClick={handleSendWhatsapp}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-outline-variant bg-surface text-on-surface hover:bg-surface-container font-black text-xs uppercase tracking-wider transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-green-600">chat</span>
            WhatsApp
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Print Button */}
          <button
            type="button"
            onClick={openPreviewModal}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-outline-variant bg-surface text-on-surface hover:bg-surface-container font-black text-xs uppercase tracking-wider transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            Ver documento
          </button>

          {/* New Budget Button */}
          <button
            type="button"
            onClick={onNew}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-on-surface hover:bg-on-surface/90 text-surface font-black text-xs uppercase tracking-wider transition-colors shadow-sm"
          >
            Nuevo Flujo
          </button>
        </div>

        {(quote.status === 'VALIDADO' || quote.status === 'ENVIADO') && !orderCode && (
          <button type="button" onClick={handleConvertToOrder} className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">assignment</span>
            Convertir en orden de trabajo
          </button>
        )}
        {orderCode && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-xs font-black text-green-800">Orden creada correctamente: {orderCode}</div>}
        {orderError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{orderError}</div>}
      </div>

      {/* Email Modal overlay */}
      <AppDialog
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Enviar por email"
        subtitle="Introduce el correo electrónico."
        maxWidthClassName="max-w-sm"
        actions={
          <>
            <button
              type="button"
              onClick={() => setEmailModalOpen(false)}
              className="px-4 py-2 border border-outline-variant/30 text-secondary hover:bg-surface-container rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="email-form"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar'}
            </button>
          </>
        }
      >
        <form id="email-form" onSubmit={handleSendEmail} className="space-y-4">
          <input
            type="email"
            required
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary outline-none"
            placeholder="correo@ejemplo.com"
            value={targetEmail}
            onChange={e => setTargetEmail(e.target.value)}
          />

          {sentStatus && (
            <div className="text-[10px] font-semibold text-center text-blue-600">
              {sentStatus}
            </div>
          )}
        </form>
      </AppDialog>

      <Customer360DocumentModal
        open={Boolean(previewDocument)}
        document={previewDocument}
        onOpenDocument={setPreviewDocument}
        onClose={() => setPreviewDocument(null)}
      />
    </div>
  );
};
