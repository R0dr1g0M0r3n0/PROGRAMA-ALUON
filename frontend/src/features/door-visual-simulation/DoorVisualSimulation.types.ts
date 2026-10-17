export type DoorSimulationJobStatus = 'AWAITING_MASK' | 'PROCESSING' | 'DONE' | 'FAILED';

export type CreateDoorSimulationRequest = {
  address: string;
  imageSize?: '640x640' | '512x512';
  fov?: number;
  heading?: number | null;
  pitch?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type CreateDoorSimulationResponse = {
  jobId: string;
  status: DoorSimulationJobStatus;
  baseImageUrl: string;
  imageWidth: number;
  imageHeight: number;
};

export type MaskRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StartInpaintRequest = {
  maskRect: MaskRect;
  prompt?: string;
  negativePrompt?: string;
};

export type StartInpaintResponse = {
  jobId: string;
  status: DoorSimulationJobStatus;
  pollAfterMs: number;
};

export type DoorSimulationStatusResponse = {
  jobId: string;
  status: DoorSimulationJobStatus;
  baseImageUrl: string | null;
  resultImageUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DoorSimulationFrontendConfig = {
  enabled: boolean;
  mapsJavaScriptApiKey: string;
};

export type PedestrianDoorConfig = {
  productFamily: string;
  colorFinish: string;
  marinePrimer: 'YES' | 'NO' | '';
  opening: 'INTERIOR_RIGHT' | 'INTERIOR_RIGHT_BEHIND_WALL' | 'INTERIOR_LEFT_BEHIND_WALL' | '';
  widthMm: number;
  leafHeightMm: number;
  leftLeafHeightMm: number;
  rightLeafHeightMm: number;
  rightPostHeightMm: number;
  leftPostHeightMm: number;
  rightGroundClearanceMm: number;
  leftGroundClearanceMm: number;
  lowerFalseo: 'YES' | 'NO' | '';
  lintel: 'CLOSED' | 'OPEN' | '';
  anchor: string;
  hinge: string;
  structuralPillar: 'NONE' | 'RIGHT' | 'LEFT' | 'BOTH' | '';
  electricStrike: 'YES' | 'NO' | '';
  exteriorPull: 'NONE' | 'STANDARD' | 'LEVER' | '';
  interiorHandle: 'NONE' | 'STANDARD' | 'INOX_KNOB' | '';
  mailbox: 'YES' | 'NO' | '';
  customerReference: string;
  delivery: string;
  customerProposal: boolean;
  installationCost: boolean;
  notes: string;
};

export type DoorVisualSimulationViewState = {
  address: string;
  imageSize: '640x640' | '512x512';
  fov: number;
  heading: number | null;
  pitch: number | null;
  latitude: number | null;
  longitude: number | null;
  mapsJavaScriptApiKey: string | null;
  viewerLoading: boolean;
  prompt: string;
  negativePrompt: string;
  doorModel: string;
  doorType: string;
  doorColor: string;
  pedestrian: PedestrianDoorConfig;
  selectedBudgetId: string | null;
  jobId: string | null;
  baseImageUrl: string | null;
  baseImageWidth: number | null;
  baseImageHeight: number | null;
  showMaskSelector: boolean;
  maskRect: MaskRect | null;
  status: DoorSimulationJobStatus | null;
  processing: boolean;
  resultImageUrl: string | null;
  error: string | null;
};

export type DoorVisualSimulationActions = {
  setAddress: (value: string) => void;
  setImageSize: (value: '640x640' | '512x512') => void;
  setFov: (value: number) => void;
  setHeading: (value: number | null) => void;
  setPitch: (value: number | null) => void;
  setCoordinates: (latitude: number | null, longitude: number | null) => void;
  setViewerLoading: (value: boolean) => void;
  setErrorMessage: (value: string | null) => void;
  setPrompt: (value: string) => void;
  setNegativePrompt: (value: string) => void;
  setDoorModel: (value: string) => void;
  setDoorType: (value: string) => void;
  setDoorColor: (value: string) => void;
  setPedestrianConfig: (patch: Partial<PedestrianDoorConfig>) => void;
  setSelectedBudgetId: (value: string | null) => void;
  setMaskRect: (value: MaskRect | null) => void;
  setShowMaskSelector: (value: boolean) => void;
  loadBaseImage: () => Promise<void>;
  startInpaint: () => Promise<void>;
  reset: () => void;
};
