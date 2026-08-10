import { describe, expect, it } from 'vitest';
import { createOffice } from '../entities/Office';
import { createTicket } from '../entities/Ticket';
import { getOfficeTicketsMatch } from './GetOfficeTicketsMatch';

describe('getOfficeTicketsMatch', () => {
  it('assigns tickets to the only office in a city', () => {
    const offices = [createOffice({ codigo: 'AGS-EPL', ciudad: 'AGUASCALIENTES', tipoOficina: 'FÍSICA', montoRenta: 1000 })];
    const tickets = [createTicket({ folio: '1', plazaNombreArrendamientos: 'AGUASCALIENTES' })];

    const match = getOfficeTicketsMatch(offices, tickets);
    expect(match['AGS-EPL']).toHaveLength(1);
  });

  it('prefers FÍSICA over VIRTUAL when multiple offices share a city', () => {
    const offices = [
      createOffice({ codigo: 'LEON-VIRTUAL', ciudad: 'LEÓN', tipoOficina: 'VIRTUAL', montoRenta: 999999 }),
      createOffice({ codigo: 'LEON-FISICA', ciudad: 'LEÓN', tipoOficina: 'FÍSICA', montoRenta: 100 })
    ];
    const tickets = [createTicket({ folio: '1', plazaNombreArrendamientos: 'LEÓN' })];

    const match = getOfficeTicketsMatch(offices, tickets);
    expect(match['LEON-FISICA']).toHaveLength(1);
    expect(match['LEON-VIRTUAL']).toBeUndefined();
  });

  it('picks the highest monto among tied FÍSICA offices', () => {
    const offices = [
      createOffice({ codigo: 'LEON-A', ciudad: 'LEÓN', tipoOficina: 'FÍSICA', montoRenta: 100 }),
      createOffice({ codigo: 'LEON-B', ciudad: 'LEÓN', tipoOficina: 'FÍSICA', montoRenta: 500 })
    ];
    const tickets = [createTicket({ folio: '1', plazaNombreArrendamientos: 'LEÓN' })];

    const match = getOfficeTicketsMatch(offices, tickets);
    expect(match['LEON-B']).toHaveLength(1);
    expect(match['LEON-A']).toBeUndefined();
  });

  it('matches plaza names regardless of accents or case', () => {
    const offices = [createOffice({ codigo: 'LEON-A', ciudad: 'LEÓN', tipoOficina: 'FÍSICA', montoRenta: 1 })];
    const tickets = [createTicket({ folio: '1', plazaNombreArrendamientos: 'leon' })];

    const match = getOfficeTicketsMatch(offices, tickets);
    expect(match['LEON-A']).toHaveLength(1);
  });

  it('does not assign tickets whose plaza has no matching office', () => {
    const offices = [createOffice({ codigo: 'AGS-EPL', ciudad: 'AGUASCALIENTES', tipoOficina: 'FÍSICA', montoRenta: 1 })];
    const tickets = [createTicket({ folio: '1', plazaNombreArrendamientos: 'MONTERREY' })];

    const match = getOfficeTicketsMatch(offices, tickets);
    expect(match['AGS-EPL']).toHaveLength(0);
  });
});
