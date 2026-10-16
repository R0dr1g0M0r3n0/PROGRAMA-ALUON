import { useDeferredValue } from 'react';
import logo from '../../assets/logo.png';
import { GoogleStreetViewExplorer } from './components/GoogleStreetViewExplorer';
import { MaskRectSelector } from './components/MaskRectSelector';
import { useDoorVisualSimulation } from './useDoorVisualSimulation';
import { DoorConfigurator } from './components/DoorConfigurator';
import { BudgetAssigner } from './components/BudgetAssigner';

const logoOverlayStyle = {
  filter: 'invert(1) drop-shadow(0 0 2px rgba(255,255,255,0.95)) drop-shadow(1px 0 0 rgba(255,255,255,0.95)) drop-shadow(-1px 0 0 rgba(255,255,255,0.95)) drop-shadow(0 1px 0 rgba(255,255,255,0.95)) drop-shadow(0 -1px 0 rgba(255,255,255,0.95))',
} as const;

export const DoorVisualSimulation = () => {
  const { state, actions } = useDoorVisualSimulation();
  const deferredAddress = useDeferredValue(state.address);
  const canShowMaskSelector = Boolean(state.baseImageUrl && state.baseImageWidth && state.baseImageHeight);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <section className="w-full bg-white rounded-2xl border flex flex-col overflow-hidden" style={{ borderColor: '#e8eaed' }}>
          {(!canShowMaskSelector || !state.showMaskSelector) && (
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col gap-4 p-5 pb-4">
                <div className="flex flex-col gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#f8f9fb] flex items-center justify-center text-[#8b949e]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-black uppercase tracking-widest" style={{ color: '#8b949e' }}>
                      <span className="shrink-0 whitespace-nowrap">Dirección</span>
                      <input
                        className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm"
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
                    <button
                      type="button"
                      className="btn-primary px-4 py-2 rounded-xl text-xs tracking-widest shrink-0 whitespace-nowrap"
                      disabled={state.processing || state.viewerLoading || state.address.trim().length === 0}
                      onClick={() => void actions.loadBaseImage()}
                    >
                      CARGAR SNAPSHOT
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative mx-5 h-[460px] md:h-[560px] overflow-hidden rounded-xl border border-dashed bg-white" style={{ borderColor: '#e8eaed' }}>
                <img
                  src={logo}
                  alt="Aluon"
                  className="pointer-events-none absolute top-4 right-4 z-10 w-28 md:w-32 object-contain opacity-95 drop-shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
                  style={logoOverlayStyle}
                />
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
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold" style={{ color: '#8b949e' }}>
                    Falta configurar `GOOGLE_MAPS_BROWSER_API_KEY` o `GOOGLE_STREET_VIEW_API_KEY` para el visor interactivo.
                  </div>
                )}
              </div>

              {canShowMaskSelector && (
                <div className="flex items-center justify-between gap-3 px-5">
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
            <div className="flex flex-col space-y-4 px-5 pb-5">
              <div className="text-xs font-black uppercase tracking-widest shrink-0" style={{ color: '#8b949e' }}>
                Selecciona el rectángulo de la puerta
              </div>
              <div className="relative h-[460px] md:h-[560px] flex items-center justify-center overflow-hidden rounded-xl border bg-gray-50">
                <img
                  src={logo}
                  alt="Aluon"
                  className="pointer-events-none absolute top-4 right-4 z-10 w-28 md:w-32 object-contain opacity-95 drop-shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
                  style={logoOverlayStyle}
                />
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
            <div className="px-5 pb-5">
              <div className="mt-6 flex flex-col space-y-3">
                <div className="text-xs font-black uppercase tracking-widest shrink-0" style={{ color: '#8b949e' }}>
                  Resultado
                </div>
                <div className="relative h-[460px] md:h-[560px] flex items-center justify-center overflow-hidden rounded-xl border bg-gray-50">
                <img
                  src={logo}
                  alt="Aluon"
                  className="pointer-events-none absolute top-4 right-4 z-10 w-28 md:w-32 object-contain opacity-95 drop-shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
                  style={logoOverlayStyle}
                />
                  <img src={state.resultImageUrl} alt="Resultado" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="w-full bg-white rounded-2xl p-5 border flex flex-col" style={{ borderColor: '#e8eaed' }}>
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
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-xl text-xs tracking-widest border-b border-white/50 shadow-sm"
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
