import type { ProjectDocumentKind } from '../features/project-management/ProjectManagement.types';

const thumbnailByType: Record<ProjectDocumentKind, string> = {
  PRESUPUESTO: '/images/Modelo Bisel - Puerta.png',
  PEDIDO: '/images/Modelo Bisel - Puerta Abatible Una Hoja.png',
  ALBARAN: '/images/Modelo Veneciana - Puerta.png',
  FACTURA: '/images/Modelo Bisel - Puerta Corredera.png',
  ABONO: '/images/Modelo Bisel - Valla.png',
};

const labelByType: Record<ProjectDocumentKind, string> = {
  PRESUPUESTO: 'Presupuesto',
  PEDIDO: 'Pedido',
  ALBARAN: 'Albarán',
  FACTURA: 'Factura',
  ABONO: 'Abono',
};

type Props = {
  type: ProjectDocumentKind;
  size?: 'sm' | 'md' | 'lg' | 'hero';
};

export const DocumentThumbnail = ({ type, size = 'md' }: Props) => {
  const dimensions = size === 'sm' ? 'h-10 w-12' : size === 'hero' ? 'h-64 w-full' : size === 'lg' ? 'h-32 w-40' : 'h-12 w-14';

  return (
    <div
      className={`document-thumbnail ${dimensions} flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50`}
      title={`Miniatura de ${labelByType[type]}`}
      aria-label={`Miniatura de ${labelByType[type]}`}
    >
      <img src={thumbnailByType[type]} alt="" className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
};

