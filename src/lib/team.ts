/** Guards around deactivating an SDM staff login (src/app/api/admin/team/[id]/route.ts).
 * Pulled out as a pure function so the lockout rules are unit-testable without a DB. */
export function assertCanDeactivateStaff(
  target: { id: string; role: string; isActive: boolean },
  actingUserId: string,
  activeAdminCount: number
): string | null {
  if (target.id === actingUserId) {
    return "You can't deactivate your own account.";
  }
  if (target.role === 'SDM_ADMIN' && target.isActive && activeAdminCount <= 1) {
    return "Can't deactivate the last active admin.";
  }
  return null;
}
