import { Ticket } from '../entities/Ticket';

export interface TiempoPromedioMes {
  mes: string;
  segundosFinalizar: number;
  segundosReconocer: number;
}

const MES_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function getTiempoPromedioPorMes(tickets: Ticket[]): TiempoPromedioMes[] {
  const buckets = MES_LABELS.map((mes) => ({
    mes,
    finalizados: [] as number[],
    enSeguimiento: [] as number[]
  }));

  tickets.forEach((t) => {
    const date = new Date(t.fechaYHora);
    if (isNaN(date.getTime())) return;

    const segundos = Number(t.tiempoEfectivoSegundos);
    if (!(segundos > 0)) return;

    const bucket = buckets[date.getMonth()];
    if (t.estatus === 'FINALIZADO') bucket.finalizados.push(segundos);
    if (t.estatus === 'EN SEGUIMIENTO') bucket.enSeguimiento.push(segundos);
  });

  return buckets.map((b) => ({
    mes: b.mes,
    segundosFinalizar: average(b.finalizados),
    segundosReconocer: average(b.enSeguimiento)
  }));
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
