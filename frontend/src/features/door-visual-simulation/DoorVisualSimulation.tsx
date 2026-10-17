import { useDeferredValue } from 'react';
import { GoogleStreetViewExplorer } from './components/GoogleStreetViewExplorer';
import { MaskRectSelector } from './components/MaskRectSelector';
import { normalizeMapAddress, useDoorVisualSimulation } from './useDoorVisualSimulation';
import { DoorConfigurator } from './components/DoorConfigurator';
import { BudgetAssigner } from './components/BudgetAssigner';

export const DoorVisualSimulation = () => {
  const { state, actions } = useDoorVisualSimulation();
  const deferredAddress = useDeferredValue(normalizeMapAddress(state.address));
  const canShowMaskSelector = Boolean(state.baseImageUrl && state.baseImageWidth && state.baseImageHeight);

  return (
    <div className="w-full flex flex-col gap-6 rounded-[2rem] bg-gradient-to-br from-[#f8faf5] via-white to-[#f3f6fb] p-3 sm:p-5">
      <div className="flex flex-col gap-6">
        <section className="w-full overflow-hidden rounded-[1.75rem] border bg-white shadow-[0_24px_70px_-42px_rgba(15,23,42,.55)]" style={{ borderColor: '#e8eaed' }}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-[#f7faef] to-white px-5 py-5 sm:px-7">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[.22em] text-[#789333]">Simulador visual</p>
              <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Visualiza tu puerta en la fachada</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">Introduce una dirección, carga la fachada y configura el modelo paso a paso.</p>
            </div>
            <span className="rounded-full border border-[#dce9b2] bg-[#f5f9e7] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#5f7c26]">Paso 1 · Fachada</span>
          </div>
          <div className="p-5 sm:p-7">
          {(!canShowMaskSelector || !state.showMaskSelector) && (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f8f9fb] flex items-center justify-center text-[#8b949e]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                   <div>
              <label className="text-xs font-black uppercase tracking-widest" style={{ color: '#8b949e' }}>Dirección
              <input
                className="w-full rounded-xl border px-4 py-3 text-sm"
                placeholder="Ej: Calle Mayor 1, Madrid"
                value={state.address}
                onChange={e => actions.setAddress(e.target.value)}
                disabled={state.processing}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void actions.loadBaseImage();
                  }
                }}
              />
              </label>
            </div>
                </div>
                <button
                  type="button"
                  className="btn-primary px-4 py-2 rounded-xl text-xs tracking-widest shrink-0"
                  disabled={state.processing || state.viewerLoading || state.address.trim().length === 0}
                  onClick={() => void actions.loadBaseImage()}
                >
                  CARGAR SNAPSHOT
                </button>
              </div>

              <div className="relative h-[420px] overflow-hidden rounded-2xl border border-dashed bg-white shadow-inner md:h-[520px]" style={{ borderColor: '#dce4d4' }}>
                {state.baseImageUrl ? (
                  <img src={state.baseImageUrl} alt="Snapshot" className="w-full h-full object-contain bg-white" />
                ) : state.address.trim() === '' ? (
                  <img src="/background-visor.png" alt="Background Emulador" className="w-full h-full object-fill" />
                ) : state.mapsJavaScriptApiKey ? (
                  <GoogleStreetViewExplorer
                    apiKey={state.mapsJavaScriptApiKey}
                    address={deferredAddress}
                    heading={state.heading}
                    pitch={state.pitch}
                    onPositionChange={position => actions.setCoordinates(position?.lat ?? null, position?.lng ?? null)}
                    onPovChange={pov => {
                      actions.setHeading(pov.heading);
                      actions.setPitch(pov.pitch);
                    }}
                    onLoadingChange={actions.setViewerLoading}
                    onError={actions.setErrorMessage}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f7faef] via-white to-[#f3f6fb] px-6 text-center">
                    <div className="max-w-md rounded-2xl border border-amber-200 bg-white/90 p-6 shadow-lg">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">⌖</div>
                      <h2 className="text-base font-black text-slate-900">Visor interactivo pendiente de activar</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">Configura una clave de Google Maps para localizar la fachada y navegar por Street View.</p>
                      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-left font-mono text-[11px] text-slate-600">GOOGLE_MAPS_BROWSER_API_KEY</div>
                      <p className="mt-3 text-xs font-semibold text-amber-700">La simulación sigue disponible con una imagen de fachada ya cargada.</p>
                    </div>
                  </div>
                )}
              </div>

              {canShowMaskSelector && (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold" style={{ color: '#8b949e' }}>
                    Snapshot cargado. Continúa con el formulario o selecciona el rectángulo de la puerta.
                  </div>
                  <button
                    type="button"
                    className="btn-ghost px-4 py-2 rounded-xl text-xs tracking-widest shrink-0"
                    disabled={state.processing}
                    onClick={() => actions.setShowMaskSelector(true)}
                  >
                    SELECCIONAR PUERTA
                  </button>
                </div>
              )}
            </div>
          )}

          {canShowMaskSelector && state.showMaskSelector && (
            <div className="flex flex-col space-y-4">
              <div className="text-xs font-black uppercase tracking-widest shrink-0" style={{ color: '#8b949e' }}>
                Selecciona el rectángulo de la puerta
              </div>
              <div className="h-[420px] md:h-[520px] flex items-center justify-center overflow-hidden rounded-xl border bg-gray-50">
                <MaskRectSelector
                  imageUrl={state.baseImageUrl!}
                  disabled={state.processing}
                  value={state.maskRect}
                  onChange={actions.setMaskRect}
                  imageWidth={state.baseImageWidth!}
                  imageHeight={state.baseImageHeight!}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-ghost px-4 py-2 rounded-xl text-xs tracking-widest"
                  disabled={state.processing}
                  onClick={() => actions.setShowMaskSelector(false)}
                >
                  VOLVER
                </button>
              </div>
            </div>
          )}

          {state.resultImageUrl && (
            <div className="mt-6 flex flex-col space-y-3">
              <div className="text-xs font-black uppercase tracking-widest shrink-0" style={{ color: '#8b949e' }}>
                Resultado
              </div>
              <div className="h-[420px] md:h-[520px] flex items-center justify-center overflow-hidden rounded-xl border bg-gray-50">
                <img src={state.resultImageUrl} alt="Resultado" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          )}
          </div>
        </section>

        <section className="w-full overflow-hidden rounded-[1.75rem] border bg-white shadow-[0_24px_70px_-42px_rgba(15,23,42,.55)]" style={{ borderColor: '#e8eaed' }}>
          <div className="border-b border-slate-100 bg-gradient-to-r from-white to-[#f7faef] px-5 py-5 sm:px-7">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[.22em] text-[#789333]">Configuración</p>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Diseña la puerta antes de simularla</h2>
            <p className="mt-1 text-sm text-slate-500">Cada sección guarda tu elección y te guía hasta la revisión final.</p>
          </div>
          <div className="space-y-4">
            <div className="pt-1">
              <div className="text-xs font-black uppercase tracking-widest" style={{ color: '#8b949e' }}>
                Street View (preview)
              </div>
              {state.baseImageUrl ? (
                <img
                  src={state.baseImageUrl}
                  alt="Google Street View"
                  className="mt-3 w-full h-auto rounded-xl border"
                />
              ) : (
                <div className="mt-3 h-[160px] flex items-center justify-center rounded-xl border border-dashed" style={{ color: '#8b949e', borderColor: '#e8eaed' }}>
                  Sin fachada cargada
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-dashed" style={{ borderColor: '#e8eaed' }}>
              <DoorConfigurator state={state} actions={actions} />
            </div>

            <button
              type="button"
              className="btn-primary w-full flex items-center justify-center gap-2 rounded-2xl border-b border-white/50 py-4 text-xs tracking-widest shadow-lg"
              disabled={state.processing || !state.jobId || !state.baseImageUrl || !state.maskRect}
              onClick={() => void actions.startInpaint()}
            >
              <span>{state.processing ? 'PROCESANDO...' : 'SIMULAR PUERTA'}</span>
              {!state.processing && (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/>
                  <path d="M2 20h20"/>
                  <path d="M14 12v.01"/>
                </svg>
              )}
              {state.processing && (
                <svg className="w-4 h-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </button>

            {state.status && (
              <div className="text-xs font-bold" style={{ color: '#8b949e' }}>
                Estado: <span style={{ color: '#0d1117' }}>{state.status}</span>
              </div>
            )}
            {state.error && (
              <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>
                {state.error}
              </div>
            )}

            <BudgetAssigner state={state} actions={actions} />
          </div>
        </section>
      </div>
    </div>
  );
};
