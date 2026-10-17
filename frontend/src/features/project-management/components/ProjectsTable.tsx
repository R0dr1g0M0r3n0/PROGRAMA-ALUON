import { useEffect, useMemo, useState } from 'react';
import type { ProjectDocumentRow } from '../ProjectManagement.types';
import { ProjectsTableFiltersBar } from './ProjectsTableFilters';
import { useProjectsTableFiltering } from './useProjectsTableFiltering';
import { documentManagementTheme } from '../documentManagementTheme';
import { useProjectsTablePagination } from './useProjectsTablePagination';
import { DocumentThumbnail } from '../../../components/DocumentThumbnail';

type ProjectsTableProps = {
  rows: ProjectDocumentRow[];
  busyProjectId: string | null;
  onOpenDetails: (row: ProjectDocumentRow) => void;
  onCreateDocument: () => void;
};

// ─── Column header ────────────────────────────────────────────────────────────
const TH = ({ label, right }: { label: string; right?: boolean }) => (
  <th
    className={`px-3 py-2 whitespace-nowrap select-none group ${right ? 'text-right' : 'text-left'}`}
    style={{
      fontSize: 10,
      fontWeight: 700,
      color: documentManagementTheme.muted,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      background: documentManagementTheme.panelSoftBg,
      borderBottom: `1px solid ${documentManagementTheme.border}`,
    }}
  >
    <span className="flex items-center gap-1 group-hover:text-gray-900 transition-colors" style={{ justifyContent: right ? 'flex-end' : 'flex-start' }}>
      {label}
    </span>
  </th>
);

// ─── Badges ───────────────────────────────────────────────────────────────────
const TypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    'PRESUPUESTO': { bg: '#dbeafe', color: '#1e40af' }, // blue
    'PEDIDO': { bg: '#fef3c7', color: '#92400e' }, // yellow
    'ALBARAN': { bg: '#f0fdf4', color: '#15803d' }, // green
    'FACTURA': { bg: '#fae8ff', color: '#7c3aed' }, // purple
    'ABONO': { bg: '#ffe4e6', color: '#9f1239' }, // rose
  };
  const style = map[type] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
      style={{ background: style.bg, color: style.color, fontSize: 10 }}
    >
      {type}
    </span>
  );
};

