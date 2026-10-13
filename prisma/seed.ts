import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { resetSystem, seedUsers, ingestCandidates, getSystemCounts } from '../src/lib/system/systemAdmin';
import { testCredentials } from '../src/lib/data/seedUsers';

/**
 * Database seed.
 *
 *   npm run db:seed            -> restore seeded users (non-destructive); create baseline vacancies if none exist
 *   npm run db:seed -- --reset -> full factory reset + ingest the 30 real candidate CVs
 */
async function main() {
  const fullReset = process.argv.includes('--reset');
  console.log(`🌱 Seeding database (${fullReset ? 'full reset' : 'non-destructive'})...`);

  if (fullReset) {
    const reset = await resetSystem();
    console.log(`✓ Reset: ${reset.users} users, ${reset.vacancies} vacancies, ${reset.criteria} criteria`);
    const batch = await ingestCandidates();
    console.log(`✓ Ingested ${batch.total} candidates into "${batch.jobTitle}"`, batch.outcomes);
  } else {
    const users = await seedUsers();
    console.log(`✓ Users restored: ${users.staff} staff, ${users.applicants} applicants`);

    if ((await prisma.job.count()) === 0) {
      const reset = await resetSystem();
      console.log(`✓ No vacancies found – created ${reset.vacancies} baseline vacancies`);
    }
  }

  await prisma.auditEvent.create({
    data: {
      actorUserId: 'usr-admin-001',
      action: 'SYSTEM_DATABASE_SEEDED',
      resourceType: 'SYSTEM',
      metadata: { seededBy: 'prisma/seed.ts', fullReset, timestamp: new Date().toISOString() },
    },
  });

  console.log('📊 Counts:', await getSystemCounts());
  console.log('\n🔑 Staff login credentials:');
  console.table(testCredentials.map(c => ({ username: c.username, email: c.email, password: c.password, role: c.role })));
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
