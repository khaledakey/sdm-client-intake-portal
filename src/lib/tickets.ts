import { prisma } from '@/lib/prisma';

const TICKET_NUMBER_START = 1000;

/** Assigns sequential, human-friendly ticket numbers ("SDM-1042"). SQLite
 * only supports autoincrement() on a primary key, so the next number is
 * computed here instead. Good enough for this app's write volume — ticket
 * creation isn't a hot path and rows are never deleted. */
export async function nextTicketNumber(): Promise<number> {
  const highest = await prisma.supportTicket.aggregate({ _max: { ticketNumber: true } });
  return (highest._max.ticketNumber ?? TICKET_NUMBER_START) + 1;
}
