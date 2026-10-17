import { DashboardCard } from './DashboardCard';
import { dashboardTheme } from '../dashboardTheme';
import type { DashboardDocumentRow } from '../Dashboard.types';
import { DocumentThumbnail } from '../../../components/DocumentThumbnail';

type Props = {
  title: string;
  accentColor: string;
  rows: DashboardDocumentRow[];
  emptyLabel: string;
  onRowClick: (row: DashboardDocumentRow) => void;
};

const formatFecha = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(date);
};

export const DocumentRowsCard = ({ title, accentColor, rows, emptyLabel, onRowClick }: Props) => {
  return (
    <DashboardCard title={title} accentColor={accentColor}>
      <div className="grid gap-3">
        {rows.slice(0, 5).map(row => (
          <button
            key={row.id}
            type="button"
            onClick={() => onRowClick(row)}
            className="w-full rounded-xl border px-3 py-2 text-left transition hover:bg-slate-50"
            style={{ borderColor: dashboardTheme.border, background: '#ffffff' }}
          >
            <div className="flex items-center gap-3">
              <DocumentThumbnail type={row.type} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold truncate" style={{ color: dashboardTheme.text }}>
                  {row.customerName || 'Sin cliente'}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#64748b' }}>
                  {row.type} · {row.number}
                </div>
                <div className="mt-1 text-[10px] font-medium" style={{ color: '#94a3b8' }}>
                  {row.statusLabel}
                </div>
              </div>
              <div className="self-start text-right text-[10px] font-medium" style={{ color: '#94a3b8' }}>
                {formatFecha(row.createdAt)}
              </div>
            </div>
          </button>
        ))}

        {rows.length === 0 ? (
          <div className="rounded-xl border px-3 py-4 text-sm font-medium text-center" style={{ borderColor: dashboardTheme.border, color: '#94a3b8' }}>
            {emptyLabel}
          </div>
        ) : null}
      </div>
    </DashboardCard>
  );
};
