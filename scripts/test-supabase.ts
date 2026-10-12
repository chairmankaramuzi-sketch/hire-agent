import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Testing connection to Supabase...');
  
  // 1. Count jobs
  const jobCount = await prisma.job.count();
  console.log('✓ Successfully queried Supabase! Job count:', jobCount);

  // 2. Create and fetch a test audit event
  const audit = await prisma.auditEvent.create({
    data: {
      action: 'SMOKE_TEST_CONNECTIVITY',
      resourceType: 'SYSTEM',
      metadata: { status: 'healthy', provider: 'supabase' },
    },
  });
  console.log('✓ Successfully created audit event in Supabase! ID:', audit.id);

  // 3. Query back the event
  const fetched = await prisma.auditEvent.findUnique({
    where: { id: audit.id },
  });
  console.log('✓ Successfully retrieved record from Supabase:', fetched?.action);

  // 4. Clean up test record
  await prisma.auditEvent.delete({
    where: { id: audit.id },
  });
  console.log('✓ Successfully cleaned up test record. Connection test passed!');
}

main()
  .catch((e) => {
    console.error('Connection test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
