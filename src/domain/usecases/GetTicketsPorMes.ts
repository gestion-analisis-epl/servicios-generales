import { Ticket } from '../entities/Ticket';

export interface MesTotal {
  mes: string;
  total: number;
  finalizados: number;
  enSeguimiento: number;
}

const MES_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function getTicketsPorMes(tickets: Ticket[]): MesTotal[] {
  const totals = MES_LABELS.map((mes) => ({ mes, total: 0, finalizados: 0, enSeguimiento: 0 }));

  tickets.forEach((t) => {
    const date = new Date(t.fechaYHora);
    if (isNaN(date.getTime())) return;

    const bucket = totals[date.getMonth()];
    bucket.total++;
    if (t.estatus === 'FINALIZADO') bucket.finalizados++;
    if (t.estatus === 'EN SEGUIMIENTO') bucket.enSeguimiento++;
  });

  return totals;
}
