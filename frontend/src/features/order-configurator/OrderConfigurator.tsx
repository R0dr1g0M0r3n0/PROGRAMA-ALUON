import { useEffect, useMemo, useState } from 'react';
import { useCustomers } from '../../hooks/useCustomers';
import { listCatalogFamilies } from '../work-orders/services/catalogModelsApi';
import { buildCatalogModelOptions, type CatalogModelOption } from '../work-orders/utils/catalogModels';
import { getOrderConfiguration, getOrderConfigurationHistory, listOrderConfigurations, saveOrderConfiguration, updateOrderConfiguration, type OrderConfigurationAudit, type SavedOrderConfiguration } from './orderConfiguratorApi';
import { listConfigCatalogOptions, listConfigCatalogRules, validateConfigCatalog, type ConfigCatalogOption, type ConfigCatalogRule } from './catalogRulesApi';
import { openBudgetWizardForCustomer } from '../budget-wizard/services/budgetWizardLaunch';
import OrderConfiguratorSketch from './OrderConfiguratorSketch';

type ProductType = 'PUERTA_PEATONAL' | 'ABATIBLE_UNA' | 'ABATIBLE_DOS' | 'CORREDERA' | 'VALLA';
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type GuideSystem = 'INTERIOR_ROLLERS_U' | 'BRIDGE_ROLLERS';
type FenceVerticalLabel = 'ALTO' | 'ANCHO';
type FenceSection = { widthMm: number; heightMm: number; encounterType: 'NONE' | 'INNER' | 'OUTER'; staggered: boolean };
type Config = {
  customerId: string;
  customerName: string;
  reference: string;
  quoteDate: string;
  productType: ProductType;
  model: string;
  color: string;
  finish: string;
  useMode: 'MANUAL' | 'PREPARED' | 'MOTORIZED';
  hingeSide: 'LEFT' | 'RIGHT' | '';
  openingSide: 'LEFT' | 'RIGHT';
  angleDeg: number;
  activeLeaf: 'LEFT' | 'RIGHT' | '';
  leftLeafWidthMm: number;
  rightLeafWidthMm: number;
  sideCollectionMm: number;
  railType: 'CARRIL_16' | 'CARRIL_20';
  mountingType: 'A' | 'B';
  guideSystem: GuideSystem;
  selectedSketch: string;
  heightMm: number;
  widthMm: number;
  freePassageWidthMm: number;
  freePassageHeightMm: number;
  clearOpeningWidthMm: number;
  clearOpeningHeightMm: number;
  finishedLeafWidthMm: number;
  finishedLeafHeightMm: number;
  mountingDistanceMm: number;
  lateralClearanceMm: number;
  groundClearanceMm: number;
  handleType: 'PULL' | 'LEVER';
  lockType: 'MECHANICAL' | 'ELECTRIC';
  exteriorPullWidthMm: number;
  exteriorPullHeightMm: number;
  interiorHandleMaterial: 'INOX';
  lockConfiguration: 'LATCH_PALLET_ONE_TURN';
  groundClearanceOption: '1' | '2' | '3' | '4' | '5' | 'OTHER';
  installerName: string;
  installation: 'BETWEEN_PILLARS' | 'BEHIND_WALL' | 'SUPPORTS';
  electricStrike: boolean;
  automaticDoorPhone: boolean;
  sections: FenceSection[];
  verticalDimensionLabel: FenceVerticalLabel;
  selectedFenceSection: number;
  supportType: 'POST' | 'WALL' | 'CORNER';
  motorIncluded: boolean;
  rackType: 'STANDARD' | 'HEAVY_DUTY';
  stopType: 'MECHANICAL' | 'MAGNETIC';
  cornerType: 'NONE' | 'INNER' | 'OUTER';
  staggered: boolean;
  postsIncluded: boolean;
  notes: string;
  generatedDocuments: Array<{ name: string; type: string; generatedAt: string; contentBase64?: string; mimeType?: string }>;
};

const initialConfig: Config = {
  customerId: '', customerName: '', reference: '', quoteDate: new Date().toISOString().slice(0, 10), productType: 'PUERTA_PEATONAL', model: 'CLASSIC',
  color: '', finish: '', useMode: 'MANUAL', hingeSide: '', heightMm: 2000, widthMm: 900,
  freePassageWidthMm: 840, freePassageHeightMm: 1950, handleType: 'PULL', lockType: 'MECHANICAL',
  exteriorPullWidthMm: 30, exteriorPullHeightMm: 550, interiorHandleMaterial: 'INOX',
  lockConfiguration: 'LATCH_PALLET_ONE_TURN', groundClearanceOption: '1', installerName: '',
  clearOpeningWidthMm: 900, clearOpeningHeightMm: 2000, finishedLeafWidthMm: 880, finishedLeafHeightMm: 1980,
  mountingDistanceMm: 100, lateralClearanceMm: 50,
  openingSide: 'LEFT', angleDeg: 90, activeLeaf: 'LEFT', leftLeafWidthMm: 1500, rightLeafWidthMm: 1500,
  sideCollectionMm: 3500, railType: 'CARRIL_16', mountingType: 'A', guideSystem: 'INTERIOR_ROLLERS_U', selectedSketch: 'SLIDING_GUIDE_INTERIOR_U', groundClearanceMm: 1,
  installation: 'BETWEEN_PILLARS', electricStrike: false, automaticDoorPhone: false,
  sections: [{ widthMm: 2000, heightMm: 1200, encounterType: 'NONE', staggered: false }], verticalDimensionLabel: 'ALTO', selectedFenceSection: 0, notes: '',
  supportType: 'POST', motorIncluded: false, rackType: 'STANDARD', stopType: 'MECHANICAL',
  cornerType: 'NONE', staggered: false, postsIncluded: true,
  generatedDocuments: [],
};

const products: { id: ProductType; label: string; description: string }[] = [
  { id: 'PUERTA_PEATONAL', label: 'Puerta peatonal', description: 'Configurador prioritario · apertura interior' },
  { id: 'ABATIBLE_UNA', label: 'Abatible una hoja', description: 'Medidas, apertura y automatización' },
  { id: 'ABATIBLE_DOS', label: 'Abatible dos hojas', description: 'Hojas, reparto y secuencia de cierre' },
  { id: 'CORREDERA', label: 'Corredera', description: 'Hoja, recogida, carril y montaje' },
  { id: 'VALLA', label: 'Valla', description: 'Tramos dinámicos numerados' },
];

const steps = ['Producto', 'Datos generales', 'Fabricación', 'Medidas', 'Observaciones', 'Revisión'];

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador', PENDING_REVIEW: 'Pendiente de revisar', CONFIRMED: 'Confirmado',
  IN_PRODUCTION: 'En fabricación', FINALIZED: 'Finalizado', CANCELLED: 'Anulado',
};

const normalizeFenceSections = (value: unknown, legacyCornerType: Config['cornerType'] = 'NONE', legacyStaggered = false): FenceSection[] => {
  if (!Array.isArray(value) || value.length === 0) return [{ widthMm: 2000, heightMm: 1200, encounterType: legacyCornerType, staggered: legacyStaggered }];
  return value.slice(0, 8).map(section => {
    const item = (section || {}) as Partial<FenceSection>;
    return {
      widthMm: Number(item.widthMm ?? 0),
      heightMm: Number(item.heightMm ?? 0),
      encounterType: item.encounterType === 'INNER' || item.encounterType === 'OUTER' ? item.encounterType : legacyCornerType,
      staggered: Boolean(item.staggered ?? legacyStaggered),
    };
  });
};

const hydrateConfig = (value: Partial<Config>): Config => ({
  ...initialConfig,
  ...value,
  sections: normalizeFenceSections(value.sections, value.cornerType, value.staggered),
  verticalDimensionLabel: value.verticalDimensionLabel === 'ANCHO' ? 'ANCHO' : 'ALTO',
  selectedFenceSection: Math.max(0, Math.min(Number(value.selectedFenceSection ?? 0), normalizeFenceSections(value.sections, value.cornerType, value.staggered).length - 1)),
});

type ConfigUpdater = <K extends keyof Config>(key: K, value: Config[K]) => void;

const modelPreview = (model: CatalogModelOption): string => {
  const key = model.technicalModel.toUpperCase();
  if (key.includes('VEN')) return '/ideas/aluon/images/aluonVeneciana.jpg';
  if (key.includes('INOX')) return '/ideas/aluon/images/aluonInox.jpg';
  if (key.includes('PREMIUM') || key.includes('LUX')) return '/ideas/aluon/images/aluonPremium.jpg';
  return '/ideas/aluon/images/aluonClassic.jpg';
};

