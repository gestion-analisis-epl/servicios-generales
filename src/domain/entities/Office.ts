export interface Office {
  codigo: string;
  ciudad: string;
  tipoOficina: string;
  domicilio: string;
  empresa: string;
  clasificacion: string;
  arrendador: string;
  inicioVigencia: string;
  finVigencia: string;
  estadoVigencia: string;
  montoRenta: number;
  totalMensual: number;
  totalFactura: number;
  frecuenciaPago: string;
  fechaLimitePago: string;
  fechaUltimoPago: string;
  renovado: string;
  urlImagen: string;
  observaciones: string;
  legal: boolean;
}

export function createOffice(fields: Partial<Office>): Office {
  return {
    codigo: orEmpty(fields.codigo),
    ciudad: orEmpty(fields.ciudad),
    tipoOficina: orEmpty(fields.tipoOficina),
    domicilio: orEmpty(fields.domicilio),
    empresa: orEmpty(fields.empresa),
    clasificacion: orEmpty(fields.clasificacion),
    arrendador: orEmpty(fields.arrendador),
    inicioVigencia: orEmpty(fields.inicioVigencia),
    finVigencia: orEmpty(fields.finVigencia),
    estadoVigencia: orEmpty(fields.estadoVigencia),
    montoRenta: fields.montoRenta ?? 0,
    totalMensual: fields.totalMensual ?? 0,
    totalFactura: fields.totalFactura ?? 0,
    frecuenciaPago: orEmpty(fields.frecuenciaPago),
    fechaLimitePago: orEmpty(fields.fechaLimitePago),
    fechaUltimoPago: orEmpty(fields.fechaUltimoPago),
    renovado: orEmpty(fields.renovado),
    urlImagen: orEmpty(fields.urlImagen),
    observaciones: orEmpty(fields.observaciones),
    legal: fields.legal ?? false
  };
}

function orEmpty(value: string | undefined): string {
  return value === undefined ? '' : value;
}

export const ESTADO_A_TIEMPO = '🟢 A TIEMPO';
export const ESTADO_VENCIDO = '⛔ VENCIDO';
export const ESTADO_CRITICO = '🔴 URGENTE';
export const ESTADO_PROXIMO = '🟡 PRÓXIMO';
export const ESTADO_INDETERMINADO = '🟠 INDETERMINADO';
