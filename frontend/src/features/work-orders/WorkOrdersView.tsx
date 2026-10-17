import type { UseWorkOrdersResult } from './hooks/useWorkOrders';
import type { UseProductionStationsResult } from './hooks/useProductionStations';
import { useMemo, useState } from 'react';
import { WorkOrdersTabs } from './components/WorkOrdersTabs';
import { WorkOrdersBody } from './components/WorkOrdersBody';
import { useWorkOrdersViewModel } from './hooks/useWorkOrdersViewModel';
import { updateWorkOrderWorkflowStep } from './services/requestsApi';
import AuthorizationDialog from '../../components/feedback/AuthorizationDialog';
import ErrorDialog from '../../components/feedback/ErrorDialog';
import ConfirmDialog from '../../components/feedback/ConfirmDialog';

export const WorkOrdersView = ({ ctx, production }: { ctx: UseWorkOrdersResult; production: UseProductionStationsResult }) => {
  const INBOX = 'INBOX' as UseWorkOrdersResult['tab'];
  const { dev, onOpenNewRequest } = useWorkOrdersViewModel(ctx);
  const [pendingTab, setPendingTab] = useState<UseWorkOrdersResult['tab'] | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [workflowError, setWorkflowError] = useState('');
  const [navigationWarning, setNavigationWarning] = useState('');
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);
  const [pendingAdvance, setPendingAdvance] = useState<UseWorkOrdersResult['tab'] | null>(null);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  const workflowOrder = useMemo<UseWorkOrdersResult['tab'][]>(
    () => ['INBOX', 'REQUEST', 'BUDGET', 'VALIDATION', 'DEV', 'PROD', 'FINAL'],
    [],
  );

  const isBackwardTransition = (from: UseWorkOrdersResult['tab'], to: UseWorkOrdersResult['tab']) => (
    workflowOrder.indexOf(to) < workflowOrder.indexOf(from)
  );

  const isForwardTransition = (from: UseWorkOrdersResult['tab'], to: UseWorkOrdersResult['tab']) => (
    workflowOrder.indexOf(to) > workflowOrder.indexOf(from)
  );

  const nextStep = useMemo(() => {
    const currentIndex = workflowOrder.indexOf(ctx.tab);
    if (currentIndex === -1 || currentIndex >= workflowOrder.length - 1) return null;
    return workflowOrder[currentIndex + 1];
  }, [ctx.tab, workflowOrder]);

  const currentCustomerName = useMemo(() => {
    const customer = ctx.customers.find(c => c.id === ctx.customerId);
    return customer?.nombreComercial || customer?.razonSocial || '';
  }, [ctx.customers, ctx.customerId]);

  const selectedRequest = useMemo(
    () => ctx.requests.find(req => req.id === ctx.selectedRequestId) ?? null,
    [ctx.requests, ctx.selectedRequestId],
  );

  const isDirtyRequest = useMemo(() => {
    if (ctx.tab !== 'REQUEST') return false;
    if (!selectedRequest) return false;
    const selectedReference = (selectedRequest.reference ?? '').toUpperCase();
    const currentReference = (ctx.modelReference ?? '').toUpperCase();
    const customerMismatch = selectedRequest.customerId
      ? (ctx.customerId && selectedRequest.customerId !== ctx.customerId)
      : (currentCustomerName && selectedRequest.customerName && currentCustomerName !== selectedRequest.customerName);
    return Boolean(
      customerMismatch
      || selectedRequest.modelId !== ctx.modelId
      || Number(selectedRequest.m2) !== Number(ctx.m2)
      || selectedReference !== currentReference
      || Boolean(selectedRequest.googleView) !== Boolean(ctx.googleView)
      || (selectedRequest.notes ?? '') !== (ctx.notes ?? '')
      || ctx.modelImage
    );
  }, [
    ctx.tab,
    selectedRequest,
    ctx.customerId,
    currentCustomerName,
    ctx.modelId,
    ctx.m2,
    ctx.modelReference,
    ctx.googleView,
    ctx.notes,
    ctx.modelImage,
  ]);

  const dirtyFields = useMemo(() => {
    if (!selectedRequest || ctx.tab !== 'REQUEST') return [];
    const fields: string[] = [];
    const selectedReference = (selectedRequest.reference ?? '').toUpperCase();
    const currentReference = (ctx.modelReference ?? '').toUpperCase();
    const customerMismatch = selectedRequest.customerId
      ? (ctx.customerId && selectedRequest.customerId !== ctx.customerId)
      : (currentCustomerName && selectedRequest.customerName && currentCustomerName !== selectedRequest.customerName);
    if (customerMismatch) fields.push('Cliente');
    if (selectedRequest.modelId !== ctx.modelId) fields.push('Modelo');
    if (Number(selectedRequest.m2) !== Number(ctx.m2)) fields.push('m²');
    if (selectedReference !== currentReference) fields.push('Referencia del modelo');
    if (Boolean(selectedRequest.googleView) !== Boolean(ctx.googleView)) fields.push('Google View');
    if ((selectedRequest.notes ?? '') !== (ctx.notes ?? '')) fields.push('Notas');
    if (ctx.modelImage) fields.push('Imagen del modelo');
    return fields;
  }, [
    selectedRequest,
    ctx.tab,
    ctx.customerId,
    currentCustomerName,
    ctx.modelId,
    ctx.m2,
    ctx.modelReference,
    ctx.googleView,
    ctx.notes,
    ctx.modelImage,
  ]);

  const advanceBlockReason = useMemo(() => {
    if (!nextStep) return 'No hay una etapa posterior.';
    if (!ctx.selectedRequestId) return 'Selecciona una solicitud antes de avanzar.';
    switch (nextStep) {
      case 'REQUEST':
        return null;
      case 'BUDGET':
        if (!ctx.customerId || ctx.m2 <= 0 || !ctx.hasModelRef) {
          return 'Completa cliente, m² y referencia del modelo antes de presupuestar.';
        }
        return null;
      case 'VALIDATION':
        if (!ctx.budgetGenerated || !ctx.accountingApproved) {
          return 'Genera el presupuesto y apruébalo en contabilidad antes de validar.';
        }
        return null;
      case 'DEV':
        if (!ctx.adminApproved) {
          return 'El presupuesto debe estar aprobado por ADMIN antes de pasar a desarrollo.';
        }
        return null;
      case 'PROD':
        if (!ctx.developmentGenerated || !ctx.cutlistGenerated) {
          return 'Genera desarrollo y despiece antes de iniciar producción.';
        }
        return null;
      case 'FINAL':
        if (!production.allCompleted) {
          return 'Completa todas las estaciones de producción antes de finalizar.';
        }
        return null;
      default:
        return null;
    }
  }, [
    nextStep,
    ctx.selectedRequestId,
    ctx.customerId,
    ctx.m2,
    ctx.hasModelRef,
    ctx.budgetGenerated,
    ctx.accountingApproved,
    ctx.adminApproved,
    ctx.developmentGenerated,
    ctx.cutlistGenerated,
    production.allCompleted,
  ]);

  const persistWorkflowStep = async (
    nextTab: UseWorkOrdersResult['tab'],
    authorizerUserId?: string,
    options: { skipPersist?: boolean } = {},
  ) => {
    if (!ctx.selectedRequestId || ctx.tab === nextTab) return true;
    if (options.skipPersist) return true;
    try {
      await updateWorkOrderWorkflowStep(ctx.selectedRequestId, nextTab, authorizerUserId);
      ctx.setRequests(prev => prev.map(req => (
        req.id === ctx.selectedRequestId ? { ...req, workflowStep: nextTab } : req
      )));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el estado.';
      setWorkflowError(message);
      return false;
    }
  };
  const handleTabChange = async (nextTab: UseWorkOrdersResult['tab']) => {
    if (nextTab === INBOX) {
      ctx.setTab(nextTab);
      return;
    }
    if (ctx.tab === INBOX && nextTab !== INBOX && ctx.selectedRequestId) {
      const selectedRequest = ctx.requests.find(req => req.id === ctx.selectedRequestId);
      if (selectedRequest) {
        ctx.applyRequest(selectedRequest);
        return;
      }
    }
    if (ctx.selectedRequestId && ctx.tab !== nextTab) {
      if (isForwardTransition(ctx.tab, nextTab)) {
        setNavigationWarning('Para avanzar a una etapa superior usa el botón "Avanzar etapa".');
        return;
      }
      if (isBackwardTransition(ctx.tab, nextTab) && nextTab !== INBOX) {
        setPendingTab(nextTab);
        setShowAuthDialog(true);
        return;
      }
      const ok = await persistWorkflowStep(nextTab, undefined, { skipPersist: true });
      if (!ok) return;
    }
    ctx.setTab(nextTab);
  };

  const handleAuthorize = async (authorizerUserId: string) => {
    if (!pendingTab) return;
    const ok = await persistWorkflowStep(pendingTab, authorizerUserId);
    if (!ok) return;
    ctx.setTab(pendingTab);
    setPendingTab(null);
    setShowAuthDialog(false);
  };

  const handleAdvanceStep = async () => {
    if (advanceBlockReason) {
      setNavigationWarning(advanceBlockReason);
      return;
    }
    if (isDirtyRequest) {
      setPendingAdvance(nextStep);
      setShowDirtyConfirm(true);
      return;
    }
    if (!nextStep || !ctx.selectedRequestId) return;
    const ok = await persistWorkflowStep(nextStep);
    if (!ok) return;
    ctx.setTab(nextStep);
  };

  const handleConfirmAdvance = async () => {
    setShowDirtyConfirm(false);
    if (!pendingAdvance || !ctx.selectedRequestId || !selectedRequest) return;
    const modelLabel = ctx.selectedModel.label ?? selectedRequest.modelLabel ?? selectedRequest.modelId;
    ctx.setRequests(prev => prev.map(req => {
      if (req.id !== ctx.selectedRequestId) return req;
      const updatedCustomerName = currentCustomerName || req.customerName;
      return {
        ...req,
        customerId: ctx.customerId || req.customerId,
        customerName: updatedCustomerName,
        modelId: ctx.modelId,
        modelLabel,
        m2: ctx.m2,
        reference: (ctx.modelReference || req.reference).toUpperCase(),
        googleView: ctx.googleView,
        notes: ctx.notes,
      };
    }));
    const ok = await persistWorkflowStep(pendingAdvance);
    if (!ok) return;
    ctx.setTab(pendingAdvance);
    setPendingAdvance(null);
  };

  const handleFinalizeOrder = async () => {
    if (!ctx.selectedRequestId) return;
    setShowFinalizeConfirm(true);
  };

  const handleConfirmFinalize = async () => {
    setShowFinalizeConfirm(false);
    if (!ctx.selectedRequestId) return;
    ctx.setFinalized(true);
    const ok = await persistWorkflowStep('FINAL');
    if (!ok) return;
    ctx.setTab('FINAL');
  };

  return (
    <div className="flex flex-col" style={{ minHeight: 600 }}>
      {/*
        If the order has a persisted workflowStep, mark all previous steps as done.
        This keeps the pipeline consistent when loading a finished order.
      */}
      {(() => {
        const current = selectedRequest?.workflowStep ?? null;
        const currentIndex = current ? workflowOrder.indexOf(current) : -1;
        const steps = ctx.pipelineSteps.map(step => (
          currentIndex >= 0 ? { ...step, done: workflowOrder.indexOf(step.key) <= currentIndex } : step
        ));
        return (
          <WorkOrdersTabs
            steps={steps}
            activeTab={ctx.tab}
            onTabChange={handleTabChange}
            onOpenNewRequest={onOpenNewRequest}
            onRefresh={() => { void ctx.reloadRequests(); }}
            isRefreshing={ctx.isRefreshing}
          />
        );
      })()}
      <WorkOrdersBody
        ctx={ctx}
        dev={dev}
        production={production}
        advance={{
          onAdvanceStep: handleAdvanceStep,
          canAdvanceStep: Boolean(nextStep && !advanceBlockReason),
          nextStepLabel: nextStep ? ctx.pipelineSteps.find(step => step.key === nextStep)?.label : undefined,
          advanceHint: advanceBlockReason ?? undefined,
        }}
        onFinalizeOrder={handleFinalizeOrder}
      />

      <AuthorizationDialog
        open={showAuthDialog}
        title="Retroceso de etapa"
        description="Para volver a una etapa anterior se necesita autorización de un usuario con rol ADMIN o DIOS."
        onConfirm={handleAuthorize}
        onClose={() => { setShowAuthDialog(false); setPendingTab(null); }}
      />
      <ErrorDialog
        open={Boolean(workflowError)}
        title="No pudimos cambiar el estado"
        description="La etapa no se actualizó. Revisa la autorización e inténtalo de nuevo."
        detail={workflowError || undefined}
        onClose={() => setWorkflowError('')}
      />
      <ErrorDialog
        open={Boolean(navigationWarning)}
        title="Acción bloqueada"
        description={navigationWarning || ''}
        onClose={() => setNavigationWarning('')}
      />
      <ConfirmDialog
        open={showDirtyConfirm}
        title="Cambios sin guardar"
        description={(
          <div className="space-y-2">
            <div>Hay cambios sin guardar en la solicitud. Si avanzas, se guardarán automáticamente antes de continuar.</div>
            {dirtyFields.length > 0 && (
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#9ca3af' }}>
                Campos con cambios:
              </div>
            )}
            {dirtyFields.map(field => (
              <div key={field} className="text-sm">• {field}</div>
            ))}
          </div>
        )}
        confirmLabel="Guardar y avanzar"
        cancelLabel="Volver a revisar"
        tone="warning"
        onConfirm={handleConfirmAdvance}
        onClose={() => setShowDirtyConfirm(false)}
      />
      <ConfirmDialog
        open={showFinalizeConfirm}
        title="Confirmar finalización"
        description="Vas a marcar esta orden como finalizada. Esta acción cerrará el flujo."
        confirmLabel="Finalizar orden"
        cancelLabel="Cancelar"
        tone="warning"
        onConfirm={handleConfirmFinalize}
        onClose={() => setShowFinalizeConfirm(false)}
      />
    </div>
  );
};