const ProposalOneDataStep = ({
  config,
  update,
  models,
  catalogOptions,
  isFence,
  customerName,
}: {
  config: Config;
  update: ConfigUpdater;
  models: CatalogModelOption[];
  catalogOptions: Record<string, ConfigCatalogOption[]>;
  isFence: boolean;
  customerName: string;
}) => {
  const selectedModel = models.find(option => option.technicalModel === config.model) ?? models[0];
  const colorOptions = catalogOptions.COLOR ?? [];
  return (
    <div className="proposal-one-step">
      <div className="proposal-one-heading">
        <div>
          <h2>Datos del pedido</h2>
          <p>Selecciona el modelo, define sus características y añade las medidas.</p>
        </div>
        <div className="proposal-one-reference">{config.reference || 'Nuevo pedido'}{customerName ? ` · ${customerName}` : ''}</div>
      </div>
      <div className="proposal-one-content">
        <div className="proposal-one-form">
          <section>
            <h3>1. Modelo disponible</h3>
            <div className="proposal-one-models">
              {models.map(option => (
                <button type="button" key={option.technicalModel} className={`proposal-one-model ${config.model === option.technicalModel ? 'is-selected' : ''}`} onClick={() => update('model', option.technicalModel)} aria-pressed={config.model === option.technicalModel}>
                  <span className="proposal-one-model-image"><img src={modelPreview(option)} alt="" /></span>
                  <strong>{option.label}</strong>
                  <span>{option.description || 'Modelo disponible'}</span>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>2. Color</h3>
            <div className="proposal-one-colors">
              {colorOptions.length > 0 ? colorOptions.map(option => (
                <button type="button" key={option.id} className={`proposal-one-color ${config.color === option.code ? 'is-selected' : ''}`} onClick={() => update('color', option.code)} aria-pressed={config.color === option.code}>
                  <span className="proposal-one-swatch" style={{ backgroundColor: option.code?.startsWith('#') ? option.code : undefined }} />
                  <strong>{option.label}</strong><small>{option.code}</small>
                </button>
              )) : <label className="proposal-one-inline-field">Color<input className="field" value={config.color} onChange={event => update('color', event.target.value)} placeholder="RAL 7016" /></label>}
            </div>
          </section>
          <section>
            <h3>3. Medidas</h3>
            <div className="proposal-one-note">Indica las medidas totales del hueco. Las dimensiones finales se ajustarán según el sistema de instalación.</div>
            <div className="proposal-one-measures">
              <label className="field-label">Ancho total (mm)<input className="field" type="number" min="1" value={isFence ? config.sections[0]?.widthMm ?? 0 : config.widthMm} onChange={event => update('widthMm', Number(event.target.value))} /></label>
              <label className="field-label">Alto total (mm)<input className="field" type="number" min="1" value={config.heightMm} onChange={event => update('heightMm', Number(event.target.value))} /></label>
              <label className="field-label">Profundidad (mm)<input className="field" type="number" min="1" value={config.mountingDistanceMm} onChange={event => update('mountingDistanceMm', Number(event.target.value))} /></label>
            </div>
          </section>
          <section>
            <h3>4. Observaciones <span>(opcional)</span></h3>
            <textarea className="field proposal-one-notes" value={config.notes} onChange={event => update('notes', event.target.value)} placeholder="Añade información relevante para la fabricación o instalación…" />
          </section>
        </div>
        <div className="proposal-one-visuals">
          <div className="proposal-one-hero"><img src={selectedModel ? modelPreview(selectedModel) : '/ideas/aluon/images/aluonClassic.jpg'} alt="Vista previa del modelo seleccionado" /></div>
          <div className="proposal-one-sketch"><OrderConfiguratorSketch widthMm={isFence ? config.sections[0]?.widthMm ?? 0 : config.widthMm} heightMm={config.heightMm} groundClearanceMm={config.groundClearanceMm} hingeSide={config.hingeSide || 'LEFT'} openingSide={config.openingSide} productType={config.productType} modelLabel={selectedModel?.label} /><span>Vista frontal · Medidas en milímetros</span></div>
        </div>
      </div>
    </div>
  );
};

const ProposalOneStepper = ({ step, reviewStep, setStep }: { step: Step; reviewStep: Step; setStep: (value: Step) => void }) => {
  const current = step <= 2 ? 1 : step <= 4 ? 2 : step === 5 ? 3 : 4;
  const items: Array<{ label: string; target: Step }> = [
    { label: 'Datos del pedido', target: 2 },
    { label: 'Configuración', target: 3 },
    { label: 'Accesorios', target: 5 },
    { label: 'Revisión', target: reviewStep },
  ];
  return <nav className="proposal-one-stepper" aria-label="Progreso del pedido"><ol>{items.map((item, index) => { const number = index + 1; return <li key={item.label} className={current === number ? 'is-active' : current > number ? 'is-complete' : ''}><button type="button" onClick={() => setStep(item.target)} aria-current={current === number ? 'step' : undefined}><span>{current > number ? '✓' : number}</span>{item.label}</button>{index < items.length - 1 && <i aria-hidden="true" />}</li>; })}</ol></nav>;
};

const SpecificMeasurements = ({ config, update, selectedFenceSection, setSelectedFenceSection }: { config: Config; update: ConfigUpdater; selectedFenceSection: number; setSelectedFenceSection: (value: number) => void }) => {
  if (config.productType === 'PUERTA_PEATONAL') return (
    <>
      <label className="field-label">Anchura exterior (mm)<input className="field mt-1" type="number" min="1" value={config.widthMm} onChange={e => update('widthMm', Number(e.target.value))} /></label>
      <label className="field-label">Altura exterior (mm)<input className="field mt-1" type="number" min="1" value={config.heightMm} onChange={e => update('heightMm', Number(e.target.value))} /></label>
      <label className="field-label">Hueco libre ancho (mm)<input className="field mt-1" type="number" min="1" value={config.clearOpeningWidthMm} onChange={e => update('clearOpeningWidthMm', Number(e.target.value))} /></label>
      <label className="field-label">Hueco libre alto (mm)<input className="field mt-1" type="number" min="1" value={config.clearOpeningHeightMm} onChange={e => update('clearOpeningHeightMm', Number(e.target.value))} /></label>
      <label className="field-label">Paso libre ancho (mm)<input className="field mt-1" type="number" min="1" value={config.freePassageWidthMm} onChange={e => update('freePassageWidthMm', Number(e.target.value))} /></label>
      <label className="field-label">Paso libre alto (mm)<input className="field mt-1" type="number" min="1" value={config.freePassageHeightMm} onChange={e => update('freePassageHeightMm', Number(e.target.value))} /></label>
      <label className="field-label">Holgura con el suelo<select className="field mt-1" value={config.groundClearanceOption} onChange={e => { const option = e.target.value as Config['groundClearanceOption']; update('groundClearanceOption', option); if (option !== 'OTHER') update('groundClearanceMm', Number(option)); }}><option value="">Seleccionar holgura</option><option value="1">1 mm</option><option value="2">2 mm</option><option value="3">3 mm</option><option value="4">4 mm</option><option value="5">5 mm</option><option value="OTHER">Otra</option></select></label>
      {config.groundClearanceOption === 'OTHER' && <label className="field-label">Otra holgura (mm)<input className="field mt-1" type="number" min="0.1" step="0.1" value={config.groundClearanceMm || ''} onChange={e => update('groundClearanceMm', Number(e.target.value))} /></label>}
      <fieldset className="md:col-span-2 rounded-xl border border-slate-200 p-4"><legend className="field-label px-1">Bisagra <span className="text-rose-600">*</span></legend><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.hingeSide === 'LEFT' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="pedestrian-hinge-side" value="LEFT" checked={config.hingeSide === 'LEFT'} onChange={() => { update('hingeSide', 'LEFT'); update('openingSide', 'LEFT'); }} /> Izquierda</label><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.hingeSide === 'RIGHT' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="pedestrian-hinge-side" value="RIGHT" checked={config.hingeSide === 'RIGHT'} onChange={() => { update('hingeSide', 'RIGHT'); update('openingSide', 'RIGHT'); }} /> Derecha</label></div><p className="mt-2 text-xs text-slate-500">Selección exclusiva. La puerta abre hacia el interior.</p></fieldset>
      <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-900">Apertura: hacia el interior · Vista de referencia: interior</div>
    </>
  );
  if (config.productType === 'ABATIBLE_UNA') return (
    <>
      <label className="field-label">Anchura de hoja (mm)<input className="field mt-1" type="number" min="1" value={config.widthMm} onChange={e => update('widthMm', Number(e.target.value))} /></label>
      <label className="field-label">Altura de hoja (mm)<input className="field mt-1" type="number" min="1" value={config.heightMm} onChange={e => update('heightMm', Number(e.target.value))} /></label>
      <label className="field-label">Holgura con el suelo<select className="field mt-1" value={config.groundClearanceOption} onChange={e => { const option = e.target.value as Config['groundClearanceOption']; update('groundClearanceOption', option); if (option !== 'OTHER') update('groundClearanceMm', Number(option)); }}><option value="">Seleccionar holgura</option><option value="1">1 mm</option><option value="2">2 mm</option><option value="3">3 mm</option><option value="4">4 mm</option><option value="5">5 mm</option><option value="OTHER">Otra</option></select></label>
      {config.groundClearanceOption === 'OTHER' && <label className="field-label">Otra holgura (mm)<input className="field mt-1" type="number" min="0.1" step="0.1" value={config.groundClearanceMm || ''} onChange={e => update('groundClearanceMm', Number(e.target.value))} /></label>}
      <fieldset className="md:col-span-2 rounded-xl border border-slate-200 p-4"><legend className="field-label px-1">Bisagra <span className="text-rose-600">*</span></legend><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.hingeSide === 'LEFT' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="single-leaf-hinge-side" value="LEFT" checked={config.hingeSide === 'LEFT'} onChange={() => { update('hingeSide', 'LEFT'); update('openingSide', 'LEFT'); }} /> Izquierda</label><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.hingeSide === 'RIGHT' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="single-leaf-hinge-side" value="RIGHT" checked={config.hingeSide === 'RIGHT'} onChange={() => { update('hingeSide', 'RIGHT'); update('openingSide', 'RIGHT'); }} /> Derecha</label></div><p className="mt-2 text-xs text-slate-500">Selección exclusiva · apertura hacia el interior · vista interior.</p></fieldset>
      <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-900">Croquis: hoja única en vista interior · la apertura y las cotas se actualizan con la bisagra.</div>
    </>
  );
  if (config.productType === 'ABATIBLE_DOS') return (
    <>
      <label className="field-label">Anchura total (mm)<input className="field mt-1" type="number" min="1" value={config.widthMm} onChange={e => update('widthMm', Number(e.target.value))} /></label>
      <label className="field-label">Altura total (mm)<input className="field mt-1" type="number" min="1" value={config.heightMm} onChange={e => update('heightMm', Number(e.target.value))} /></label>
      <label className="field-label">Holgura con el suelo<select className="field mt-1" value={config.groundClearanceOption} onChange={e => { const option = e.target.value as Config['groundClearanceOption']; update('groundClearanceOption', option); if (option !== 'OTHER') update('groundClearanceMm', Number(option)); }}><option value="">Seleccionar holgura</option><option value="1">1 mm</option><option value="2">2 mm</option><option value="3">3 mm</option><option value="4">4 mm</option><option value="5">5 mm</option><option value="OTHER">Otra</option></select></label>
      {config.groundClearanceOption === 'OTHER' && <label className="field-label">Otra holgura (mm)<input className="field mt-1" type="number" min="0.1" step="0.1" value={config.groundClearanceMm || ''} onChange={e => update('groundClearanceMm', Number(e.target.value))} /></label>}
      <fieldset className="md:col-span-2 rounded-xl border border-slate-200 p-4"><legend className="field-label px-1">Primera hoja de apertura <span className="text-rose-600">*</span></legend><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.activeLeaf === 'LEFT' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="double-leaf-first-opening" checked={config.activeLeaf === 'LEFT'} onChange={() => { update('activeLeaf', 'LEFT'); update('openingSide', 'LEFT'); }} /> Hoja izquierda</label><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.activeLeaf === 'RIGHT' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="double-leaf-first-opening" checked={config.activeLeaf === 'RIGHT'} onChange={() => { update('activeLeaf', 'RIGHT'); update('openingSide', 'RIGHT'); }} /> Hoja derecha</label></div><p className="mt-2 text-xs text-slate-500">Selección exclusiva. El reparto entre hoja activa y pasiva queda pendiente de confirmación ALUON.</p></fieldset>
      <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-900">Croquis: dos hojas en vista interior · la primera hoja de apertura queda resaltada.</div>
    </>
  );
  if (config.productType === 'CORREDERA') return (
    <>
      <label className="field-label">Altura terminada desde el suelo (mm)<input className="field mt-1" type="number" min="1" value={config.heightMm} onChange={e => update('heightMm', Number(e.target.value))} /></label>
      <label className="field-label">Anchura de hoja (mm)<input className="field mt-1" type="number" min="1" value={config.widthMm} onChange={e => update('widthMm', Number(e.target.value))} /></label>
      <label className="field-label">Carril<select className="field mt-1" value={config.railType} onChange={e => update('railType', e.target.value as Config['railType'])}><option value="CARRIL_16">Carril Ø16 mm</option><option value="CARRIL_20">Carril Ø20 mm</option></select></label>
      <label className="field-label">Espacio lateral de recogida (mm)<input className="field mt-1" type="number" min="1" value={config.sideCollectionMm} onChange={e => update('sideCollectionMm', Number(e.target.value))} /></label>
      <label className="field-label">Hueco libre ancho (mm)<input className="field mt-1" type="number" min="1" value={config.clearOpeningWidthMm} onChange={e => update('clearOpeningWidthMm', Number(e.target.value))} /></label>
      <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">La altura se mide desde el suelo hasta la puerta terminada. Las cotas de 5,5 cm, 8 cm y 25 cm se muestran según el sistema de guía seleccionado.</div>
    </>
  );
  if (config.productType === 'VALLA') {
    const selected = config.sections[selectedFenceSection] ?? config.sections[0];
    const updateSection = (index: number, patch: Partial<FenceSection>) => update('sections', config.sections.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
    const selectSection = (index: number) => { setSelectedFenceSection(index); update('selectedFenceSection', index); };
    const addSection = () => { if (config.sections.length >= 8) return; const next = [...config.sections, { widthMm: 2000, heightMm: 1200, encounterType: 'NONE' as const, staggered: false }]; update('sections', next); selectSection(next.length - 1); };
    const duplicateSection = () => { if (config.sections.length >= 8 || !selected) return; const next = [...config.sections]; next.splice(selectedFenceSection + 1, 0, { ...selected }); update('sections', next); selectSection(selectedFenceSection + 1); };
    const removeSection = () => { if (config.sections.length <= 1) return; const next = config.sections.filter((_, index) => index !== selectedFenceSection); const nextIndex = Math.min(selectedFenceSection, next.length - 1); update('sections', next); selectSection(nextIndex); };
    const verticalLabel = config.verticalDimensionLabel === 'ANCHO' ? 'Ancho' : 'Alto';
    return <div className="md:col-span-2 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><span className="field-label mb-0">Tramos de valla</span><p className="text-xs text-slate-500">Seleccionado: V{selectedFenceSection + 1} · máximo 8 tramos</p></div><div className="flex gap-2"><button type="button" className="btn-ghost text-xs" onClick={duplicateSection} disabled={config.sections.length >= 8}>Duplicar tramo</button><button type="button" className="btn-primary text-xs" onClick={addSection} disabled={config.sections.length >= 8}>Añadir tramo ({config.sections.length}/8)</button></div></div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tramos de valla">{config.sections.map((section, index) => <button key={`section-tab-${index}`} type="button" role="tab" aria-selected={selectedFenceSection === index} className={`rounded-xl border px-3 py-2 text-xs font-black ${selectedFenceSection === index ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white'}`} onClick={() => selectSection(index)}>V{index + 1} · {section.widthMm || '—'}×{section.heightMm || '—'}</button>)}</div>
      {selected && <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-black">Tramo V{selectedFenceSection + 1}</h3><button type="button" className="btn-ghost px-3 py-1 text-xs" onClick={removeSection} disabled={config.sections.length === 1}>Eliminar tramo</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="field-label">Anchura (mm)<input className="field mt-1" type="number" min="1" value={selected.widthMm} onChange={e => updateSection(selectedFenceSection, { widthMm: Number(e.target.value) })} /></label><label className="field-label">{verticalLabel} vertical (mm)<input className="field mt-1" type="number" min="1" value={selected.heightMm} onChange={e => updateSection(selectedFenceSection, { heightMm: Number(e.target.value) })} /></label><label className="field-label">Nomenclatura vertical<select className="field mt-1" value={config.verticalDimensionLabel} onChange={e => update('verticalDimensionLabel', e.target.value as FenceVerticalLabel)}><option value="ALTO">Alto (pendiente ALUON)</option><option value="ANCHO">Ancho (pendiente ALUON)</option></select></label><label className="field-label">Tipo de encuentro (si está definido)<select className="field mt-1" value={selected.encounterType} onChange={e => updateSection(selectedFenceSection, { encounterType: e.target.value as FenceSection['encounterType'] })}><option value="NONE">No definido</option><option value="INNER">Esquina interior</option><option value="OUTER">Esquina exterior</option></select></label><label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-bold"><input type="checkbox" checked={selected.staggered} onChange={e => updateSection(selectedFenceSection, { staggered: e.target.checked })} /> Escalonamiento (opción de catálogo)</label></div></div>}
      <p className="text-xs text-slate-500">El croquis muestra el tramo seleccionado y sus dos cotas. Las opciones de encuentro y escalonamiento quedan parametrizadas para validación ALUON.</p>
    </div>;
  }
  return (
    <>
      <label className="field-label">Anchura total (mm)<input className="field mt-1" type="number" min="1" value={config.widthMm} onChange={e => update('widthMm', Number(e.target.value))} /></label>
      <label className="field-label">Altura total (mm)<input className="field mt-1" type="number" min="1" value={config.heightMm} onChange={e => update('heightMm', Number(e.target.value))} /></label>
      <label className="field-label">Holgura inferior (mm)<input className="field mt-1" type="number" min="0" value={config.groundClearanceMm} onChange={e => update('groundClearanceMm', Number(e.target.value))} /></label>
      <label className="field-label">Mano de bisagra<select className="field mt-1" value={config.hingeSide} onChange={e => update('hingeSide', e.target.value as Config['hingeSide'])}><option value="LEFT">Izquierda</option><option value="RIGHT">Derecha</option></select></label>
    </>
  );
};

const SlidingAutomationStep = ({ config, update }: { config: Config; update: ConfigUpdater }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <fieldset className="rounded-xl border border-amber-200 bg-amber-50 p-4 md:col-span-2"><legend className="field-label px-1">Automatización</legend><div className="mb-2 text-sm font-black text-amber-900">Estado: Preparada para automatizar</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.motorIncluded ? 'border-amber-600 bg-white' : 'border-slate-200 bg-white'}`}><input type="radio" name="sliding-automation" checked={config.motorIncluded} onChange={() => { update('motorIncluded', true); update('useMode', 'PREPARED'); }} /> Automatización: Sí</label><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${!config.motorIncluded ? 'border-amber-600 bg-white' : 'border-slate-200 bg-white'}`}><input type="radio" name="sliding-automation" checked={!config.motorIncluded} onChange={() => { update('motorIncluded', false); update('useMode', 'PREPARED'); }} /> Automatización: No</label></div></fieldset>
    <fieldset className="rounded-xl border border-slate-200 p-4 md:col-span-2"><legend className="field-label px-1">Sentido de apertura <span className="text-rose-600">*</span></legend><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.openingSide === 'LEFT' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="sliding-opening-side" checked={config.openingSide === 'LEFT'} onChange={() => update('openingSide', 'LEFT')} /> Izquierda</label><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.openingSide === 'RIGHT' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="sliding-opening-side" checked={config.openingSide === 'RIGHT'} onChange={() => update('openingSide', 'RIGHT')} /> Derecha</label></div><p className="mt-2 text-xs text-slate-500">Selección exclusiva; no se pueden seleccionar ambos sentidos.</p></fieldset>
  </div>
);

const SlidingMountingGuideStep = ({ config, update }: { config: Config; update: ConfigUpdater }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <fieldset className="rounded-xl border border-slate-200 p-4"><legend className="field-label px-1">Montaje <span className="text-rose-600">*</span></legend><div className="space-y-2"><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.mountingType === 'A' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="sliding-mounting" checked={config.mountingType === 'A'} onChange={() => update('mountingType', 'A')} /> Montaje A</label><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.mountingType === 'B' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="sliding-mounting" checked={config.mountingType === 'B'} onChange={() => update('mountingType', 'B')} /> Montaje B</label></div><p className="mt-2 text-xs text-slate-500">Selección exclusiva. La compatibilidad con la guía queda pendiente de confirmación ALUON.</p></fieldset>
    <fieldset className="rounded-xl border border-slate-200 p-4"><legend className="field-label px-1">Sistema de guía y rodillos <span className="text-rose-600">*</span></legend><div className="space-y-2"><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.guideSystem === 'INTERIOR_ROLLERS_U' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="sliding-guide" checked={config.guideSystem === 'INTERIOR_ROLLERS_U'} onChange={() => { update('guideSystem', 'INTERIOR_ROLLERS_U'); update('selectedSketch', 'SLIDING_GUIDE_INTERIOR_U'); }} /> Rodillos interiores y carril en U</label><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.guideSystem === 'BRIDGE_ROLLERS' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="sliding-guide" checked={config.guideSystem === 'BRIDGE_ROLLERS'} onChange={() => { update('guideSystem', 'BRIDGE_ROLLERS'); update('selectedSketch', 'SLIDING_GUIDE_BRIDGE'); }} /> Puente y rodillos exterior e interior</label></div><p className="mt-2 text-xs text-slate-500">Esquema guardado: {config.selectedSketch}</p></fieldset>
    <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm"><div className="font-black text-blue-900">Cotas gráficas y referencias de fabricación</div><div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-blue-900"><div>Altura: desde el suelo hasta puerta terminada</div><div>Distancia mínima aplicable: {config.guideSystem === 'INTERIOR_ROLLERS_U' ? '5,5 cm' : '8 cm'}</div><div>Cota gráfica de fabricación: 25 cm</div></div></div>
  </div>
);

const SpecificOptions = ({ config, update }: { config: Config; update: ConfigUpdater }) => {
  return <>
    {config.productType !== 'VALLA' && config.productType !== 'CORREDERA' && <label className="field-label">Tipo de montaje<select className="field mt-1" value={config.mountingType} onChange={e => update('mountingType', e.target.value as Config['mountingType'])}><option value="A">Montaje A</option><option value="B">Montaje B</option></select></label>}
    {config.productType === 'PUERTA_PEATONAL' && <>
      <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-black uppercase tracking-wide text-slate-500">Herrajes definidos para puerta peatonal</div><div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"><div><span className="text-slate-500">Tirador exterior</span><div className="font-bold">30 mm × 550 mm de alto</div></div><div><span className="text-slate-500">Manilla interior</span><div className="font-bold">Inox</div></div><div><span className="text-slate-500">Cerradura</span><div className="font-bold">Pestillo y paletón · una vuelta de llave</div></div><div><span className="text-slate-500">Apertura</span><div className="font-bold">Hacia el interior</div></div></div></div>
      <input type="hidden" value={config.exteriorPullWidthMm} readOnly /><input type="hidden" value={config.exteriorPullHeightMm} readOnly /><input type="hidden" value={config.interiorHandleMaterial} readOnly /><input type="hidden" value={config.lockConfiguration} readOnly />
    </>}
    {config.productType === 'CORREDERA' && <>
      <label className="field-label">Cremallera<select className="field mt-1" value={config.rackType} onChange={e => update('rackType', e.target.value as Config['rackType'])}><option value="STANDARD">Estándar</option><option value="HEAVY_DUTY">Reforzada</option></select></label>
      <label className="field-label">Topes<select className="field mt-1" value={config.stopType} onChange={e => update('stopType', e.target.value as Config['stopType'])}><option value="MECHANICAL">Mecánicos</option><option value="MAGNETIC">Magnéticos</option></select></label>
    </>}
    {config.productType === 'VALLA' && <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-bold"><input type="checkbox" checked={config.postsIncluded} onChange={e => update('postsIncluded', e.target.checked)} /> Postes y soportes incluidos según catálogo</label>}
    {(config.productType === 'ABATIBLE_UNA' || config.productType === 'ABATIBLE_DOS') && <fieldset className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4"><legend className="field-label px-1">Automatización</legend><div className="mb-2 text-sm font-black text-amber-900">Estado: Preparada para automatizar</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${config.motorIncluded ? 'border-amber-600 bg-white' : 'border-slate-200 bg-white'}`}><input type="radio" name="double-or-single-automation" checked={config.motorIncluded} onChange={() => { update('motorIncluded', true); update('useMode', 'PREPARED'); }} /> Incluir automatización: Sí</label><label className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-bold ${!config.motorIncluded ? 'border-amber-600 bg-white' : 'border-slate-200 bg-white'}`}><input type="radio" name="double-or-single-automation" checked={!config.motorIncluded} onChange={() => { update('motorIncluded', false); update('useMode', 'PREPARED'); }} /> Incluir automatización: No</label></div></fieldset>}
    {(config.productType === 'ABATIBLE_UNA' || config.productType === 'ABATIBLE_DOS') && <label className="field-label">Soporte / fijación<select className="field mt-1" value={config.supportType} onChange={e => update('supportType', e.target.value as Config['supportType'])}><option value="POST">Poste</option><option value="WALL">Muro</option><option value="CORNER">Esquina</option></select></label>}
  </>;
};

const documentFileName = (reference: string, version: number) => {
  const safeReference = (reference || 'ALUON').replace(/[^A-Z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toUpperCase();
  return `${safeReference}-V${version}.pdf`;
};

const downloadSummary = async (config: Config, customerName: string, productLabel: string, version: number, selectedFenceSection = config.selectedFenceSection) => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF();
  const fenceVerticalLabel = config.verticalDimensionLabel === 'ANCHO' ? 'Ancho' : 'Alto';
  const fenceLines = config.sections.map((section, index) => `V${index + 1}: anchura ${section.widthMm} mm · ${fenceVerticalLabel} vertical ${section.heightMm} mm · encuentro ${section.encounterType === 'NONE' ? 'no definido' : section.encounterType === 'INNER' ? 'esquina interior' : 'esquina exterior'} · escalonamiento ${section.staggered ? 'sí' : 'no'}`);
  const lines = [
    'ALUON · RESUMEN DE CONFIGURACIÓN',
    '',
    `Referencia: ${config.reference || '—'}`,
    `Cliente: ${customerName || '—'}`,
    `Producto: ${productLabel}`,
    `Modelo: ${config.model}`,
    `Color: ${config.color || '—'}`,
    `Acabado: ${config.finish || '—'}`,
    `Estado: ${['ABATIBLE_UNA', 'ABATIBLE_DOS'].includes(config.productType) ? 'Preparada para automatizar' : config.useMode}`,
    ...(['ABATIBLE_UNA', 'ABATIBLE_DOS'].includes(config.productType) ? [`Incluir automatización: ${config.motorIncluded ? 'Sí' : 'No'}`] : []),
    '',
    'MEDIDAS Y OPCIONES',
    `Anchura: ${config.widthMm} mm`,
    `Altura: ${config.heightMm} mm`,
    `Paso libre: ${config.freePassageWidthMm} × ${config.freePassageHeightMm} mm`,
    `Holgura inferior: ${config.groundClearanceMm} mm${config.groundClearanceOption === 'OTHER' ? ' (otra)' : ''}`,
    ...(config.productType === 'VALLA' ? [`Fecha: ${config.quoteDate || '—'}`, `Nomenclatura vertical: ${fenceVerticalLabel}`, `Tramo seleccionado: V${selectedFenceSection + 1}`, ...fenceLines] : []),
    ...(config.productType === 'ABATIBLE_DOS' ? [] : [`Bisagra: ${config.hingeSide || 'pendiente'} · Apertura: hacia el interior · Vista interior`]),
    ...(config.productType === 'ABATIBLE_UNA' ? ['Herrajes manuales: no definidos por ALUON'] : []),
    ...(config.productType === 'ABATIBLE_DOS' ? [`Primera hoja de apertura: ${config.activeLeaf === 'LEFT' ? 'izquierda' : config.activeLeaf === 'RIGHT' ? 'derecha' : 'pendiente'}`, 'Reparto entre hoja activa y pasiva: pendiente de confirmación ALUON'] : []),
    ...(config.productType === 'CORREDERA' ? [`Sentido de apertura: ${config.openingSide === 'LEFT' ? 'izquierda' : 'derecha'}`, `Carril: ${config.railType === 'CARRIL_16' ? 'Ø16 mm' : 'Ø20 mm'}`, `Montaje: ${config.mountingType}`, `Guía: ${config.guideSystem === 'INTERIOR_ROLLERS_U' ? 'Rodillos interiores y carril en U' : 'Puente y rodillos exterior e interior'}`, `Distancia mínima aplicable: ${config.guideSystem === 'INTERIOR_ROLLERS_U' ? '5,5 cm' : '8 cm'}`, 'Cota gráfica de fabricación: 25 cm', `Esquema seleccionado: ${config.selectedSketch}`] : []),
    ...(config.productType === 'ABATIBLE_UNA' ? [] : [`Tirador exterior: ${config.exteriorPullWidthMm} mm × ${config.exteriorPullHeightMm} mm de alto`, `Manilla interior: ${config.interiorHandleMaterial}`, 'Cerradura: pestillo y paletón · una vuelta de llave']),
    `Portero automático: ${config.automaticDoorPhone ? 'Sí' : 'No'}`,
    `Montaje: ${config.installation}`,
    `Observaciones: ${config.notes || '—'}`,
    '',
    'Documento de revisión. Las reglas de fabricación no aprobadas requieren revisión técnica ALUON.',
  ];
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  lines.forEach((line, index) => pdf.text(line, 18, 20 + index * 8));
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text('ALUON · FICHA TÉCNICA', 18, 22);
  pdf.setFontSize(10);
  const technicalLines = [
    `Referencia: ${config.reference || '—'}`,
    `Producto: ${productLabel}`,
    `Modelo: ${config.model}`,
    `Vista de cotas: ${config.productType === 'ABATIBLE_UNA' ? 'interior' : 'interior / exterior seleccionable en el configurador'}`,
    '',
    'COTAS NORMALIZADAS',
    `Medida exterior: ${config.widthMm} × ${config.heightMm} mm`,
    `Hueco libre: ${config.clearOpeningWidthMm} × ${config.clearOpeningHeightMm} mm`,
    `Hoja terminada: ${config.finishedLeafWidthMm} × ${config.finishedLeafHeightMm} mm`,
    `Paso libre: ${config.freePassageWidthMm} × ${config.freePassageHeightMm} mm`,
    `Holgura inferior: ${config.groundClearanceMm} mm${config.groundClearanceOption === 'OTHER' ? ' (otra)' : ''}`,
    ...(config.productType === 'VALLA' ? [`Nomenclatura vertical: ${fenceVerticalLabel}`, `Tramo seleccionado: V${selectedFenceSection + 1}`, ...fenceLines] : []),
    `Distancia montaje: ${config.mountingDistanceMm} mm · holgura lateral: ${config.lateralClearanceMm} mm`,
    `Mano de bisagra: ${config.hingeSide || 'pendiente'}`,
    `Sentido de apertura: ${config.productType === 'CORREDERA' ? config.openingSide === 'LEFT' ? 'izquierda' : 'derecha' : 'hacia el interior'}`,
    ...(config.productType === 'ABATIBLE_UNA' ? ['Estado: Preparada para automatizar', `Incluir automatización: ${config.motorIncluded ? 'Sí' : 'No'}`, 'Herrajes manuales: no definidos por ALUON'] : config.productType === 'ABATIBLE_DOS' ? ['Estado: Preparada para automatizar', `Incluir automatización: ${config.motorIncluded ? 'Sí' : 'No'}`, `Primera hoja de apertura: ${config.activeLeaf === 'LEFT' ? 'izquierda' : config.activeLeaf === 'RIGHT' ? 'derecha' : 'pendiente'}`, 'Reparto entre hoja activa y pasiva: pendiente de confirmación ALUON'] : []),
    ...(config.productType === 'CORREDERA' ? [`Estado: Preparada para automatizar`, `Incluir automatización: ${config.motorIncluded ? 'Sí' : 'No'}`, `Carril: ${config.railType === 'CARRIL_16' ? 'Ø16 mm' : 'Ø20 mm'}`, `Montaje: ${config.mountingType}`, `Guía: ${config.guideSystem === 'INTERIOR_ROLLERS_U' ? 'Rodillos interiores y carril en U' : 'Puente y rodillos exterior e interior'}`, `Altura: desde suelo hasta puerta terminada`, `Distancia mínima aplicable: ${config.guideSystem === 'INTERIOR_ROLLERS_U' ? '5,5 cm' : '8 cm'}`, 'Cota gráfica de fabricación: 25 cm', `Esquema seleccionado: ${config.selectedSketch}`] : []),
    '',
    'HERRAJES Y MONTAJE',
    ...(config.productType === 'ABATIBLE_UNA' ? [] : [`Tirador exterior: ${config.exteriorPullWidthMm} mm × ${config.exteriorPullHeightMm} mm de alto`, `Manilla interior: ${config.interiorHandleMaterial}`, 'Cerradura: pestillo y paletón · una vuelta de llave']),
    `Cerradero eléctrico: ${config.electricStrike ? 'Sí' : 'No'}`,
    `Portero automático: ${config.automaticDoorPhone ? 'Sí' : 'No'}`,
    `Instalador: ${config.installerName || '—'}`,
    `Instalación: ${config.installation}`,
    `Montaje: ${config.mountingType}`,
    `Soporte: ${config.supportType} · motor: ${config.motorIncluded ? 'Sí' : 'No'}`,
    `Cremallera: ${config.rackType} · topes: ${config.stopType}`,
    `Encuentro valla: ${config.cornerType} · escalonamiento: ${config.staggered ? 'Sí' : 'No'}`,
    '',
    'Estado técnico: pendiente de validación de reglas de ingeniería no aprobadas.',
  ];
  technicalLines.forEach((line, index) => pdf.text(line, 18, 34 + index * 7));
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text('ALUON · DOCUMENTO DE FABRICACIÓN', 18, 22);
  pdf.setFontSize(10);
  const manufacturingLines = [
    `Referencia: ${config.reference || '—'} · Versión: v${version}`,
    `Familia: ${productLabel} · Modelo: ${config.model}`,
    `Estado: ${['ABATIBLE_UNA', 'ABATIBLE_DOS', 'CORREDERA'].includes(config.productType) ? 'Preparada para automatizar' : config.productType === 'PUERTA_PEATONAL' ? 'Listo para confirmar' : 'Requiere validación técnica'}`,
    '',
    'DESPIECE PRELIMINAR',
    `1 · Conjunto principal ${config.widthMm} × ${config.heightMm} mm`,
    `1 · Acabado ${config.color || 'pendiente'} · ${config.finish || 'pendiente'}`,
    config.productType === 'VALLA' ? `${config.sections.length} · Tramo(s) de valla con postes: ${config.postsIncluded ? 'sí' : 'no'} · nomenclatura vertical ${fenceVerticalLabel}` : '1 · Bastidor / hoja terminada según cotas técnicas',
    ...(config.productType === 'VALLA' ? fenceLines.map(line => `1 · ${line}`) : []),
    ...(config.productType === 'ABATIBLE_UNA' ? [`1 · Automatización: ${config.motorIncluded ? 'incluida' : 'no incluida'} · estado preparada para automatizar`, '1 · Herrajes manuales no definidos por ALUON'] : config.productType === 'ABATIBLE_DOS' ? [`1 · Automatización: ${config.motorIncluded ? 'incluida' : 'no incluida'} · estado preparada para automatizar`, `1 · Primera hoja de apertura: ${config.activeLeaf === 'LEFT' ? 'izquierda' : config.activeLeaf === 'RIGHT' ? 'derecha' : 'pendiente'}`, '1 · Reparto entre hoja activa y pasiva pendiente de confirmación ALUON'] : config.productType === 'CORREDERA' ? [`1 · Automatización: ${config.motorIncluded ? 'incluida' : 'no incluida'} · estado preparada para automatizar`, `1 · Carril ${config.railType === 'CARRIL_16' ? 'Ø16 mm' : 'Ø20 mm'} · montaje ${config.mountingType}`, `1 · Guía ${config.guideSystem === 'INTERIOR_ROLLERS_U' ? 'rodillos interiores y carril en U' : 'puente y rodillos exterior e interior'}`, `1 · Esquema ${config.selectedSketch}`] : [`1 · Tirador exterior ${config.exteriorPullWidthMm} mm × ${config.exteriorPullHeightMm} mm de alto · manilla interior ${config.interiorHandleMaterial}`, '1 · Cerradura con pestillo y paletón · una vuelta de llave']),
    `1 · Portero automático: ${config.automaticDoorPhone ? 'Sí' : 'No'}`,
    config.motorIncluded ? '1 · Kit de motor y cremallera' : '0 · Kit de motor (no incluido)',
    '',
    'CONTROLES ANTES DE FABRICAR',
    `□ Cotas verificadas: hueco ${config.clearOpeningWidthMm} × ${config.clearOpeningHeightMm} mm`,
    `□ Paso libre verificado: ${config.freePassageWidthMm} × ${config.freePassageHeightMm} mm`,
    `□ Montaje: ${config.installation} · soporte: ${config.supportType}`,
    `□ Holguras: inferior ${config.groundClearanceMm} mm · lateral ${config.lateralClearanceMm} mm`,
    `□ Bisagra: ${config.hingeSide || 'pendiente'} · apertura hacia el interior`,
    ...(config.productType === 'ABATIBLE_DOS' ? [`□ Primera hoja de apertura: ${config.activeLeaf === 'LEFT' ? 'izquierda' : config.activeLeaf === 'RIGHT' ? 'derecha' : 'pendiente'}`, '□ Reparto activa/pasiva: pendiente de confirmación ALUON'] : []),
    ...(config.productType === 'CORREDERA' ? [`□ Sentido de apertura: ${config.openingSide === 'LEFT' ? 'izquierda' : 'derecha'}`, `□ Carril Ø${config.railType === 'CARRIL_16' ? '16' : '20'} mm · montaje ${config.mountingType}`, `□ Guía: ${config.guideSystem === 'INTERIOR_ROLLERS_U' ? 'rodillos interiores y carril en U' : 'puente y rodillos exterior e interior'}`, '□ Altura medida desde suelo hasta puerta terminada', `□ Distancia mínima aplicable: ${config.guideSystem === 'INTERIOR_ROLLERS_U' ? '5,5 cm' : '8 cm'} · cota gráfica 25 cm`, `□ Esquema guardado: ${config.selectedSketch}`] : []),
    ...(config.productType === 'VALLA' ? [`□ Tramos verificados: ${config.sections.length}/8 · tramo seleccionado V${selectedFenceSection + 1}`, ...fenceLines.map(line => `□ ${line}`)] : []),
    `□ Instalador: ${config.installerName || 'pendiente'}`,
    '□ Reglas de ingeniería aprobadas y materiales disponibles',
    '',
    'Este documento es una orden preliminar de fabricación; no sustituye la validación técnica cuando el configurador la exige.',
  ];
  manufacturingLines.forEach((line, index) => pdf.text(line, 18, 34 + index * 7));
  const dataUri = pdf.output('datauristring');
  pdf.save(documentFileName(config.reference, version));
  return dataUri;
};

export default function OrderConfigurator() {
  const { customers } = useCustomers();
  const [config, setConfig] = useState<Config>(() => {
    try { return hydrateConfig(JSON.parse(localStorage.getItem('aluon-order-configurator-draft') || '{}')); } catch { return initialConfig; }
  });
  const [selectedFenceSection, setSelectedFenceSection] = useState(0);
  const [step, setStep] = useState<Step>(1);
  const [models, setModels] = useState<CatalogModelOption[]>(buildCatalogModelOptions([]));
  const [catalogRules, setCatalogRules] = useState<ConfigCatalogRule[]>([]);
  const [catalogOptions, setCatalogOptions] = useState<Record<string, ConfigCatalogOption[]>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [history, setHistory] = useState<OrderConfigurationAudit[]>([]);
  const [drafts, setDrafts] = useState<SavedOrderConfiguration[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [stepError, setStepError] = useState('');
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [, setValidatingRules] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('DRAFT');

  useEffect(() => { listCatalogFamilies().then(families => setModels(buildCatalogModelOptions(families))).catch(() => undefined); }, []);
  useEffect(() => {
    Promise.all(['COLOR', 'ACABADO', 'HERRAJE', 'CERRADURA'].map(async kind => [kind, await listConfigCatalogOptions(kind)] as const))
      .then(entries => setCatalogOptions(Object.fromEntries(entries)))
      .catch(() => setCatalogOptions({}));
  }, []);
  useEffect(() => { listConfigCatalogRules(config.productType).then(setCatalogRules).catch(() => setCatalogRules([])); }, [config.productType]);
  useEffect(() => { localStorage.setItem('aluon-order-configurator-draft', JSON.stringify(config)); }, [config]);
  useEffect(() => {
    setDraftsLoading(true);
    listOrderConfigurations('DRAFT').then(setDrafts).catch(() => setDrafts([])).finally(() => setDraftsLoading(false));
  }, [savedId]);

  const model = useMemo(() => models.find(option => option.technicalModel === config.model) ?? models[0] ?? null, [models, config.model]);
  const activeFenceSection = config.sections[selectedFenceSection] ?? config.sections[0];
  const update = <K extends keyof Config>(key: K, value: Config[K]) => { setServerErrors([]); setConfig(current => ({ ...current, [key]: value })); };
  const selectedCustomer = customers.find(customer => customer.id === config.customerId);
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers.slice(0, 60);
    return customers.filter(customer => [customer.nombreComercial, customer.razonSocial, customer.personaContacto, customer.email].some(value => value?.toLowerCase().includes(query))).slice(0, 60);
  }, [customers, customerSearch]);
  const customerName = selectedCustomer?.nombreComercial || config.customerName;
  const isPeatonal = config.productType === 'PUERTA_PEATONAL';
  const isSliding = config.productType === 'CORREDERA';
  const isFence = config.productType === 'VALLA';
  const stepLabels = isSliding ? ['Producto', 'Datos generales', 'Automatización', 'Altura, anchura y carril', 'Montaje y guía', 'Observaciones', 'Revisión'] : steps;
  const reviewStep: Step = isSliding ? 7 : 6;
  const validation = [
    !customerName.trim() ? 'Selecciona un cliente o introduce su nombre.' : '',
    !config.reference.trim() ? 'La referencia del pedido es obligatoria.' : '',
    !config.model.trim() ? 'El modelo es obligatorio.' : '',
    !config.color.trim() ? 'El color es obligatorio.' : '',
    !config.finish.trim() ? 'El acabado es obligatorio.' : '',
    isFence && !config.quoteDate.trim() ? 'La fecha del presupuesto es obligatoria.' : '',
  ...serverErrors,
  ].filter(Boolean);
  const technicalWarnings = [
    config.productType === 'ABATIBLE_UNA' && (config.angleDeg < 1 || config.angleDeg > 180) ? 'El ángulo previsto queda fuera del rango geométrico habitual y requiere revisión técnica ALUON.' : '',
    config.productType === 'ABATIBLE_DOS' ? 'El reparto entre hoja activa y pasiva queda pendiente de confirmación ALUON.' : '',
    config.productType === 'CORREDERA' && config.sideCollectionMm < config.widthMm ? 'El espacio lateral de recogida es menor que la anchura de hoja; requiere revisión técnica ALUON.' : '',
    config.productType === 'VALLA' && config.sections.length > 1 ? 'La continuidad entre tramos, esquinas y escalonamientos requiere revisión técnica ALUON.' : '',
  ].filter(Boolean);

  const stepValidation = (currentStep: Step) => {
    if (currentStep === 1 || currentStep === 3 || currentStep === 5 || (isSliding && currentStep === 6)) return [];
    if (currentStep === 2) return validation.filter(item => ['Selecciona un cliente o introduce su nombre.', 'La referencia del pedido es obligatoria.', 'El modelo es obligatorio.', 'El color es obligatorio.', 'El acabado es obligatorio.', 'La fecha del presupuesto es obligatoria.'].includes(item as string));
    return validation;
  };

  const goNext = async () => {
    const errors = stepValidation(step);
    if (errors.length > 0) {
      setStepError(errors[0] as string);
      return;
    }
    setValidatingRules(true);
    try {
      const result = await validateConfigCatalog(config.productType, config);
      setServerErrors(result.errors);
      if (!result.valid) {
        setStepError(result.errors[0] || 'La configuración no cumple la matriz activa de ALUON.');
        return;
      }
    } catch (error) {
      setStepError(error instanceof Error ? error.message : 'No se pudo validar la matriz de reglas.');
      return;
    } finally {
      setValidatingRules(false);
    }
    setStepError('');
    setStep((step + 1) as Step);
  };

  const loadDraft = async (id: string) => {
    if (!id) return;
    setSaving(true); setMessage('');
    try {
      const result = await getOrderConfiguration(id);
      const restored = hydrateConfig(result.payload as Partial<Config>);
      setConfig(restored);
      setSelectedFenceSection(restored.selectedFenceSection);
      setSavedId(result.id);
      setCurrentStatus(result.status);
      setStep(1);
      setHistory(await getOrderConfigurationHistory(result.id));
      setMessage(`Borrador recuperado · ${result.reference} · versión ${result.version}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo recuperar el borrador.'); }
    finally { setSaving(false); }
  };

  const save = async (status: 'DRAFT' | 'CONFIRMED' | 'PENDING_REVIEW', configOverride?: Config) => {
    setSaving(true); setMessage('');
    try {
      const baseConfig = configOverride || config;
      const savedConfig = ['ABATIBLE_UNA', 'ABATIBLE_DOS'].includes(baseConfig.productType) ? { ...baseConfig, useMode: 'PREPARED' as const } : baseConfig;
      const payload = { customerId: savedConfig.customerId || undefined, customerName, reference: savedConfig.reference, productType: savedConfig.productType, status, payload: savedConfig } as const;
      const result = savedId ? await updateOrderConfiguration(savedId, payload) : await saveOrderConfiguration(payload);
      setSavedId(result.id);
      setCurrentStatus(result.status);
      setMessage(`${statusLabels[status] || 'Configuración guardada'} · versión ${result.version} · ${result.reference}`);
      if (status !== 'DRAFT') localStorage.removeItem('aluon-order-configurator-draft');
      setHistory(await getOrderConfigurationHistory(result.id));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo guardar.'); } finally { setSaving(false); }
  };

  const duplicateConfiguration = () => {
    setConfig(current => ({
      ...current,
      reference: current.reference ? `${current.reference}-COPIA` : 'ALUON-COPIA',
    }));
    setSavedId(null);
    setHistory([]);
    setCurrentStatus('DRAFT');
    setConfig(current => ({ ...current, generatedDocuments: [] }));
    setMessage('Copia preparada como nueva configuración. Revisa la referencia antes de guardar.');
    setStep(reviewStep);
  };

  return (
    <div className="configurator-shell max-w-7xl mx-auto w-full pb-28">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div><div className="flex items-center gap-2"><div className="w-1 h-6 rounded-full bg-brand" /><h1 className="text-xl font-black uppercase tracking-tight">Configurador de pedidos</h1></div><p className="ml-3.5 mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Fase 1 · configuración inequívoca</p></div>
        <div className="flex flex-wrap gap-2">
          {savedId && <button type="button" className="btn-ghost" onClick={duplicateConfiguration}>Duplicar configuración</button>}
          <button type="button" className="btn-ghost" onClick={() => { setConfig(initialConfig); setSelectedFenceSection(0); setSavedId(null); setHistory([]); setCurrentStatus('DRAFT'); setStep(1); localStorage.removeItem('aluon-order-configurator-draft'); }}>Nuevo borrador</button>
          <select className="field max-w-xs" aria-label="Recuperar borrador" defaultValue="" onChange={e => { void loadDraft(e.target.value); }} disabled={draftsLoading || saving}>
            <option value="">{draftsLoading ? 'Cargando borradores…' : 'Recuperar borrador'}</option>
            {drafts.map(draft => <option key={draft.id} value={draft.id}>{draft.reference} · v{draft.version}</option>)}
          </select>
        </div>
      </div>
      <ProposalOneStepper step={step} reviewStep={reviewStep} setStep={setStep} />
      <nav className="configurator-steps legacy-configurator-steps mb-5" aria-label="Pasos del configurador">
        <ol className="grid grid-cols-2 gap-2 md:grid-cols-7" role="tablist">
          {stepLabels.map((label, index) => { const number = (index + 1) as Step; const isActive = step === number; const isComplete = step > number; return <li key={label} className="min-w-0"><button type="button" role="tab" aria-selected={isActive} aria-current={isActive ? 'step' : undefined} onClick={() => setStep(number)} className={`step-tab w-full rounded-xl px-3 py-3 text-left ${isActive ? 'step-tab-active' : isComplete ? 'step-tab-complete' : ''}`}><span className="step-tab-number">{isComplete ? '✓' : `0${number}`}</span><span className="step-tab-label">{label}</span></button></li>; })}
        </ol>
      </nav>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5">
        <section className="configurator-panel rounded-2xl bg-white border border-slate-200 p-5 md:p-7" aria-label={`Paso ${step}: ${stepLabels[step - 1]}`}>
          {catalogRules.length > 0 && step !== 2 && <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">{catalogRules.length} regla(s) activa(s) cargada(s) para {config.productType}. Las reglas se aplican como validaciones configurables.</div>}
          {step === 1 && <div><div className="section-kicker">Paso 01 · decisión principal</div><h2 className="text-lg font-black mb-1">¿Qué quieres configurar?</h2><p className="text-sm text-slate-500 mb-5">Elige una familia para mostrar únicamente las preguntas que corresponden a ese producto.</p><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{products.map(product => <button type="button" key={product.id} aria-pressed={config.productType === product.id} onClick={() => { update('productType', product.id); if (product.id === 'ABATIBLE_UNA' || product.id === 'ABATIBLE_DOS') update('useMode', 'PREPARED'); }} className={`product-choice text-left rounded-2xl p-4 border-2 transition ${config.productType === product.id ? 'product-choice-selected' : ''}`}><span className="product-choice-check" aria-hidden="true">{config.productType === product.id ? '✓' : '○'}</span><span><span className="block font-black">{product.label}</span><span className="mt-1 block text-xs text-slate-500">{product.description}</span></span></button>)}</div>{!isPeatonal && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Las reglas de fabricación, cargas, herrajes y compatibilidades que aún no estén aprobadas quedarán señaladas para revisión técnica ALUON.</div>}</div>}
          {step === 2 && <ProposalOneDataStep config={config} update={update} models={models} catalogOptions={catalogOptions} isFence={isFence} customerName={customerName} />}
          {false && step === 2 && <div><h2 className="text-lg font-black mb-5">Acabado e identificación</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="field-label">Buscar cliente<input className="field mt-1" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Nombre, contacto o correo" /></label><label className="field-label">{isFence ? 'Distribuidor' : 'Cliente'}<select className="field mt-1" value={config.customerId} onChange={e => update('customerId', e.target.value)}><option value="">Seleccionar {isFence ? 'distribuidor' : 'cliente'}</option>{filteredCustomers.map(customer => <option key={customer.id} value={customer.id}>{customer.nombreComercial || customer.razonSocial}</option>)}</select><span className="mt-1 block text-[11px] font-semibold text-slate-400">{customers.length} clientes de prueba · mostrando {filteredCustomers.length}</span></label><label className="field-label">{isFence ? 'Distribuidor manual' : 'Cliente manual'}<input className="field mt-1" value={config.customerName} onChange={e => update('customerName', e.target.value)} placeholder="Si todavía no está en CRM" /></label><label className="field-label">Referencia / presupuesto<input className="field mt-1" value={config.reference} onChange={e => update('reference', e.target.value.toUpperCase())} placeholder="ALUON-2026-001" /></label><label className="field-label">Modelo<select className="field mt-1" value={config.model} onChange={e => update('model', e.target.value)}>{models.map(option => <option key={option.technicalModel} value={option.technicalModel}>{option.label}</option>)}</select></label><label className="field-label">Color{catalogOptions.COLOR?.length ? <select className="field mt-1" value={config.color} onChange={e => update('color', e.target.value)}><option value="">Seleccionar color</option>{catalogOptions.COLOR.map(option => <option key={option.id} value={option.code}>{option.label}</option>)}</select> : <input className="field mt-1" value={config.color} onChange={e => update('color', e.target.value)} placeholder="RAL 7016" />}</label><label className="field-label">Acabado{catalogOptions.ACABADO?.length ? <select className="field mt-1" value={config.finish} onChange={e => update('finish', e.target.value)}><option value="">Seleccionar acabado</option>{catalogOptions.ACABADO.map(option => <option key={option.id} value={option.code}>{option.label}</option>)}</select> : <input className="field mt-1" value={config.finish} onChange={e => update('finish', e.target.value)} placeholder="Lacado / anodizado" />}</label>{isFence && <label className="field-label">Fecha del presupuesto<input className="field mt-1" type="date" value={config.quoteDate} onChange={e => update('quoteDate', e.target.value)} /></label>}</div></div>}
          {step === 3 && !isSliding && <div><h2 className="text-lg font-black mb-1">Modalidad de uso</h2><p className="text-sm text-slate-500 mb-5">{['ABATIBLE_UNA', 'ABATIBLE_DOS'].includes(config.productType) ? 'Esta familia se registra como preparada para automatizar. La inclusión del automatismo se decide en el paso siguiente.' : '“Manual”, “preparada” y “motorizada” son estados distintos.'}</p>{['ABATIBLE_UNA', 'ABATIBLE_DOS'].includes(config.productType) ? <div className="rounded-2xl border-2 border-blue-600 bg-blue-50 p-4"><div className="font-black">Preparada para automatizar</div><div className="text-xs text-slate-600 mt-1">Estado fijo para abatibles.</div></div> : <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{[['MANUAL','Manual completo'],['PREPARED','Preparada para automatizar'],['MOTORIZED','Motorizada']].map(([value, label]) => <button type="button" key={value} onClick={() => update('useMode', value as Config['useMode'])} className={`rounded-2xl p-4 border-2 text-left ${config.useMode === value ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><div className="font-black">{label}</div><div className="text-xs text-slate-500 mt-1">{value === 'MANUAL' ? 'Herrajes de uso manual completo' : value === 'PREPARED' ? 'Sin automatismo suministrado' : 'Automatismo incluido en el pedido'}</div></button>)}</div>}</div>}
          {step === 4 && <div><h2 className="text-lg font-black mb-2">Medidas · vista interior</h2><p className="text-sm text-slate-500 mb-5">Cada tipología muestra sus cotas propias. Las medidas se almacenan normalizadas en milímetros.</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SpecificMeasurements config={config} update={update} selectedFenceSection={selectedFenceSection} setSelectedFenceSection={setSelectedFenceSection} /></div><p className="mt-4 text-xs text-slate-500">No se deducen medidas de fabricación ni se convierten en reglas bloqueantes sin aprobación de ingeniería.</p></div>}
          {step === (isSliding ? 6 : 5) && <div><h2 className="text-lg font-black mb-5">Observaciones e instalador</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="field-label">Modalidad de instalación<select className="field mt-1" value={config.installation} onChange={e => update('installation', e.target.value as Config['installation'])}><option value="BETWEEN_PILLARS">Entre pilares</option><option value="BEHIND_WALL">Detrás de muro</option><option value="SUPPORTS">Con soportes</option></select></label><SpecificOptions config={config} update={update} /><label className="field-label">Nombre del instalador<input className="field mt-1" value={config.installerName} onChange={e => update('installerName', e.target.value)} placeholder="Nombre y apellidos" /></label><label className="field-label">Observaciones<textarea className="field mt-1 min-h-28" value={config.notes} onChange={e => update('notes', e.target.value)} placeholder="Notas para revisión técnica o instalación" /></label>{config.productType !== 'PUERTA_PEATONAL' && <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-bold"><input type="checkbox" checked={config.electricStrike} onChange={e => update('electricStrike', e.target.checked)} /> Cerradero eléctrico compatible</label>}<label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-bold"><input type="checkbox" checked={config.automaticDoorPhone} onChange={e => update('automaticDoorPhone', e.target.checked)} /> Portero automático: {config.automaticDoorPhone ? 'Sí' : 'No'}</label></div></div>}
          {step === reviewStep && <div><h2 className="text-lg font-black mb-5">Revisión y confirmación</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"><div><span className="text-slate-400">Cliente</span><div className="font-bold">{customerName || '—'}</div></div><div><span className="text-slate-400">Referencia</span><div className="font-bold">{config.reference || '—'}</div></div><div><span className="text-slate-400">Producto</span><div className="font-bold">{products.find(p => p.id === config.productType)?.label}</div></div><div><span className="text-slate-400">Medidas</span><div className="font-bold">{isFence ? `${config.sections.length} tramos · V${selectedFenceSection + 1}` : `${config.widthMm} × ${config.heightMm} mm · holgura ${config.groundClearanceMm} mm`}</div></div><div><span className="text-slate-400">Uso</span><div className="font-bold">{config.useMode}</div></div><div><span className="text-slate-400">Estado actual</span><div className="font-bold">{statusLabels[currentStatus] || currentStatus}</div></div></div>{validation.length > 0 && <div className="mt-5 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800"><div className="font-black mb-1">Faltan datos</div>{validation.map(item => <div key={item}>· {item}</div>)}</div>}{technicalWarnings.length > 0 && <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900"><div className="font-black mb-1">Revisión técnica necesaria</div>{technicalWarnings.map(item => <div key={item}>· {item}</div>)}</div>}<div className="mt-5 flex flex-wrap gap-3"><button type="button" className="btn-ghost" onClick={() => save('DRAFT')} disabled={saving}>Guardar borrador</button><button type="button" className="btn-ghost" onClick={async () => { const name = documentFileName(config.reference, history.length + 1); const base64 = await downloadSummary(config, customerName, products.find(p => p.id === config.productType)?.label || config.productType, history.length + 1, selectedFenceSection); const next = { ...config, generatedDocuments: [...config.generatedDocuments, { name, type: 'ORDER_CONFIGURATION_PDF', generatedAt: new Date().toISOString(), mimeType: 'application/pdf', contentBase64: base64 }] }; setConfig(next); if (savedId) await save('DRAFT', next); }}>Generar ficha PDF</button><button type="button" className="btn-ghost" disabled={!selectedCustomer} onClick={() => selectedCustomer && openBudgetWizardForCustomer(selectedCustomer, config)}>Continuar en presupuesto</button><button type="button" className="btn-primary" onClick={() => save(isPeatonal && technicalWarnings.length === 0 ? 'CONFIRMED' : 'PENDING_REVIEW')} disabled={saving || validation.length > 0}>{isPeatonal && technicalWarnings.length === 0 ? 'Confirmar pedido' : 'Enviar a revisión técnica'}</button></div>{message && <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm font-bold text-blue-800">{message}</div>}{history.length > 0 && <div className="mt-6 border-t border-slate-200 pt-4"><div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Historial de cambios</div><div className="space-y-2">{history.map(item => <div key={item.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs"><span className="font-bold">v{item.version} · {item.action}</span><span className="text-slate-500">{item.status} · {new Date(item.createdAt).toLocaleString()}</span></div>)}</div></div>}</div>}
          {step === 6 && config.productType === 'PUERTA_PEATONAL' && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"><div className="font-black uppercase tracking-wide text-slate-500">Detalle peatonal revisado</div><div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2"><div>Bisagra: <strong>{config.hingeSide === 'LEFT' ? 'Izquierda' : config.hingeSide === 'RIGHT' ? 'Derecha' : 'Pendiente'}</strong></div><div>Apertura: <strong>Interior</strong></div><div>Tirador exterior: <strong>30 × 550 mm</strong></div><div>Manilla interior: <strong>Inox</strong></div><div>Cerradura: <strong>Pestillo y paletón · una vuelta</strong></div><div>Portero: <strong>{config.automaticDoorPhone ? 'Sí' : 'No'}</strong></div><div>Instalador: <strong>{config.installerName || '—'}</strong></div><div>Holgura: <strong>{config.groundClearanceMm} mm</strong></div></div></div>}
          {step === 6 && config.productType === 'ABATIBLE_UNA' && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><div className="font-black uppercase tracking-wide text-amber-900">Detalle abatible de una hoja revisado</div><div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2"><div>Estado: <strong>Preparada para automatizar</strong></div><div>Incluir automatización: <strong className={config.motorIncluded ? 'text-amber-700' : ''}>{config.motorIncluded ? 'Sí' : 'No'}</strong></div><div>Bisagra: <strong>{config.hingeSide === 'LEFT' ? 'Izquierda' : config.hingeSide === 'RIGHT' ? 'Derecha' : 'Pendiente'}</strong></div><div>Apertura: <strong>Hacia el interior · vista interior</strong></div><div>Medidas: <strong>{config.widthMm} × {config.heightMm} mm</strong></div><div>Holgura: <strong>{config.groundClearanceMm} mm</strong></div><div>Herrajes manuales: <strong>No definidos por ALUON</strong></div><div>Instalador: <strong>{config.installerName || '—'}</strong></div></div></div>}
          {step === 6 && config.productType === 'ABATIBLE_DOS' && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><div className="font-black uppercase tracking-wide text-amber-900">Detalle abatible de dos hojas revisado</div><div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2"><div>Estado: <strong>Preparada para automatizar</strong></div><div>Incluir automatización: <strong className={config.motorIncluded ? 'text-amber-700' : ''}>{config.motorIncluded ? 'Sí' : 'No'}</strong></div><div>Primera hoja de apertura: <strong>{config.activeLeaf === 'LEFT' ? 'izquierda' : config.activeLeaf === 'RIGHT' ? 'derecha' : 'Pendiente'}</strong></div><div>Vista: <strong>Interior · dos hojas</strong></div><div>Medidas totales: <strong>{config.widthMm} × {config.heightMm} mm</strong></div><div>Holgura: <strong>{config.groundClearanceMm} mm</strong></div><div>Reparto activa/pasiva: <strong>Pendiente de confirmación ALUON</strong></div><div>Instalador: <strong>{config.installerName || '—'}</strong></div></div></div>}
          {step === reviewStep && isSliding && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><div className="font-black uppercase tracking-wide text-amber-900">Detalle corredera revisado</div><div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2"><div>Estado: <strong>Preparada para automatizar</strong></div><div>Automatización: <strong>{config.motorIncluded ? 'Sí' : 'No'}</strong></div><div>Sentido de apertura: <strong>{config.openingSide === 'LEFT' ? 'izquierda' : 'derecha'}</strong></div><div>Carril: <strong>{config.railType === 'CARRIL_16' ? 'Ø16 mm' : 'Ø20 mm'}</strong></div><div>Montaje: <strong>{config.mountingType}</strong></div><div>Guía: <strong>{config.guideSystem === 'INTERIOR_ROLLERS_U' ? 'Rodillos interiores y carril en U' : 'Puente y rodillos exterior e interior'}</strong></div><div>Esquema guardado: <strong>{config.selectedSketch}</strong></div><div>Instalador: <strong>{config.installerName || '—'}</strong></div></div></div>}
          {step === reviewStep && isFence && <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm"><div className="font-black uppercase tracking-wide text-blue-900">Detalle de valla</div><div className="mt-2 mb-3">Nomenclatura vertical: <strong>{config.verticalDimensionLabel === 'ANCHO' ? 'Ancho' : 'Alto'}</strong> · tramo seleccionado: <strong>V{selectedFenceSection + 1}</strong> · {config.sections.length}/8 tramos</div><div className="space-y-2">{config.sections.map((section, index) => <div key={`review-section-${index}`} className="rounded-lg bg-white px-3 py-2"><strong>V{index + 1}</strong> · anchura {section.widthMm} mm · {config.verticalDimensionLabel === 'ANCHO' ? 'ancho' : 'alto'} vertical {section.heightMm} mm · encuentro {section.encounterType === 'NONE' ? 'no definido' : section.encounterType === 'INNER' ? 'esquina interior' : 'esquina exterior'} · escalonamiento {section.staggered ? 'sí' : 'no'}</div>)}</div><div className="mt-3">Instalador: <strong>{config.installerName || '—'}</strong></div></div>}
          {step === 3 && isSliding && <div><h2 className="text-lg font-black mb-1">Automatización y sentido de apertura</h2><p className="text-sm text-slate-500 mb-5">La corredera queda preparada para automatizar. Selecciona una única opción de automatización y un único sentido de apertura.</p><SlidingAutomationStep config={config} update={update} /></div>}
          {step === 5 && isSliding && <div><h2 className="text-lg font-black mb-1">Montaje y sistema de guía</h2><p className="text-sm text-slate-500 mb-5">Selecciona el montaje y el esquema de rodillos. No se bloquean combinaciones hasta confirmación de ALUON.</p><SlidingMountingGuideStep config={config} update={update} /></div>}
          {stepError && <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm font-bold text-rose-800" role="alert" aria-live="assertive">{stepError}</div>}
          <div className="configurator-actions mt-8 flex justify-between border-t border-slate-100 pt-5" role="group" aria-label="Acciones del configurador"><button type="button" className="btn-ghost btn-large" disabled={step === 1} onClick={() => { setStepError(''); setStep((step - 1) as Step); }}>← Atrás</button><div className="flex flex-wrap justify-end gap-2"><button type="button" className="btn-ghost btn-large" onClick={() => save('DRAFT')} disabled={saving}>{saving ? 'Guardando…' : 'Guardar borrador'}</button><button type="button" className="btn-primary btn-large" disabled={step === reviewStep || saving} onClick={goNext}>Siguiente →</button></div></div>
        </section>
        <aside className="configurator-aside lg:sticky lg:top-4 lg:self-start"><div className="configurator-summary rounded-2xl bg-white border border-slate-200 p-4 mb-4" aria-label="Resumen permanente del pedido"><div className="flex items-center justify-between gap-3"><div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Resumen del pedido</div><span className="summary-live">En directo</span></div><div className="mt-3 space-y-2 text-xs"><div><span className="text-slate-400">Producto</span><div className="font-bold">{products.find(p => p.id === config.productType)?.label || '—'}</div></div><div><span className="text-slate-400">Cliente / referencia</span><div className="font-bold">{customerName || '—'} · {config.reference || 'Sin referencia'}</div></div><div><span className="text-slate-400">Modelo · color · acabado</span><div className="font-bold">{model?.label || config.model || '—'} · {config.color || '—'} · {config.finish || '—'}</div></div>{isFence ? <><div><span className="text-slate-400">Tramos</span><div className="font-bold">{config.sections.length}/8 · seleccionado V{selectedFenceSection + 1}</div></div><div><span className="text-slate-400">Cotas V{selectedFenceSection + 1}</span><div className="font-bold">{activeFenceSection?.widthMm || '—'} × {activeFenceSection?.heightMm || '—'} mm · {config.verticalDimensionLabel === 'ANCHO' ? 'Ancho' : 'Alto'} vertical</div></div></> : <div><span className="text-slate-400">Medidas</span><div className="font-bold">{config.widthMm || '—'} × {config.heightMm || '—'} mm · holgura {config.groundClearanceMm || '—'} mm</div></div>}{isSliding ? <><div><span className="text-slate-400">Sentido de apertura</span><div className="font-bold">{config.openingSide === 'LEFT' ? 'Izquierda' : 'Derecha'}</div></div><div><span className="text-slate-400">Carril · montaje</span><div className="font-bold">Ø{config.railType === 'CARRIL_16' ? '16' : '20'} mm · Montaje {config.mountingType}</div></div><div><span className="text-slate-400">Guía / esquema</span><div className="font-bold">{config.guideSystem === 'INTERIOR_ROLLERS_U' ? 'Rodillos interiores y carril en U' : 'Puente y rodillos exterior e interior'} · {config.selectedSketch}</div></div></> : !isFence && (config.productType === 'ABATIBLE_DOS' ? <div><span className="text-slate-400">Primera hoja de apertura</span><div className="font-black text-blue-700">{config.activeLeaf === 'LEFT' ? 'izquierda' : config.activeLeaf === 'RIGHT' ? 'derecha' : 'Pendiente'}</div></div> : <div><span className="text-slate-400">Bisagra · apertura</span><div className="font-bold">{config.hingeSide === 'LEFT' ? 'Izquierda' : config.hingeSide === 'RIGHT' ? 'Derecha' : 'Pendiente'} · interior</div></div>)}{['ABATIBLE_UNA', 'ABATIBLE_DOS', 'CORREDERA'].includes(config.productType) && <div><span className="text-slate-400">Automatización</span><div className={config.motorIncluded ? 'font-black text-amber-700' : 'font-bold'}>Preparada para automatizar · Incluir: {config.motorIncluded ? 'Sí' : 'No'}</div></div>}<div><span className="text-slate-400">Estado</span><div className="font-bold text-blue-700">{statusLabels[currentStatus] || currentStatus}</div></div></div></div><OrderConfiguratorSketch widthMm={isFence ? activeFenceSection?.widthMm ?? 0 : config.widthMm} heightMm={isFence ? activeFenceSection?.heightMm ?? 0 : config.heightMm} groundClearanceMm={config.groundClearanceMm} hingeSide={config.hingeSide || 'LEFT'} openingSide={config.productType === 'ABATIBLE_UNA' ? (config.hingeSide === 'RIGHT' ? 'RIGHT' : 'LEFT') : config.openingSide} firstOpeningLeaf={config.productType === 'ABATIBLE_DOS' ? config.activeLeaf : undefined} mountingType={isSliding ? config.mountingType : undefined} guideSystem={isSliding ? config.guideSystem : undefined} sectionIndex={isFence ? selectedFenceSection : undefined} verticalDimensionLabel={isFence ? config.verticalDimensionLabel : undefined} productType={config.productType} modelLabel={model?.label} freePassageWidthMm={config.productType === 'PUERTA_PEATONAL' ? config.freePassageWidthMm : undefined} freePassageHeightMm={config.productType === 'PUERTA_PEATONAL' ? config.freePassageHeightMm : undefined} leftLeafWidthMm={config.leftLeafWidthMm} rightLeafWidthMm={config.rightLeafWidthMm} /><div className="mt-4 rounded-2xl bg-white border border-slate-200 p-4"><div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Control</div><div className="mt-2 text-sm font-bold">{validation.length === 0 ? 'Configuración completa para revisión' : `${validation.length} validación(es) pendiente(s)`}</div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.round((step / stepLabels.length) * 100)}%` }} /></div></div></aside>
      </div>
    </div>
  );
}
