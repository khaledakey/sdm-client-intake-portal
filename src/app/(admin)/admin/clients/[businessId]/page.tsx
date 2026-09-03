import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { recalcProgress, isBusinessInfoComplete, isMarketingInfoComplete, parseExtendedData } from '@/lib/progress';
import { OnboardingControls } from '@/components/admin/OnboardingControls';
import { DocumentReviewRow } from '@/components/admin/DocumentReviewRow';
import { DocumentRequestForm } from '@/components/admin/DocumentRequestForm';
import { ActivityTimeline } from '@/components/portal/ActivityTimeline';
import { StatusBadge, PriorityBadge } from '@/components/portal/TicketBadges';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-mist">{label}</dt>
      <dd className="mt-0.5 text-sm text-midnight">{value || <span className="text-mist">Not provided</span>}</dd>
    </div>
  );
}

export default async function ClientDetailPage({ params }: { params: { businessId: string } }) {
  const business = await prisma.business.findUnique({
    where: { id: params.businessId },
    include: { owner: true },
  });
  if (!business) notFound();

  const { stepDone, percentage } = await recalcProgress(business.id);
  const intake = await prisma.clientIntake.findUnique({ where: { businessId: business.id } });
  const extended = parseExtendedData(intake?.extendedData ?? null);
  const documents = await prisma.document.findMany({
    where: { businessId: business.id },
    orderBy: { uploadDate: 'desc' },
    include: { uploadedBy: { select: { firstName: true, lastName: true } } },
  });
  const documentRequests = await prisma.documentRequest.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'asc' },
  });
  const tickets = await prisma.supportTicket.findMany({ where: { businessId: business.id }, orderBy: { updatedAt: 'desc' } });
  const activity = await prisma.activityLog.findMany({ where: { businessId: business.id }, orderBy: { createdAt: 'desc' }, take: 15 });

  const clientStepsDone = stepDone.BUSINESS_INFORMATION && stepDone.MARKETING_INFORMATION && stepDone.SUPPORTING_DOCUMENTS;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-xs font-medium text-teal hover:underline">
          ← All clients
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-midnight">{business.businessName}</h1>
            <p className="mt-1 text-sm text-slate">
              {business.owner.firstName} {business.owner.lastName} &middot; {business.owner.email} &middot;{' '}
              {business.owner.phone}
            </p>
          </div>
          <Badge tone="teal">{percentage}% onboarded</Badge>
        </div>
      </div>

      <Card>
        <CardHeader title="Onboarding controls" description="Steps only SDM can advance." />
        <OnboardingControls
          businessId={business.id}
          clientStepsDone={!!clientStepsDone}
          sdmReviewed={!!intake?.sdmReviewedAt}
          onboardingComplete={!!intake?.onboardingCompletedAt}
        />
      </Card>

      <Card>
        <CardHeader
          title="Business Information"
          action={
            isBusinessInfoComplete(business) ? <Badge tone="emerald">Complete</Badge> : <Badge tone="gold">Incomplete</Badge>
          }
        />
        <dl className="grid gap-4 sm:grid-cols-3">
          <Field label="Trading name" value={business.tradingName} />
          <Field label="Website" value={business.website} />
          <Field label="Industry" value={business.industry} />
          <Field label="Location" value={business.location} />
          <Field label="Service area" value={business.serviceArea} />
          <Field label="Business stage" value={business.businessStage} />
          <Field label="Employees" value={business.employeeCount} />
          <Field label="Main contact" value={business.mainContactName} />
          <Field label="Contact email" value={business.mainContactEmail} />
          <Field label="Contact phone" value={business.mainContactPhone} />
        </dl>
        <div className="mt-4">
          <Field label="Business description" value={business.businessDescription} />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Marketing Intake"
          action={
            isMarketingInfoComplete(intake) ? <Badge tone="emerald">Complete</Badge> : <Badge tone="gold">Incomplete</Badge>
          }
        />
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Business goals" value={intake?.businessGoals} />
          <Field label="Marketing objectives" value={intake?.marketingObjectives} />
          <Field label="Target customers" value={intake?.targetCustomers} />
          <Field label="Target locations" value={extended.targetLocations} />
          <Field label="Key products/services" value={extended.keyProductsServices} />
          <Field label="Marketing challenges" value={intake?.marketingChallenges} />
          <Field label="Growth targets" value={intake?.growthTargets} />
          <Field label="Competitors" value={intake?.competitors} />
          <Field label="Expected outcomes" value={extended.expectedOutcomes} />
          <Field label="Current website" value={extended.currentWebsite} />
          <Field label="Social platforms" value={extended.socialMediaPlatforms?.join(', ')} />
          <Field label="Advertising channels" value={extended.advertisingChannels?.join(', ')} />
          <Field label="SEO activity" value={extended.seoActivity} />
          <Field label="Email marketing" value={extended.emailMarketingActivity} />
          <Field label="Content marketing" value={extended.contentMarketingActivity} />
          <Field label="Marketing tools" value={extended.marketingTools} />
          <Field label="Existing agency" value={extended.existingAgency} />
          <Field label="Best performing activity" value={extended.bestPerformingActivity} />
          <Field label="Biggest challenges" value={extended.biggestChallenges} />
        </dl>
      </Card>

      <Card>
        <CardHeader title="Documents" />
        <div className="mb-4">
          <DocumentRequestForm businessId={business.id} />
        </div>
        {documentRequests.some((r) => r.status === 'OPEN') && (
          <div className="mb-4 space-y-2">
            {documentRequests
              .filter((r) => r.status === 'OPEN')
              .map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-gold/10 px-3 py-2 text-sm">
                  <span>
                    {r.label} {r.required && <Badge tone="gold">Required</Badge>}
                  </span>
                  <span className="text-xs text-mist">Awaiting upload</span>
                </div>
              ))}
          </div>
        )}
        <div className="space-y-3">
          {documents.length === 0 && <p className="text-sm text-mist">No documents uploaded yet.</p>}
          {documents.map((doc) => (
            <DocumentReviewRow key={doc.id} document={JSON.parse(JSON.stringify(doc))} />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Support tickets" />
        {tickets.length === 0 ? (
          <p className="text-sm text-mist">No tickets from this client.</p>
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/tickets/${t.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate/10 px-3 py-2.5 text-sm hover:border-teal/40"
                >
                  <span className="font-medium text-midnight">
                    SDM-{t.ticketNumber} &middot; {t.subject}
                  </span>
                  <span className="flex items-center gap-2">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Activity log" />
        <ActivityTimeline items={activity} />
      </Card>
    </div>
  );
}
