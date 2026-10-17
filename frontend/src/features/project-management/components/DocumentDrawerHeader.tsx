import type { DocumentDrawerSubview } from './DocumentDrawerView.types';
import logo from '../../../assets/logo.png';
import { documentManagementTheme } from '../documentManagementTheme';
import type { ProjectDocumentKind } from '../ProjectManagement.types';
import { DocumentThumbnail } from '../../../components/DocumentThumbnail';

type Props = {
  title: string;
  subtitle?: string;
  badge: string;
  subview: DocumentDrawerSubview;
  onChangeSubview: (next: DocumentDrawerSubview) => void;
  onClose: () => void;
  showSubviewToggle?: boolean;
  documentType: ProjectDocumentKind;
};

export const DocumentDrawerHeader = ({
  title,
  subtitle,
  badge,
  subview,
  onChangeSubview,
  onClose,
  showSubviewToggle = true,
  documentType,
}: Props) => (
  <div
    className="px-5 py-4 flex justify-between items-center shrink-0"
    style={{
      background: '#0d1117',
      borderBottom: `1px solid ${documentManagementTheme.border}`,
    }}
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <DocumentThumbnail type={documentType} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="inline-flex w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: documentManagementTheme.accent }} />
          <h2 className="text-lg font-black truncate" style={{ color: '#ffffff' }}>{title}</h2>
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-[0.18em] border uppercase shadow-sm"
            style={{
              borderColor: '#ffd7dd',
              background: documentManagementTheme.accentBg,
              color: documentManagementTheme.accentText,
            }}
          >
            {badge}
          </span>
        </div>
        {subtitle ? (
            <div className="mt-1 text-xs font-medium" style={{ color: '#c9d1d9' }}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>

    <div className="flex items-center gap-2 shrink-0">
      {showSubviewToggle ? (
        <button
          type="button"
          onClick={() => onChangeSubview(subview === 'lines' ? 'document' : 'lines')}
          className="h-9 w-9 rounded-xl border transition disabled:opacity-60 flex items-center justify-center"
          style={{
            borderColor: '#30363d',
            background: '#161b22',
            boxShadow: documentManagementTheme.shadowSoft,
          }}
          title={subview === 'lines' ? 'Volver al documento' : 'Gestionar líneas'}
          aria-label={subview === 'lines' ? 'Volver al documento' : 'Gestionar líneas'}
        >
          <img src={logo} alt="Aluon" className="h-5 w-auto object-contain" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        className="text-2xl transition cursor-pointer leading-none"
        style={{ color: '#c9d1d9' }}
        aria-label="Cerrar"
        title="Cerrar"
      >
        ×
      </button>
    </div>
  </div>
);
