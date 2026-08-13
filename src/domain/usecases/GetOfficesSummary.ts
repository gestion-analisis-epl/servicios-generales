import { Office, ESTADO_VENCIDO, ESTADO_CRITICO } from '../entities/Office';

export interface OfficesSummary {
  totalOficinas: number;
  totalVigentes: number;
  totalVencidos: number;
  totalCriticos: number;
  totalRentaMensual: number;
  totalEnLegal: number;
  totalFueraLegal: number;
}

export function getOfficesSummary(offices: Office[]): OfficesSummary {
  const vigentes = offices.filter((o) => o.estadoVigencia !== ESTADO_VENCIDO);
  const vencidos = offices.filter((o) => o.estadoVigencia === ESTADO_VENCIDO);
  const criticos = offices.filter((o) => o.estadoVigencia === ESTADO_CRITICO);
  const noVencidos = offices.filter((o) => o.estadoVigencia !== ESTADO_VENCIDO);
  const enLegal = offices.filter((o) => o.legal);

  return {
    totalOficinas: offices.length,
    totalVigentes: vigentes.length,
    totalVencidos: vencidos.length,
    totalCriticos: criticos.length,
    totalRentaMensual: noVencidos.reduce((sum, o) => sum + (Number(o.totalMensual) || 0), 0),
    totalEnLegal: enLegal.length,
    totalFueraLegal: offices.length - enLegal.length
  };
}
