import { Office } from '../entities/Office';

export interface OfficeTableRow {
  codigo: string;
  empresa: string;
  ciudad: string;
  inicioVigencia: string;
  finVigencia: string;
  estado: string;
  observaciones: string;
}

export function getOfficesTableRows(offices: Office[]): OfficeTableRow[] {
  return offices.map((o) => ({
    codigo: o.codigo,
    empresa: o.empresa,
    ciudad: o.ciudad,
    inicioVigencia: formatTableDate(o.inicioVigencia),
    finVigencia: formatTableDate(o.finVigencia),
    estado: o.estadoVigencia,
    observaciones: o.observaciones || ''
  }));
}

export function formatTableDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