const ActionButton = ({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
    style={{
      border: `1px solid ${documentManagementTheme.border}`,
      background: documentManagementTheme.panelBg,
      color: disabled ? '#9ca3af' : documentManagementTheme.text,
      fontSize: 10,
      boxShadow: documentManagementTheme.shadowSoft,
    }}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
  >
    {label}
  </button>
);

export const ProjectsTable = ({
  rows,
  busyProjectId,
  onOpenDetails,
  onCreateDocument,
}: ProjectsTableProps) => {
  const filtering = useProjectsTableFiltering(rows);
  const {
    currentPage,
    pageSize,
    totalPages,
    pageRows,
    pageStartIndex,
    pageEndIndex,
    setCurrentPage,
    tableBodyRef,
    tableHeadRef,
    footerRef,
    firstRowRef,
  } = useProjectsTablePagination(filtering.filteredRows);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredRowIds = useMemo(() => new Set(filtering.filteredRows.map(r => r.rowId)), [filtering.filteredRows]);
  useEffect(() => {
    setSelected(prev => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      for (const id of prev) {
        if (filteredRowIds.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [filteredRowIds]);

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      const pageSelected = pageRows.every(r => next.has(r.rowId));
      if (pageSelected) {
        for (const row of pageRows) next.delete(row.rowId);
      } else {
        for (const row of pageRows) next.add(row.rowId);
      }
      return next;
    });
  };

  const allSelected = pageRows.length > 0 && pageRows.every(r => selected.has(r.rowId));

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="mb-4">
        <ProjectsTableFiltersBar
          filters={filtering.filters}
          onChange={filtering.setFilters}
          onReset={filtering.resetFilters}
          onCreateDocument={onCreateDocument}
          typeOptions={filtering.typeOptions}
          statusOptions={filtering.statusOptions}
        />
      </div>

      {/* ── Table container ── */}
      <div
        ref={tableBodyRef}
        className="flex-1 rounded-[22px] overflow-hidden flex flex-col min-h-0"
        style={{
          border: `1px solid ${documentManagementTheme.border}`,
          background: documentManagementTheme.panelBg,
          boxShadow: documentManagementTheme.shadowSoft,
        }}
      >
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse" style={{ fontSize: 12 }}>
            <thead ref={tableHeadRef} style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th
                  className="px-3 py-2"
                  style={{
                    background: documentManagementTheme.panelSoftBg,
                    borderBottom: `1px solid ${documentManagementTheme.border}`,
                    width: 36,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded cursor-pointer"
                    style={{ accentColor: documentManagementTheme.accent, width: 14, height: 14 }}
                  />
                </th>
                <TH label="Documento" />
                <TH label="Cliente" />
                <TH label="Tipo" />
                <TH label="Número" />
                <TH label="Estado" />
                <TH label="OT" />
                <TH label="Acciones" right />
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9ca3af' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm" style={{ color: '#374151' }}>Sin resultados</p>
                        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Ajusta los filtros para ver documentos.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((row, index) => {
                  const busy = busyProjectId === row.projectId;
                  const canView = row.quoteId !== null;
                  const isChecked = selected.has(row.rowId);

                  return (
                    <tr
                      key={row.rowId}
                      ref={index === 0 ? firstRowRef : undefined}
                      className="group transition-colors duration-100"
                      style={{
                        borderBottom: `1px solid ${documentManagementTheme.border}`,
                        background: isChecked ? documentManagementTheme.accentBg : 'transparent',
                        cursor: 'default',
                      }}
                      onClick={() => {
                        if (row.quoteId) onOpenDetails(row);
                      }}
                      onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = documentManagementTheme.panelSoftBg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isChecked ? documentManagementTheme.accentBg : 'transparent'; }}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(row.rowId)}
                          className="rounded cursor-pointer"
                          style={{ accentColor: documentManagementTheme.accent, width: 14, height: 14 }}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <DocumentThumbnail type={row.type} />
                          <div className="min-w-0">
                            <div className="truncate font-bold" style={{ color: '#111827' }}>{row.number || 'Sin número'}</div>
                            <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em]" style={{ color: documentManagementTheme.muted }}>{row.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {isChecked && (
                            <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background: documentManagementTheme.accent }} />
                          )}
                          <span className="font-semibold" style={{ color: '#111827' }}>
                            {row.customerName || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <TypeBadge type={row.type} />
                      </td>
                      <td className="px-3 py-2.5 font-medium" style={{ color: '#374151' }}>
                        {row.number || '—'}
                      </td>
                      <td className="px-3 py-2.5" style={{ color: '#6b7280' }}>
                        {row.statusLabel || '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
                          style={{
                            background: documentManagementTheme.panelSoftBg,
                            color: documentManagementTheme.muted,
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {row.type === 'PEDIDO' ? (row.workOrderStep ?? '—') : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <ActionButton
                            label={busy ? '...' : 'VER'}
                            disabled={!canView || busy}
                            onClick={() => {
                              if (canView) onOpenDetails(row);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer bar ── */}
        <div
          ref={footerRef}
          className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{
            borderTop: `1px solid ${documentManagementTheme.border}`,
            background: documentManagementTheme.panelSoftBg,
          }}
        >
          <div className="flex items-center gap-4 text-xs" style={{ color: documentManagementTheme.muted }}>
            <span>
              <strong style={{ color: documentManagementTheme.text }}>{filtering.matchCount}</strong> documentos
            </span>
            {selected.size > 0 && (
              <span style={{ color: documentManagementTheme.accent, fontWeight: 700 }}>
                {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
              </span>
            )}
            <span>
              Mostrando <strong style={{ color: documentManagementTheme.text }}>
                {filtering.matchCount === 0 ? 0 : pageStartIndex}
                {filtering.matchCount === 0 ? '' : `-${pageEndIndex}`}
              </strong>
              {filtering.matchCount > 0 ? ` de ${filtering.matchCount}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: documentManagementTheme.muted }}>
            <span>Por página</span>
            <span
              className="px-2 py-1 rounded-md border font-bold"
              style={{
                borderColor: documentManagementTheme.border,
                background: documentManagementTheme.panelBg,
                color: documentManagementTheme.text,
                boxShadow: documentManagementTheme.shadowSoft,
              }}
            >
              Auto: {pageSize}
            </span>
            <div className="flex items-center gap-0.5 ml-2">
              <button
                type="button"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: documentManagementTheme.panelBg,
                  color: documentManagementTheme.muted,
                  borderColor: documentManagementTheme.border,
                  boxShadow: documentManagementTheme.shadowSoft,
                }}
                aria-label="Página anterior"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span
                className="px-2 py-1 rounded text-xs font-bold"
                style={{ background: documentManagementTheme.accent, color: '#fff', minWidth: 24, textAlign: 'center' }}
              >
                {currentPage}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: documentManagementTheme.panelBg,
                  color: documentManagementTheme.muted,
                  borderColor: documentManagementTheme.border,
                  boxShadow: documentManagementTheme.shadowSoft,
                }}
                aria-label="Página siguiente"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
