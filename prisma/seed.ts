import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

function placeholderFile(businessId: string, name: string, content: string) {
  const dir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads', businessId);
  mkdirSync(dir, { recursive: true });
  const key = `${name.replace(/[^a-z0-9.]/gi, '_')}`;
  writeFileSync(path.join(dir, key), content);
  return `${businessId}/${key}`;
}

/** DocumentRequest/Document/ActivityLog have no unique constraint to upsert
 * against, so reruns of this script against a non-empty database used to
 * duplicate every one of them. These helpers make each insert a no-op if a
 * matching row already exists, instead of adding another copy. */
async function ensureDocumentRequest(data: {
  businessId: string;
  label: string;
  documentType: string;
  required: boolean;
  status?: string;
  note?: string;
}) {
  const existing = await prisma.documentRequest.findFirst({
    where: { businessId: data.businessId, label: data.label },
  });
  if (existing) return existing;
  return prisma.documentRequest.create({ data });
}

async function ensureDocument(data: {
  businessId: string;
  fileName: string;
  documentType: string;
  storageReference: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
  reviewStatus: string;
  reviewedById?: string;
  reviewDate?: Date;
  fulfillsRequestId?: string;
}) {
  const existing = await prisma.document.findFirst({
    where: { businessId: data.businessId, fileName: data.fileName },
  });
  if (existing) return existing;
  return prisma.document.create({ data });
}

async function ensureActivityLogs(
  businessId: string,
  entries: { userId?: string; activityType: string; description: string }[]
) {
  const existing = await prisma.activityLog.findFirst({
    where: { businessId, activityType: entries[0].activityType },
  });
  if (existing) return;
  await prisma.activityLog.createMany({ data: entries.map((e) => ({ businessId, ...e })) });
}

