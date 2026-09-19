import { describe, expect, it } from 'vitest';
import { assertCanDeactivateStaff } from '../team';

describe('assertCanDeactivateStaff', () => {
  it('refuses to let an admin deactivate their own account', () => {
    const err = assertCanDeactivateStaff({ id: 'u1', role: 'SDM_ADMIN', isActive: true }, 'u1', 3);
    expect(err).toMatch(/own account/);
  });

  it('refuses to deactivate the last active admin', () => {
    const err = assertCanDeactivateStaff({ id: 'u2', role: 'SDM_ADMIN', isActive: true }, 'u1', 1);
    expect(err).toMatch(/last active admin/);
  });

  it('allows deactivating an admin when other active admins remain', () => {
    const err = assertCanDeactivateStaff({ id: 'u2', role: 'SDM_ADMIN', isActive: true }, 'u1', 2);
    expect(err).toBeNull();
  });

  it('allows deactivating a team member regardless of admin count', () => {
    const err = assertCanDeactivateStaff({ id: 'u2', role: 'SDM_TEAM_MEMBER', isActive: true }, 'u1', 1);
    expect(err).toBeNull();
  });

  it('allows reactivating an already-inactive admin even if they are the only admin', () => {
    const err = assertCanDeactivateStaff({ id: 'u2', role: 'SDM_ADMIN', isActive: false }, 'u1', 1);
    expect(err).toBeNull();
  });
});
