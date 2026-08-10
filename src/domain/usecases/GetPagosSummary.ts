import { Office, ESTADO_VENCIDO, ESTADO_CRITICO, ESTADO_PROXIMO } from '../entities/Office';

export interface PagosSummary {
  totalMensual: number;
  totalArrendamientos: number;
  porVencer: number;
  vencidos: number;
}

export function getPagosSummary(offices: Office[]): PagosSummary {
  const noVencidos = offices.filter((o) => o.estadoVigencia !== ESTADO_VENCIDO);
  const porVencer = offices.filter((o) => o.estadoVigencia === ESTADO_CRITICO || o.estadoVigencia === ESTADO_PROXIMO);
  const vencidos = offices.filter((o) => o.estadoVigencia === ESTADO_VENCIDO);

  return {
    totalMensual: noVencidos.reduce((sum, o) => sum + (Number(o.totalMensual) || 0), 0),
    totalArrendamientos: offices.length,
    porVencer: porVencer.length,
    vencidos: vencidos.length
  };
}