async function main() {
  console.log('Seeding SDM Client Portal demo data...');

  const adminPassword = await hash('AdminPass123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@saoirsedigital.com' },
    update: {},
    create: {
      firstName: 'Sinead',
      lastName: 'Murphy',
      email: 'admin@saoirsedigital.com',
      phone: '+353 87 000 0001',
      passwordAuthRef: adminPassword,
      role: 'SDM_ADMIN',
      emailVerifiedAt: new Date(),
    },
  });

  const teamPassword = await hash('TeamPass123');
  const teamMember = await prisma.user.upsert({
    where: { email: 'team@saoirsedigital.com' },
    update: {},
    create: {
      firstName: 'Cian',
      lastName: 'O’Brien',
      email: 'team@saoirsedigital.com',
      phone: '+353 87 000 0002',
      passwordAuthRef: teamPassword,
      role: 'SDM_TEAM_MEMBER',
      emailVerifiedAt: new Date(),
    },
  });

  // --- Client 1: early stage, just created their account -------------------
  const client1Password = await hash('ClientPass123');
  const client1 = await prisma.user.upsert({
    where: { email: 'owner@brightleafcafe.ie' },
    update: {},
    create: {
      firstName: 'Aoife',
      lastName: 'Kelly',
      email: 'owner@brightleafcafe.ie',
      phone: '+353 87 111 2222',
      passwordAuthRef: client1Password,
      role: 'CLIENT',
    },
  });
  const business1 = await prisma.business.upsert({
    where: { id: 'seed-business-1' },
    update: {},
    create: {
      id: 'seed-business-1',
      userId: client1.id,
      businessName: 'Brightleaf Cafe',
    },
  });
  await prisma.clientIntake.upsert({
    where: { businessId: business1.id },
    update: {},
    create: { businessId: business1.id },
  });
  await ensureDocumentRequest({ businessId: business1.id, label: 'Logo files', documentType: 'LOGOS', required: true, note: 'High-resolution logo files (PNG, SVG, or AI/EPS).' });
  await ensureDocumentRequest({ businessId: business1.id, label: 'Brand guidelines', documentType: 'BRAND_GUIDELINES', required: false, note: 'Existing brand guidelines, if available.' });
  await ensureDocumentRequest({ businessId: business1.id, label: 'Website access (grant via platform invite)', documentType: 'WEBSITE_DOCUMENTS', required: true, note: 'CMS/hosting access details.' });
  await ensureActivityLogs(business1.id, [
    { userId: client1.id, activityType: 'ACCOUNT_CREATED', description: 'Aoife Kelly created an SDM Client Portal account for Brightleaf Cafe.' },
  ]);

  // --- Client 2: mid onboarding, business info + intake complete, one doc uploaded, awaiting review
  const client2Password = await hash('ClientPass123');
  const client2 = await prisma.user.upsert({
    where: { email: 'hello@kilkennyfitco.ie' },
    update: {},
    create: {
      firstName: 'Darragh',
      lastName: 'Byrne',
      email: 'hello@kilkennyfitco.ie',
      phone: '+353 87 333 4444',
      passwordAuthRef: client2Password,
      role: 'CLIENT',
      emailVerifiedAt: new Date(),
    },
  });
  const business2 = await prisma.business.upsert({
    where: { id: 'seed-business-2' },
    update: {},
    create: {
      id: 'seed-business-2',
      userId: client2.id,
      businessName: 'Kilkenny Fit Co.',
      tradingName: 'KFC Training',
      website: 'https://kilkennyfitco.ie',
      industry: 'Health & Wellness',
      businessDescription: 'A boutique strength & conditioning gym serving Kilkenny city and surrounds.',
      location: 'Kilkenny, Ireland',
      employeeCount: '6-10',
      serviceArea: 'Kilkenny & Carlow',
      businessStage: 'Established',
      mainContactName: 'Darragh Byrne',
      mainContactEmail: 'hello@kilkennyfitco.ie',
      mainContactPhone: '+353 87 333 4444',
    },
  });
  await prisma.clientIntake.upsert({
    where: { businessId: business2.id },
    update: {},
    create: {
      businessId: business2.id,
      businessGoals: 'Grow membership by 25% over the next year and launch an online coaching product.',
      marketingObjectives: 'Increase local lead generation and build a stronger social media presence.',
      targetCustomers: 'Adults aged 25-45 in Kilkenny interested in strength training and general fitness.',
      marketingChallenges: 'Inconsistent social posting and no real lead tracking from ads.',
      growthTargets: '25% membership growth in 12 months.',
      competitors: 'Anytime Fitness Kilkenny, local independent PT studios.',
      extendedData: JSON.stringify({
        targetLocations: 'Kilkenny City, Carlow',
        keyProductsServices: 'Group classes, 1:1 personal training, online coaching plans',
        expectedOutcomes: 'A steady pipeline of qualified leads and a recognisable local brand.',
        currentWebsite: 'https://kilkennyfitco.ie',
        socialMediaPlatforms: ['Instagram', 'Facebook'],
        advertisingChannels: ['Meta Ads'],
        seoActivity: 'Basic',
        emailMarketingActivity: 'Occasional',
        contentMarketingActivity: 'Occasional',
        marketingTools: 'Mailchimp, Canva',
        existingAgency: 'None currently',
        bestPerformingActivity: 'Instagram Reels showing class highlights.',
        biggestChallenges: 'Turning social engagement into paying members.',
      }),
    },
  });
  const req2 = await ensureDocumentRequest({ businessId: business2.id, label: 'Logo files', documentType: 'LOGOS', required: true, status: 'FULFILLED' });
  const storageRef2 = placeholderFile(business2.id, 'kfc-logo-pack.txt', 'Placeholder logo pack for Kilkenny Fit Co.');
  await ensureDocument({
    businessId: business2.id,
    fileName: 'kfc-logo-pack.txt',
    documentType: 'LOGOS',
    storageReference: storageRef2,
    fileSize: 48,
    mimeType: 'text/plain',
    uploadedById: client2.id,
    reviewStatus: 'UNDER_REVIEW',
    fulfillsRequestId: req2.id,
  });
  await ensureDocumentRequest({ businessId: business2.id, label: 'Brand guidelines', documentType: 'BRAND_GUIDELINES', required: false });
  await ensureDocumentRequest({ businessId: business2.id, label: 'Website access (grant via platform invite)', documentType: 'WEBSITE_DOCUMENTS', required: true });
  await ensureActivityLogs(business2.id, [
    { userId: client2.id, activityType: 'ACCOUNT_CREATED', description: 'Darragh Byrne created an SDM Client Portal account for Kilkenny Fit Co.' },
    { userId: client2.id, activityType: 'BUSINESS_INFO_UPDATED', description: 'Business information was updated.' },
    { userId: client2.id, activityType: 'INTAKE_SUBMITTED', description: 'Marketing intake information was updated.' },
    { userId: client2.id, activityType: 'DOCUMENT_UPLOADED', description: 'Uploaded "kfc-logo-pack.txt".' },
  ]);

  const ticket = await prisma.supportTicket.upsert({
    where: { ticketNumber: 1001 },
    update: {},
    create: {
      businessId: business2.id,
      ticketNumber: 1001,
      subject: 'Question about ad account access',
      category: 'MARKETING_SERVICES',
      priority: 'NORMAL',
      status: 'WAITING_FOR_CLIENT',
      createdById: client2.id,
      assignedToId: teamMember.id,
      messages: {
        create: [
          { senderId: client2.id, senderType: 'CLIENT', message: 'Do you need admin access to our Meta Business account, or just advertiser access?' },
          { senderId: teamMember.id, senderType: 'SDM_TEAM', message: 'Advertiser access is enough for us to run and manage campaigns — no need for admin.' },
          { senderId: teamMember.id, senderType: 'SDM_TEAM', message: 'Client asked a reasonable question, nothing unusual here.', internal: true },
        ],
      },
    },
  });
  await ensureActivityLogs(business2.id, [
    { userId: client2.id, activityType: 'TICKET_CREATED', description: `Opened support ticket SDM-${ticket.ticketNumber}: Question about ad account access` },
  ]);

  // --- Client 3: fully onboarded --------------------------------------------
  const client3Password = await hash('ClientPass123');
  const client3 = await prisma.user.upsert({
    where: { email: 'info@corkcraftbrew.ie' },
    update: {},
    create: {
      firstName: 'Niamh',
      lastName: 'Walsh',
      email: 'info@corkcraftbrew.ie',
      phone: '+353 87 555 6666',
      passwordAuthRef: client3Password,
      role: 'CLIENT',
      emailVerifiedAt: new Date(),
    },
  });
  const business3 = await prisma.business.upsert({
    where: { id: 'seed-business-3' },
    update: {},
    create: {
      id: 'seed-business-3',
      userId: client3.id,
      businessName: 'Cork Craft Brew Co.',
      website: 'https://corkcraftbrew.ie',
      industry: 'Hospitality & Food',
      businessDescription: 'An independent craft brewery and taproom in Cork city.',
      location: 'Cork, Ireland',
      employeeCount: '11-25',
      serviceArea: 'Munster',
      businessStage: 'Scaling',
      mainContactName: 'Niamh Walsh',
      mainContactEmail: 'info@corkcraftbrew.ie',
      mainContactPhone: '+353 87 555 6666',
    },
  });
  await prisma.clientIntake.upsert({
    where: { businessId: business3.id },
    update: {},
    create: {
      businessId: business3.id,
      businessGoals: 'Expand distribution across Munster and grow taproom footfall.',
      marketingObjectives: 'Build brand awareness and drive taproom bookings.',
      targetCustomers: 'Craft beer enthusiasts aged 25-45 across Munster.',
      marketingChallenges: 'Limited paid media experience and no email list.',
      growthTargets: '30% revenue growth this year.',
      competitors: 'Other regional independent breweries.',
      extendedData: JSON.stringify({
        targetLocations: 'Cork, Limerick, Waterford',
        keyProductsServices: 'Core beer range, seasonal releases, taproom events',
        expectedOutcomes: 'A full marketing calendar and measurable growth in taproom visits.',
        currentWebsite: 'https://corkcraftbrew.ie',
        socialMediaPlatforms: ['Instagram', 'Facebook', 'X / Twitter'],
        advertisingChannels: ['Meta Ads', 'Google Ads'],
        seoActivity: 'Regular',
        emailMarketingActivity: 'None',
        contentMarketingActivity: 'Regular',
        marketingTools: 'Canva, Later',
        existingAgency: 'None currently',
        bestPerformingActivity: 'Taproom event posts on Instagram.',
        biggestChallenges: 'No structured email marketing or CRM.',
      }),
      sdmReviewedBy: admin.id,
      sdmReviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      onboardingCompletedBy: admin.id,
      onboardingCompletedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      onboardingStatus: 'ONBOARDING_COMPLETE',
      progressPercentage: 100,
    },
  });
  const req3a = await ensureDocumentRequest({ businessId: business3.id, label: 'Logo files', documentType: 'LOGOS', required: true, status: 'FULFILLED' });
  const req3b = await ensureDocumentRequest({ businessId: business3.id, label: 'Website access (grant via platform invite)', documentType: 'WEBSITE_DOCUMENTS', required: true, status: 'FULFILLED' });
  const logoRef = placeholderFile(business3.id, 'cork-craft-brew-logo.txt', 'Placeholder logo asset for Cork Craft Brew Co.');
  const accessRef = placeholderFile(business3.id, 'website-access.txt', 'Placeholder website access notes for Cork Craft Brew Co.');
  await ensureDocument({
    businessId: business3.id, fileName: 'cork-craft-brew-logo.txt', documentType: 'LOGOS', storageReference: logoRef,
    fileSize: 52, mimeType: 'text/plain', uploadedById: client3.id, reviewStatus: 'APPROVED',
    reviewedById: admin.id, reviewDate: new Date(), fulfillsRequestId: req3a.id,
  });
  await ensureDocument({
    businessId: business3.id, fileName: 'website-access.txt', documentType: 'WEBSITE_DOCUMENTS', storageReference: accessRef,
    fileSize: 60, mimeType: 'text/plain', uploadedById: client3.id, reviewStatus: 'APPROVED',
    reviewedById: admin.id, reviewDate: new Date(), fulfillsRequestId: req3b.id,
  });
  await ensureActivityLogs(business3.id, [
    { userId: client3.id, activityType: 'ACCOUNT_CREATED', description: 'Niamh Walsh created an SDM Client Portal account for Cork Craft Brew Co.' },
    { userId: client3.id, activityType: 'DOCUMENT_UPLOADED', description: 'Uploaded "cork-craft-brew-logo.txt".' },
    { userId: admin.id, activityType: 'SDM_REVIEW_COMPLETED', description: 'Sinead Murphy completed the SDM review.' },
    { userId: admin.id, activityType: 'ONBOARDING_COMPLETED', description: 'Sinead Murphy marked onboarding complete.' },
  ]);

  console.log('\nSeed complete. Demo logins:');
  console.log('  SDM Admin        admin@saoirsedigital.com / AdminPass123');
  console.log('  SDM Team Member  team@saoirsedigital.com / TeamPass123');
  console.log('  Client (new)     owner@brightleafcafe.ie / ClientPass123');
  console.log('  Client (mid)     hello@kilkennyfitco.ie / ClientPass123');
  console.log('  Client (done)    info@corkcraftbrew.ie / ClientPass123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
