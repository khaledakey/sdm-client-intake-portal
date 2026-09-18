/**
 * Read-only report: lists every DocumentRequest still on the retired
 * "Website access information" label (pre-dating the rename to "Website
 * access (grant via platform invite)" in src/lib/progress.ts and
 * prisma/seed.ts), excluding the three seeded demo accounts.
 *
 * Old rows aren't migrated automatically ÔÇö this only reports them so a
 * human can decide whether to relabel, leave, or handle them individually.
 * Deletes and changes nothing. Run with:
 *   npx tsx scripts/report-legacy-website-access-label.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_EMAILS = ['owner@brightleafcafe.ie', 'hello@kilkennyfitco.ie', 'info@corkcraftbrew.ie'];

async function main() {
  const requests = await prisma.documentRequest.findMany({
    where: {
      label: 'Website access information',
      business: { owner: { email: { notIn: SEED_EMAILS } } },
    },
    include: { business: { include: { owner: true } } },
    orderBy: { createdAt: 'asc' },
  });

  if (requests.length === 0) {
    console.log('No non-seed accounts have a "Website access information" request. Nothing to report.');
    return;
  }

  console.log(`${requests.length} non-seed DocumentRequest row(s) still on the old label:\n`);
  for (const r of requests) {
    console.log(
      `- ${r.business.owner.email} (${r.business.businessName}) ÔÇö status=${r.status}, required=${r.required}, requestId=${r.id}, createdAt=${r.createdAt.toISOString()}`
    );
  }
  console.log('\nThis is a report only ÔÇö nothing was changed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
