import { Office } from '../entities/Office';

export interface ContratoRow {
  codigo: string;
  empresa: string;
  clasificacion: string;
  tipo: string;
  ciudad: string;
  arrendador: string;
  inicio: string;
  fin: string;
  vigencia: string;
  renta: number;
  totalFactura: number;
  fechaUltimoPago: string;
  renovado: string;
  legal: string;
}

export function getContratosTableRows(offices: Office[]): ContratoRow[] {
  return offices.map((o) => ({
    codigo: o.codigo,
    empresa: o.empresa,
    clasificacion: o.clasificacion,
    tipo: o.tipoOficina,
    ciudad: o.ciudad,
    arrendador: o.arrendador,
    inicio: o.inicioVigencia,
    fin: o.finVigencia,
    vigencia: o.estadoVigencia,
    renta: o.montoRenta,
    totalFactura: o.totalFactura,
    fechaUltimoPago: o.fechaUltimoPago,
    renovado: o.renovado,
    legal: o.legal ? 'Sí' : 'No'
  }));
}
