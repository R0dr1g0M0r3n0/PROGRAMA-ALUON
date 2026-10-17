import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DoorSimulationJobStatus, DoorVisualSimulationActions, DoorVisualSimulationViewState, MaskRect, PedestrianDoorConfig } from './DoorVisualSimulation.types';
import { createDoorSimulationJob, getDoorSimulationFrontendConfig, getDoorSimulationStatus, startDoorSimulationInpaint } from './doorVisualSimulationApi';

const clampInt = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, Math.round(value)));

const validateMaskRect = (rect: MaskRect, imageWidth: number, imageHeight: number): MaskRect => {
  const x = clampInt(rect.x, 0, imageWidth - 1);
  const y = clampInt(rect.y, 0, imageHeight - 1);
  const width = clampInt(rect.width, 1, imageWidth - x);
  const height = clampInt(rect.height, 1, imageHeight - y);
  return { x, y, width, height };
};

/**
 * Completa consultas españolas para que Google no resuelva una calle/número
 * homónimo en otro municipio. No cambia el texto que ve el usuario.
 */
export const normalizeMapAddress = (value: string): string => {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  let normalized = trimmed;
  if (/pantoja\s*,?\s*toledo/i.test(normalized)) {
    // Google identifica esta vía en Pantoja como "C. Pilar".
    normalized = normalized.replace(/calle\s+del\s+pilar|calle\s+pilar/gi, 'Calle Pilar');
    if (!/\b45290\b/.test(normalized)) {
      normalized = normalized.replace(/(pantoja\s*,?\s*toledo)/i, '$1, 45290');
    }
  }
  if (!/\b(españa|spain)\b/i.test(normalized)) {
    normalized = `${normalized}, España`;
  }
  return normalized;
};

