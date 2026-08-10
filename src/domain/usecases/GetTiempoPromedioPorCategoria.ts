import { Ticket } from '../entities/Ticket';
import { formatDuration } from './FormatDuration';

export interface TiempoPromedioCategoria {
  categoria: string;
  duracion: string;
  segundos: number;
}

export function getTiempoPromedioPorCategoria(tickets: Ticket[]): TiempoPromedioCategoria[] {
  const finalizados = tickets.filter((t) => t.estatus === 'FINALIZADO' && Number(t.tiempoEfectivoSegundos) > 0);
  const segundosPorCategoria: Record<string, number[]> = {};

  finalizados.forEach((t) => {
    const key = t.categoria || 'SIN CATEGORÍA';
    if (!segundosPorCategoria[key]) segundosPorCategoria[key] = [];
    segundosPorCategoria[key].push(Number(t.tiempoEfectivoSegundos));
  });

  return Object.entries(segundosPorCategoria)
    .map(([categoria, valores]) => {
      const promedio = valores.reduce((sum, v) => sum + v, 0) / valores.length;
      return { categoria, duracion: formatDuration(promedio), segundos: promedio };
    })
    .sort((a, b) => b.segundos - a.segundos);
}
