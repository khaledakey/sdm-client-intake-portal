import { describe, expect, it } from 'vitest';
import { assertSeedAllowed, hasForceFlag, isProductionEnvironment } from '../seed-guard';

describe('isProductionEnvironment', () => {
  it('flags the Railway production environment, case-insensitively', () => {
    expect(isProductionEnvironment({ RAILWAY_ENVIRONMENT_NAME: 'production' })).toBe(true);
    expect(isProductionEnvironment({ RAILWAY_ENVIRONMENT_NAME: 'Production' })).toBe(true);
  });

  it('falls back to RAILWAY_ENVIRONMENT if RAILWAY_ENVIRONMENT_NAME is unset', () => {
    expect(isProductionEnvironment({ RAILWAY_ENVIRONMENT: 'production' })).toBe(true);
  });

  it('does not flag staging or a missing environment', () => {
    expect(isProductionEnvironment({ RAILWAY_ENVIRONMENT_NAME: 'staging' })).toBe(false);
    expect(isProductionEnvironment({})).toBe(false);
  });
});

describe('hasForceFlag', () => {
  it('detects --force on argv', () => {
    expect(hasForceFlag(['node', 'seed.ts', '--force'], {})).toBe(true);
  });

  it('detects SEED_FORCE=true', () => {
    expect(hasForceFlag(['node', 'seed.ts'], { SEED_FORCE: 'true' })).toBe(true);
  });

  it('is false otherwise', () => {
    expect(hasForceFlag(['node', 'seed.ts'], {})).toBe(false);
  });
});

describe('assertSeedAllowed', () => {
  it('throws for production without a force flag', () => {
    expect(() =>
      assertSeedAllowed(['node', 'seed.ts'], { RAILWAY_ENVIRONMENT_NAME: 'production' })
    ).toThrow(/production/i);
  });

  it('does not throw for production with --force', () => {
    expect(() =>
      assertSeedAllowed(['node', 'seed.ts', '--force'], { RAILWAY_ENVIRONMENT_NAME: 'production' })
    ).not.toThrow();
  });

  it('does not throw for production with SEED_FORCE=true', () => {
    expect(() =>
      assertSeedAllowed(['node', 'seed.ts'], {
        RAILWAY_ENVIRONMENT_NAME: 'production',
        SEED_FORCE: 'true',
      })
    ).not.toThrow();
  });

  it('does not throw for non-production environments', () => {
    expect(() =>
      assertSeedAllowed(['node', 'seed.ts'], { RAILWAY_ENVIRONMENT_NAME: 'staging' })
    ).not.toThrow();
    expect(() => assertSeedAllowed(['node', 'seed.ts'], {})).not.toThrow();
  });
});
