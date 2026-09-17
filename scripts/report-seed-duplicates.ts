/**
 * Read-only report for the seed-script duplication bug (see repo history /
 * PR description). Prints, per demo business, any DocumentRequest label,
 * Document fileName, or ActivityLog (activityType + description) that
 * appears more than once — the signature left by rerunning `prisma/seed.ts`
 * against a database that already had the seed data in it.
 *
 * Deletes nothing. Run with:
 *   npx tsx scripts/report-seed-duplicates.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_EMAILS = ['owner@brightleafcafe.ie', 'hello@kilkennyfitco.ie', 'info@corkcraftbrew.ie'];

async function main() {
  const businesses = await prisma.business.findMany({
    where: { owner: { email: { in: SEED_EMAILS } } },
    include: { owner: true },
  });

  let foundAny = false;

  for (const business of businesses) {
    const [requests, documents, activity, tickets] = await Promise.all([
      prisma.documentRequest.findMany({ where: { businessId: business.id } }),
      prisma.document.findMany({ where: { businessId: business.id } }),
      prisma.activityLog.findMany({ where: { businessId: business.id } }),
      prisma.supportTicket.findMany({ where: { businessId: business.id } }),
    ]);

    const dupeGroups = <T,>(rows: T[], keyOf: (row: T) => string) => {
      const byKey = new Map<string, T[]>();
      for (const row of rows) {
        const key = keyOf(row);
        byKey.set(key, [...(byKey.get(key) ?? []), row]);
      }
      return [...byKey.entries()].filter(([, group]) => group.length > 1);
    };

    const dupeRequests = dupeGroups(requests, (r) => r.label);
    const dupeDocuments = dupeGroups(documents, (d) => d.fileName);
    const dupeActivity = dupeGroups(activity, (a) => `${a.activityType}::${a.description}`);

    if (!dupeRequests.length && !dupeDocuments.length && !dupeActivity.length) continue;
    foundAny = true;

    console.log(`\n=== ${business.businessName} (${business.owner.email}, businessId=${business.id}) ===`);
    console.log(`Total rows: ${requests.length} document requests, ${documents.length} documents, ${activity.length} activity log entries, ${tickets.length} support tickets`);

    for (const [label, group] of dupeRequests) {
      console.log(`  DocumentRequest "${label}": ${group.length} rows — ids: ${group.map((r) => r.id).join(', ')}`);
    }
    for (const [fileName, group] of dupeDocuments) {
      console.log(`  Document "${fileName}": ${group.length} rows — ids: ${group.map((d) => d.id).join(', ')}`);
    }
    for (const [key, group] of dupeActivity) {
      console.log(`  ActivityLog "${key}": ${group.length} rows — ids: ${group.map((a) => a.id).join(', ')}`);
    }
  }

  if (!foundAny) {
    console.log('No duplicates found among the seeded demo accounts.');
  } else {
    console.log('\nThis is a report only — nothing was deleted or changed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
