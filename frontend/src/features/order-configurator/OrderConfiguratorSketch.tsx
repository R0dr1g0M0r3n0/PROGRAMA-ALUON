import { useState } from 'react';

export type SketchView = 'INTERIOR' | 'EXTERIOR';

export type ConfiguratorSketchProps = {
  widthMm: number;
  heightMm: number;
  groundClearanceMm: number;
  hingeSide: 'LEFT' | 'RIGHT';
  openingSide: 'LEFT' | 'RIGHT';
  productType: string;
  modelLabel?: string;
  freePassageWidthMm?: number;
  freePassageHeightMm?: number;
  leftLeafWidthMm?: number;
  rightLeafWidthMm?: number;
  firstOpeningLeaf?: 'LEFT' | 'RIGHT' | '';
  mountingType?: 'A' | 'B';
  guideSystem?: 'INTERIOR_ROLLERS_U' | 'BRIDGE_ROLLERS';
  sectionIndex?: number;
  verticalDimensionLabel?: 'ALTO' | 'ANCHO';
};

const formatMm = (value: number | undefined) => `${Math.max(0, value ?? 0)} mm`;

export default function OrderConfiguratorSketch({
  widthMm,
  heightMm,
  groundClearanceMm,
  hingeSide,
  openingSide,
  productType,
  modelLabel,
  freePassageWidthMm,
  freePassageHeightMm,
  firstOpeningLeaf,
  mountingType,
  guideSystem,
  sectionIndex,
  verticalDimensionLabel = 'ALTO',
}: ConfiguratorSketchProps) {
  const [view, setView] = useState<SketchView>('INTERIOR');
  const isDoubleLeaf = productType === 'ABATIBLE_DOS';
  const activeView: SketchView = isDoubleLeaf ? 'INTERIOR' : view;
  const isSliding = productType === 'CORREDERA';
  const isFence = productType === 'VALLA';
  const totalWidth = Math.max(widthMm, 1);
  const totalHeight = Math.max(heightMm, 1);
  const scale = Math.min(220 / totalWidth, 300 / totalHeight);
  const doorWidth = Math.max(54, Math.min(230, totalWidth * scale));
  const doorHeight = Math.max(90, Math.min(310, totalHeight * scale));
  const left = 150 - doorWidth / 2;
  const top = 172 - doorHeight / 2;
  const right = left + doorWidth;
  const bottom = top + doorHeight;
  const hingeX = hingeSide === 'LEFT' ? left + 9 : right - 9;
  const handleX = hingeSide === 'LEFT' ? right - 18 : left + 18;
  const openingDirection = openingSide === 'LEFT' ? -1 : 1;
  const arcPath = `M ${hingeX} ${top + doorHeight / 2} Q ${hingeX + openingDirection * doorWidth * 0.62} ${top - 16} ${hingeX + openingDirection * doorWidth * 0.82} ${top + doorHeight / 2}`;

  return (
    <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Croquis técnico</div>
          <div className="text-xs font-bold text-blue-700 mt-1">{modelLabel ?? 'Modelo'} · {activeView === 'INTERIOR' ? 'Vista interior' : 'Vista exterior'}</div>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Vista del croquis">
          {(['INTERIOR', 'EXTERIOR'] as SketchView[]).map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              disabled={isDoubleLeaf && option === 'EXTERIOR'}
              className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${activeView === option ? 'bg-blue-600 text-white' : 'text-slate-500'} ${isDoubleLeaf && option === 'EXTERIOR' ? 'opacity-40 cursor-not-allowed' : ''}`}
              aria-pressed={activeView === option}
            >
              {option === 'INTERIOR' ? 'Interior' : 'Exterior'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-[300px] overflow-visible rounded-xl border border-slate-200 bg-white p-3">
        <svg viewBox="0 0 300 340" className="w-full" role="img" aria-label={`Croquis ${activeView === 'INTERIOR' ? 'interior' : 'exterior'} de ${formatMm(widthMm)} por ${formatMm(heightMm)}`}>
          <defs>
            <marker id="aluon-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#64748b" /></marker>
          </defs>
          <rect x="34" y="20" width="232" height="304" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="4" />
          <line x1={left} y1={top} x2={left} y2={bottom} stroke="#0f172a" strokeWidth="3" />
          <line x1={right} y1={top} x2={right} y2={bottom} stroke="#0f172a" strokeWidth="3" />
          {isFence ? (
            <>
              <line x1={left + 8} y1={top} x2={left + 8} y2={bottom} stroke="#334155" strokeWidth="5" />
              <line x1={right - 8} y1={top} x2={right - 8} y2={bottom} stroke="#334155" strokeWidth="5" />
              {[0.25, 0.5, 0.75].map(ratio => <line key={ratio} x1={left + 11} y1={top + doorHeight * ratio} x2={right - 11} y2={top + doorHeight * ratio} stroke="#64748b" strokeWidth="3" />)}
          <text x="150" y={top - 8} textAnchor="middle" fontSize="9" fill="#475569">VALLA · TRAMO V{(sectionIndex ?? 0) + 1} / SOPORTES</text>
            </>
          ) : isDoubleLeaf ? (
            <>
              <path d={`M ${left + 5} ${top + 5} L 150 ${top + 5} L 150 ${bottom - 5} L ${left + 5} ${bottom - 5} Z`} fill={firstOpeningLeaf === 'LEFT' ? '#fef3c7' : '#f8fafc'} stroke={firstOpeningLeaf === 'LEFT' ? '#d97706' : '#cbd5e1'} strokeWidth={firstOpeningLeaf === 'LEFT' ? '2' : '1'} />
              <path d={`M 150 ${top + 5} L ${right - 5} ${top + 5} L ${right - 5} ${bottom - 5} L 150 ${bottom - 5} Z`} fill={firstOpeningLeaf === 'RIGHT' ? '#fef3c7' : '#f8fafc'} stroke={firstOpeningLeaf === 'RIGHT' ? '#d97706' : '#cbd5e1'} strokeWidth={firstOpeningLeaf === 'RIGHT' ? '2' : '1'} />
              <line x1={150} y1={top} x2={150} y2={bottom} stroke="#64748b" strokeWidth="2" strokeDasharray="4 3" />
              <line x1={left + 5} y1={top + 8} x2={150 - 7} y2={bottom - 8} stroke="#cbd5e1" strokeWidth="1" />
              <line x1={right - 5} y1={top + 8} x2={150 + 7} y2={bottom - 8} stroke="#cbd5e1" strokeWidth="1" />
              <text x="150" y={bottom + 17} textAnchor="middle" fontSize="9" fill="#475569">{firstOpeningLeaf ? `primera apertura ${firstOpeningLeaf === 'LEFT' ? 'izquierda' : 'derecha'}` : 'primera apertura pendiente'}</text>
            </>
          ) : (
            <rect x={left + 4} y={top + 4} width={Math.max(1, doorWidth - 8)} height={Math.max(1, doorHeight - 8)} fill={activeView === 'INTERIOR' ? '#e2e8f0' : '#cbd5e1'} stroke="#334155" strokeWidth="1.5" />
          )}
          {!isFence && <circle cx={hingeX} cy={top + 18} r="4" fill="#f59e0b" />}
          {!isSliding && !isFence && <rect x={handleX - 3} y={top + doorHeight / 2 - 4} width="6" height="8" rx="2" fill="#475569" />}
          {!isSliding && !isFence && <path d={arcPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#aluon-arrow)" />}
          {isSliding && <line x1={left - 34} y1={bottom + 11} x2={right + 34} y2={bottom + 11} stroke="#64748b" strokeWidth="3" />}
          <line x1={left} y1={bottom + 31} x2={right} y2={bottom + 31} stroke="#64748b" markerStart="url(#aluon-arrow)" markerEnd="url(#aluon-arrow)" />
          <text x="150" y={bottom + 47} textAnchor="middle" fontSize="10" fontWeight="700" fill="#475569">{formatMm(widthMm)}</text>
          <line x1={left - 26} y1={top} x2={left - 26} y2={bottom} stroke="#64748b" markerStart="url(#aluon-arrow)" markerEnd="url(#aluon-arrow)" />
          <text x={left - 39} y="174" textAnchor="middle" transform={`rotate(-90 ${left - 39} 174)`} fontSize="10" fontWeight="700" fill="#475569">{verticalDimensionLabel} · {formatMm(heightMm)}</text>
          <line x1={right + 20} y1={bottom - 1} x2={right + 20} y2={bottom + 14} stroke="#f59e0b" strokeWidth="2" />
          <text x={right + 25} y={bottom + 28} fontSize="9" fill="#92400e">{formatMm(groundClearanceMm)} holgura</text>
          <text x="150" y="14" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b">{activeView === 'INTERIOR' ? 'INTERIOR' : 'EXTERIOR'} · {isFence ? 'cerramiento' : openingSide === 'LEFT' ? 'apertura izquierda' : 'apertura derecha'}</text>
          {isSliding && <text x="150" y="326" textAnchor="middle" fontSize="8" fontWeight="700" fill="#92400e">Montaje {mountingType ?? '—'} · cota fabricación 25 cm · mín. {guideSystem === 'INTERIOR_ROLLERS_U' ? '5,5 cm' : '8 cm'}</text>}
        </svg>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] font-bold uppercase text-slate-500">
        <div><dt className="text-slate-400">Anchura total</dt><dd>{formatMm(widthMm)}</dd></div>
        <div><dt className="text-slate-400">{isFence ? `${verticalDimensionLabel === 'ANCHO' ? 'Ancho' : 'Alto'} vertical` : 'Altura total'}</dt><dd>{formatMm(heightMm)}</dd></div>
        {freePassageWidthMm !== undefined && <div><dt className="text-slate-400">Paso libre ancho</dt><dd>{formatMm(freePassageWidthMm)}</dd></div>}
        {freePassageHeightMm !== undefined && <div><dt className="text-slate-400">Paso libre alto</dt><dd>{formatMm(freePassageHeightMm)}</dd></div>}
        <div><dt className="text-slate-400">Bisagra</dt><dd>{hingeSide === 'LEFT' ? 'Izquierda' : 'Derecha'}</dd></div>
        <div><dt className="text-slate-400">Apertura</dt><dd>{openingSide === 'LEFT' ? 'Izquierda' : 'Derecha'}</dd></div>
        {isDoubleLeaf && <div><dt className="text-slate-400">Primera hoja</dt><dd>{firstOpeningLeaf === 'LEFT' ? 'Izquierda' : firstOpeningLeaf === 'RIGHT' ? 'Derecha' : 'Pendiente'}</dd></div>}
        {isSliding && <div><dt className="text-slate-400">Guía / referencias</dt><dd>Ø{guideSystem === 'INTERIOR_ROLLERS_U' ? '16/20 · U · 5,5 cm' : '16/20 · puente · 8 cm'} · 25 cm</dd></div>}
        {isFence && <div><dt className="text-slate-400">Tramo seleccionado</dt><dd>V{(sectionIndex ?? 0) + 1}</dd></div>}
      </dl>
    </div>
  );
}
