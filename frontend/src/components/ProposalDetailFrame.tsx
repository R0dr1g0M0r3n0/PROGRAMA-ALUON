import type { ReactNode } from 'react';

export const ProposalDetailStepper = ({ labels = ['Datos del documento', 'Configuración', 'Documentos', 'Revisión'] }: { labels?: string[] }) => (
  <nav className="document-proposal-stepper" aria-label="Secciones del detalle">
    <ol>
      {labels.map((label, index) => (
        <li key={label} className={index === 0 ? 'is-active' : ''}>
          <span>{index + 1}</span><strong>{label}</strong>{index < labels.length - 1 ? <i aria-hidden="true" /> : null}
        </li>
      ))}
    </ol>
  </nav>
);

type ProposalDetailFrameProps = {
  children: ReactNode;
  stepLabels?: string[];
  className?: string;
};

/** Shared visual frame for document and configurator details. */
export const ProposalDetailFrame = ({ children, stepLabels, className = '' }: ProposalDetailFrameProps) => (
  <div className={`proposal-detail-frame ${className}`.trim()}>
    <ProposalDetailStepper labels={stepLabels} />
    <div className="proposal-detail-grid">
      {children}
    </div>
  </div>
);
