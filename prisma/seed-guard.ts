/** Refuses to run prisma/seed.ts against a real Railway "production"
 * environment unless explicitly forced. Checked before seed.ts does
 * anything else — before it even constructs a PrismaClient — since the
 * whole point is to never touch a real database by accident.
 *
 * Kept in its own module (rather than inline in seed.ts) so it can be
 * unit tested without importing seed.ts itself, which runs main() as a
 * side effect of being imported. */

type Env = Record<string, string | undefined>;

export function isProductionEnvironment(env: Env = process.env): boolean {
  const name = (env.RAILWAY_ENVIRONMENT_NAME || env.RAILWAY_ENVIRONMENT || '').toLowerCase();
  return name === 'production';
}

export function hasForceFlag(argv: string[] = process.argv, env: Env = process.env): boolean {
  return argv.includes('--force') || env.SEED_FORCE === 'true';
}

export function assertSeedAllowed(argv: string[] = process.argv, env: Env = process.env): void {
  if (isProductionEnvironment(env) && !hasForceFlag(argv, env)) {
    throw new Error(
      'Refusing to run prisma/seed.ts against the Railway "production" environment — ' +
        'this inserts demo accounts (including admin@saoirsedigital.com / AdminPass123) and ' +
        'sample data into a real database. If this is genuinely intended, rerun with --force ' +
        '(npm run prisma:seed -- --force) or set SEED_FORCE=true.'
    );
  }
}
