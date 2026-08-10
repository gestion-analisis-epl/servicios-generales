import { Office } from '../entities/Office';

export interface PagoDetailRow {
  codigo: string;
  empresa: string;
  ciudad: string;
  arrendador: string;
  domicilio: string;
  totalFactura: string;
  estado: string;
  fechaLimitePago: string;
}

export function getPagosDetail(offices: Office[]): PagoDetailRow[] {
  return offices
    .filter((o) => o.fechaLimitePago && !isNaN(new Date(o.fechaLimitePago).getTime()))
    .map((o) => ({
      codigo: o.codigo,
      empresa: o.empresa,
      ciudad: o.ciudad,
      arrendador: o.arrendador,
      domicilio: o.domicilio,
      totalFactura: formatMoney(o.totalFactura),
      estado: o.estadoVigencia,
      fechaLimitePago: o.fechaLimitePago.slice(0, 10)
    }));
}

function formatMoney(value: number): string {
  return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}
