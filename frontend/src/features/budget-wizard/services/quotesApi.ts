import type { QuoteResponse } from '../../customer-onboarding/models';
import type { QuoteItemDraft } from '../BudgetWizard.types';

export type CreateQuotePayload = {
  customerId: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'BOTH';
  items: QuoteItemDraft[];
};

type QuoteItemRequestPayload = {
  doorModel: QuoteItemDraft['doorModel'];
  doorType: QuoteItemDraft['doorType'];
  productCategory: QuoteItemDraft['productCategory'];
  colorCode: QuoteItemDraft['colorCode'];
  primerRequired: QuoteItemDraft['primerRequired'];
  widthMm: QuoteItemDraft['widthMm'];
  heightMm: QuoteItemDraft['heightMm'];
  floorClearanceMm: QuoteItemDraft['floorClearanceMm'];
  larguero: QuoteItemDraft['larguero'];
  marcoSuperior: QuoteItemDraft['marcoSuperior'];
  bisagras: QuoteItemDraft['bisagras'];
  porteroAutomatico: QuoteItemDraft['porteroAutomatico'];
};

const readTextError = async (response: Response): Promise<string> => {
  try {
    const text = await response.text();
    return text || 'Error inesperado';
  } catch {
    return 'Error inesperado';
  }
};

export const createQuote = async (payload: CreateQuotePayload): Promise<QuoteResponse> => {
  const items: QuoteItemRequestPayload[] = payload.items.map(item => ({
    doorModel: item.doorModel,
    doorType: item.doorType,
    productCategory: item.productCategory,
    colorCode: item.colorCode,
    primerRequired: item.primerRequired,
    widthMm: item.widthMm,
    heightMm: item.heightMm,
    floorClearanceMm: item.floorClearanceMm,
    larguero: item.larguero,
    marcoSuperior: item.marcoSuperior,
    bisagras: item.bisagras,
    porteroAutomatico: item.porteroAutomatico,
  }));

  const response = await fetch('/api/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, items }),
  });
  if (!response.ok) throw new Error(await readTextError(response));
  return (await response.json()) as QuoteResponse;
};

export const sendQuote = async (id: string, channel: 'EMAIL' | 'WHATSAPP' | 'BOTH'): Promise<QuoteResponse> => {
  const response = await fetch(`/api/quotes/${id}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel }),
  });
  if (!response.ok) throw new Error(await readTextError(response));
  return (await response.json()) as QuoteResponse;
};

export type WorkOrderCreated = { id: string; codigoOrden: string };

export const convertQuoteToOrder = async (id: string): Promise<WorkOrderCreated> => {
  const response = await fetch(`/api/quotes/${encodeURIComponent(id)}/convert-to-order`, { method: 'POST' });
  if (!response.ok) throw new Error(await readTextError(response));
  return response.json() as Promise<WorkOrderCreated>;
};

export const duplicateQuote = async (id: string): Promise<QuoteResponse> => {
  const response = await fetch(`/api/quotes/${encodeURIComponent(id)}/duplicate`, { method: 'POST' });
  if (!response.ok) throw new Error(await readTextError(response));
  return response.json() as Promise<QuoteResponse>;
};

