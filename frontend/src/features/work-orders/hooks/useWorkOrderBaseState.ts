import { useCallback, useEffect, useReducer, useState } from 'react';
import { fetchWorkOrderRequests } from '../services/requestsApi';
import type { TabKey, WorkOrderRequest } from '../models';

type WorkOrderBaseState = {
  requests: WorkOrderRequest[];
  customerId: string;
  modelId: string;
  modelReference: string;
  modelImage: File | null;
  m2: number;
  googleView: boolean;
  notes: string;
  developmentGenerated: boolean;
  prodCut: boolean;
  prodFab: boolean;
  prodLac: boolean;
  prodLacControl: boolean;
  finalized: boolean;
  ready: 'PICKUP' | 'SHIPPING' | '';
  selectedRequestId: string | null;
  tab: TabKey;
  showRequestModal: boolean;
  showWorkOrderModal: boolean;
};

type WorkOrderBaseAction<K extends keyof WorkOrderBaseState = keyof WorkOrderBaseState> =
  | {
      type: 'SET_FIELD';
      field: K;
      value: WorkOrderBaseState[K];
    }
  | {
      type: 'SET_REQUESTS';
      value: WorkOrderRequest[] | ((prev: WorkOrderRequest[]) => WorkOrderRequest[]);
    };

const initialState: WorkOrderBaseState = {
  requests: [],
  customerId: '',
  modelId: '',
  modelReference: '',
  modelImage: null,
  m2: 0,
  googleView: false,
  notes: '',
  developmentGenerated: false,
  prodCut: false,
  prodFab: false,
  prodLac: false,
  prodLacControl: false,
  finalized: false,
  ready: '',
  selectedRequestId: null,
  tab: 'INBOX',
  showRequestModal: false,
  showWorkOrderModal: false,
};

const reducer = (state: WorkOrderBaseState, action: WorkOrderBaseAction) => {
  if (action.type === 'SET_FIELD') {
    if (state[action.field] === action.value) {
      return state;
    }
    return { ...state, [action.field]: action.value };
  }
  if (action.type === 'SET_REQUESTS') {
    const nextValue = typeof action.value === 'function' ? action.value(state.requests) : action.value;
    if (state.requests === nextValue) {
      return state;
    }
    return { ...state, requests: nextValue };
  }
  return state;
};

export const useWorkOrderBaseState = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const reloadRequests = useCallback(async () => {
    setIsRefreshing(true);
    const load = async () => {
      try {
        const requests = await fetchWorkOrderRequests();
        dispatch({ type: 'SET_REQUESTS', value: requests });
      } catch (error) {
        console.error('[work-orders] Failed to load requests', error);
      } finally {
        setIsRefreshing(false);
      }
    };
    await load();
  }, []);

  useEffect(() => {
    void reloadRequests();
  }, [reloadRequests]);

  const setField = useCallback(
    <K extends keyof WorkOrderBaseState>(field: K, value: WorkOrderBaseState[K]) => {
      dispatch({ type: 'SET_FIELD', field, value });
    },
    [],
  );

  const setRequests = useCallback(
    (value: WorkOrderRequest[] | ((prev: WorkOrderRequest[]) => WorkOrderRequest[])) => {
      dispatch({ type: 'SET_REQUESTS', value });
    },
    [],
  );

  const setCustomerId = useCallback((value: string) => setField('customerId', value), [setField]);
  const setModelId = useCallback((value: string) => setField('modelId', value), [setField]);
  const setModelReference = useCallback((value: string) => setField('modelReference', value), [setField]);
  const setModelImage = useCallback((value: File | null) => setField('modelImage', value), [setField]);
  const setM2 = useCallback((value: number) => setField('m2', value), [setField]);
  const setGoogleView = useCallback((value: boolean) => setField('googleView', value), [setField]);
  const setNotes = useCallback((value: string) => setField('notes', value), [setField]);
  const setDevelopmentGenerated = useCallback((value: boolean) => setField('developmentGenerated', value), [setField]);
  const setProdCut = useCallback((value: boolean) => setField('prodCut', value), [setField]);
  const setProdFab = useCallback((value: boolean) => setField('prodFab', value), [setField]);
  const setProdLac = useCallback((value: boolean) => setField('prodLac', value), [setField]);
  const setProdLacControl = useCallback((value: boolean) => setField('prodLacControl', value), [setField]);
  const setFinalized = useCallback((value: boolean) => setField('finalized', value), [setField]);
  const setReady = useCallback((value: 'PICKUP' | 'SHIPPING' | '') => setField('ready', value), [setField]);
  const setSelectedRequestId = useCallback((value: string | null) => setField('selectedRequestId', value), [setField]);
  const setTab = useCallback((value: TabKey) => setField('tab', value), [setField]);
  const setShowRequestModal = useCallback((value: boolean) => setField('showRequestModal', value), [setField]);
  const setShowWorkOrderModal = useCallback((value: boolean) => setField('showWorkOrderModal', value), [setField]);

  return {
    requests: state.requests,
    reloadRequests,
    isRefreshing,
    setRequests,
    customerId: state.customerId,
    setCustomerId,
    modelId: state.modelId,
    setModelId,
    modelReference: state.modelReference,
    setModelReference,
    modelImage: state.modelImage,
    setModelImage,
    m2: state.m2,
    setM2,
    googleView: state.googleView,
    setGoogleView,
    notes: state.notes,
    setNotes,
    developmentGenerated: state.developmentGenerated,
    setDevelopmentGenerated,
    prodCut: state.prodCut,
    setProdCut,
    prodFab: state.prodFab,
    setProdFab,
    prodLac: state.prodLac,
    setProdLac,
    prodLacControl: state.prodLacControl,
    setProdLacControl,
    finalized: state.finalized,
    setFinalized,
    ready: state.ready,
    setReady,
    selectedRequestId: state.selectedRequestId,
    setSelectedRequestId,
    tab: state.tab,
    setTab,
    showRequestModal: state.showRequestModal,
    setShowRequestModal,
    showWorkOrderModal: state.showWorkOrderModal,
    setShowWorkOrderModal,
  };
};

export type UseWorkOrderBaseStateResult = ReturnType<typeof useWorkOrderBaseState>;
