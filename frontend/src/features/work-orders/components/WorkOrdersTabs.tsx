import type { TabKey } from '../models';
import { uiColors } from './ui';

type PipelineStep = { key: TabKey; label: string; done: boolean };

type WorkOrdersTabsProps = {
  steps: PipelineStep[];
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
  onOpenNewRequest: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
};

export const WorkOrdersTabs = ({
  steps,
  activeTab,
  onTabChange,
  onOpenNewRequest,
  onRefresh,
  isRefreshing,
}: WorkOrdersTabsProps) => (
  <div className="flex items-center gap-3 mb-6 overflow-x-auto">
    {steps.map((step, idx) => (
      <button
        key={step.key}
        type="button"
        onClick={() => onTabChange(step.key)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap"
        style={{
          border: `1px solid ${activeTab === step.key ? uiColors.accent : uiColors.border}`,
          background: activeTab === step.key ? 'var(--accent-soft)' : '#ffffff',
        }}
      >
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
          style={{
            background: step.done ? uiColors.accent : uiColors.border,
            color: step.done ? '#ffffff' : uiColors.textMuted,
          }}
        >
          {idx + 1}
        </span>
        <span className="text-xs font-black uppercase" style={{ color: uiColors.textPrimary, letterSpacing: '0.08em' }}>
          {step.label}
        </span>
        {step.done && (
          <span className="text-[10px] font-black" style={{ color: uiColors.success }}>
            ✓
          </span>
        )}
      </button>
    ))}
    <button
      type="button"
      className="h-10 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-[0.08em] whitespace-nowrap"
      style={{ borderColor: uiColors.border, background: '#ffffff', color: uiColors.textPrimary }}
      onClick={onRefresh}
      disabled={isRefreshing}
      title="Actualizar órdenes"
    >
      {isRefreshing ? 'Actualizando…' : 'Actualizar'}
    </button>
    <button className="btn-primary h-10 px-3 py-2" onClick={onOpenNewRequest}>
      <span className="text-base">🆕</span>
      Nueva orden
    </button>
  </div>
);