export const useDoorVisualSimulation = (): { state: DoorVisualSimulationViewState; actions: DoorVisualSimulationActions } => {
  const initialPedestrianConfig = useMemo<PedestrianDoorConfig>(() => ({
    productFamily: 'CANCELAS_ALUMINIO_SOLDADO', colorFinish: '',
    marinePrimer: '', opening: '', widthMm: 1000, leafHeightMm: 1210, leftLeafHeightMm: 1210, rightLeafHeightMm: 1210,
    rightPostHeightMm: 1000, leftPostHeightMm: 1000, rightGroundClearanceMm: 10, leftGroundClearanceMm: 10,
    lowerFalseo: '', lintel: '', anchor: '', hinge: '', structuralPillar: '', electricStrike: '', exteriorPull: '',
    interiorHandle: '', mailbox: '', customerReference: '', delivery: '', customerProposal: false, installationCost: false, notes: '',
  }), []);
  const [address, setAddress] = useState('');
  const [imageSize, setImageSize] = useState<'640x640' | '512x512'>('640x640');
  const [fov, setFov] = useState(90);
  const [heading, setHeading] = useState<number | null>(null);
  const [pitch, setPitch] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [mapsJavaScriptApiKey, setMapsJavaScriptApiKey] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [doorModel, setDoorModel] = useState('');
  const [doorType, setDoorType] = useState('');
  const [doorColor, setDoorColor] = useState('');
  const [pedestrian, setPedestrian] = useState<PedestrianDoorConfig>(initialPedestrianConfig);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);
  const [baseImageWidth, setBaseImageWidth] = useState<number | null>(null);
  const [baseImageHeight, setBaseImageHeight] = useState<number | null>(null);
  const [showMaskSelector, setShowMaskSelector] = useState(false);
  const [maskRect, setMaskRect] = useState<MaskRect | null>(null);
  const [status, setStatus] = useState<DoorSimulationJobStatus | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollTimer = useRef<number | null>(null);
  const pollDelayMs = useRef(1500);
  const stopped = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollTimer.current != null) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getDoorSimulationFrontendConfig()
      .then(config => {
        if (!cancelled) {
          setMapsJavaScriptApiKey(config.mapsJavaScriptApiKey || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMapsJavaScriptApiKey(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      stopped.current = true;
      stopPolling();
    };
  }, [stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setError(null);
    setProcessing(false);
    setJobId(null);
    setBaseImageUrl(null);
    setBaseImageWidth(null);
    setBaseImageHeight(null);
    setShowMaskSelector(false);
    setMaskRect(null);
    setStatus(null);
    setResultImageUrl(null);
    pollDelayMs.current = 1500;
    setImageSize('640x640');
    setFov(90);
    setHeading(null);
    setPitch(null);
    setLatitude(null);
    setLongitude(null);
    setViewerLoading(false);
    setDoorModel('');
    setDoorType('');
    setDoorColor('');
    setPedestrian(initialPedestrianConfig);
    setSelectedBudgetId(null);
  }, [initialPedestrianConfig, stopPolling]);

  const loadBaseImage = useCallback(async () => {
    stopPolling();
    setError(null);
    setProcessing(true);
    setResultImageUrl(null);
    setMaskRect(null);
    setShowMaskSelector(false);
    setStatus(null);
    try {
      const resp = await createDoorSimulationJob({
        address: normalizeMapAddress(address),
        imageSize,
        fov,
        heading,
        pitch,
        latitude,
        longitude,
      });
      setJobId(resp.jobId);
      setBaseImageUrl(resp.baseImageUrl);
      setBaseImageWidth(resp.imageWidth);
      setBaseImageHeight(resp.imageHeight);
      setStatus(resp.status);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      setError(message);
    } finally {
      setProcessing(false);
    }
  }, [address, fov, heading, imageSize, latitude, longitude, pitch, stopPolling]);

  const pollOnce = useCallback(async (id: string) => {
    try {
      const res = await getDoorSimulationStatus(id);
      setStatus(res.status);
      setBaseImageUrl(res.baseImageUrl);
      setResultImageUrl(res.resultImageUrl);
      if (res.status === 'DONE') {
        setProcessing(false);
        stopPolling();
        return;
      }
      if (res.status === 'FAILED') {
        setProcessing(false);
        stopPolling();
        setError(res.errorMessage || 'Falló la simulación');
        return;
      }

      pollDelayMs.current = Math.min(5000, Math.round(pollDelayMs.current * 1.25));
      pollTimer.current = window.setTimeout(() => {
        if (stopped.current) return;
        void pollOnce(id);
      }, pollDelayMs.current);
    } catch (e) {
      setProcessing(false);
      stopPolling();
      const message = e instanceof Error ? e.message : 'Error consultando el estado';
      setError(message);
    }
  }, [stopPolling]);

  const startInpaint = useCallback(async () => {
    if (!jobId) {
      setError('Primero carga una fachada');
      return;
    }
    if (!maskRect) {
      setError('Selecciona el rectángulo de la puerta');
      return;
    }
    if (!baseImageWidth || !baseImageHeight) {
      setError('Dimensiones de la imagen base no disponibles');
      return;
    }
    if (!pedestrian.opening) {
      setError('Selecciona el sentido de apertura de la puerta peatonal');
      return;
    }
    if ([pedestrian.widthMm, pedestrian.leafHeightMm, pedestrian.leftLeafHeightMm, pedestrian.rightLeafHeightMm, pedestrian.leftPostHeightMm, pedestrian.rightPostHeightMm, pedestrian.leftGroundClearanceMm, pedestrian.rightGroundClearanceMm].some(value => !Number.isFinite(value) || value <= 0)) {
      setError('Las medidas de la puerta peatonal deben ser valores positivos');
      return;
    }
    stopPolling();
    setError(null);
    setProcessing(true);
    setResultImageUrl(null);

    try {
      const safeRect = validateMaskRect(maskRect, baseImageWidth, baseImageHeight);
      const resp = await startDoorSimulationInpaint(jobId, {
        maskRect: safeRect,
        prompt: prompt.trim() || undefined,
        negativePrompt: negativePrompt.trim() || undefined,
      });
      setStatus(resp.status);
      pollDelayMs.current = resp.pollAfterMs;
      pollTimer.current = window.setTimeout(() => {
        if (stopped.current) return;
        void pollOnce(jobId);
      }, pollDelayMs.current);
    } catch (e) {
      setProcessing(false);
      const message = e instanceof Error ? e.message : 'Error iniciando el inpainting';
      setError(message);
    }
  }, [baseImageHeight, baseImageWidth, jobId, maskRect, negativePrompt, pedestrian, pollOnce, prompt, stopPolling]);

  useEffect(() => {
    if (!doorModel && !doorType && !doorColor) return;
    
    const elements = [];
    if (doorModel) elements.push(`${doorModel.toLowerCase()} style`);
    if (doorColor) elements.push(`${doorColor.toLowerCase()} color`);
    if (doorType) elements.push(`${doorType.toLowerCase()}`);
    if (pedestrian.opening) elements.push(`puerta peatonal ${pedestrian.opening.replace(/_/g, ' ').toLowerCase()}`);
    if (pedestrian.marinePrimer === 'YES') elements.push('marine primer protection');
    if (pedestrian.widthMm > 0 && pedestrian.leafHeightMm > 0) elements.push(`${pedestrian.widthMm}mm wide ${pedestrian.leafHeightMm}mm high`);
    if (pedestrian.exteriorPull === 'STANDARD') elements.push('standard exterior pull handle');
    if (pedestrian.exteriorPull === 'LEVER') elements.push('standard exterior lever');
    if (pedestrian.interiorHandle === 'INOX_KNOB') elements.push('stainless steel interior knob');
    if (pedestrian.electricStrike === 'YES') elements.push('electric strike');
    if (pedestrian.lintel === 'CLOSED') elements.push('closed lintel');
    if (pedestrian.lintel === 'OPEN') elements.push('open lintel');
    
    const newPrompt = `A high quality, realistic replacement house door, ${elements.join(', ')}, clear daytime lighting, photorealistic, 8k resolution, architectural photography`;
    setPrompt(newPrompt);
  }, [doorModel, doorType, doorColor, pedestrian]);

  const state = useMemo<DoorVisualSimulationViewState>(() => ({
    address,
    imageSize,
    fov,
    heading,
    pitch,
    latitude,
    longitude,
    mapsJavaScriptApiKey,
    viewerLoading,
    prompt,
    negativePrompt,
    doorModel,
    doorType,
    doorColor,
    pedestrian,
    selectedBudgetId,
    jobId,
    baseImageUrl,
    baseImageWidth,
    baseImageHeight,
    showMaskSelector,
    maskRect,
    status,
    processing,
    resultImageUrl,
    error,
  }), [address, baseImageHeight, baseImageUrl, baseImageWidth, error, fov, heading, imageSize, jobId, latitude, longitude, mapsJavaScriptApiKey, maskRect, negativePrompt, doorModel, doorType, doorColor, pedestrian, selectedBudgetId, pitch, processing, prompt, resultImageUrl, showMaskSelector, status, viewerLoading]);

  const actions = useMemo<DoorVisualSimulationActions>(() => ({
    setAddress,
    setImageSize,
    setFov,
    setHeading,
    setPitch,
    setCoordinates: (nextLatitude: number | null, nextLongitude: number | null) => {
      setLatitude(nextLatitude);
      setLongitude(nextLongitude);
    },
    setViewerLoading,
    setErrorMessage: setError,
    setPrompt,
    setNegativePrompt,
    setDoorModel,
    setDoorType,
    setDoorColor,
    setPedestrianConfig: (patch: Partial<PedestrianDoorConfig>) => setPedestrian(current => ({ ...current, ...patch })),
    setSelectedBudgetId,
    setMaskRect,
    setShowMaskSelector,
    loadBaseImage,
    startInpaint,
    reset,
  }), [loadBaseImage, reset, startInpaint]);

  return { state, actions };
};
