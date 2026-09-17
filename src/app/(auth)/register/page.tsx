import { redirect } from 'next/navigation';

/** Self-serve sign-up is retired: every real account is now provisioned by
 * the Make CRM automation via POST /api/users (src/app/api/users/route.ts),
 * which emails a set-password link to /reset-password — so this UI isn't
 * needed. POST /api/auth/register (the API this form used to call) is also
 * retired, returning 410. The page route stays (so old links don't 404)
 * but just sends visitors to /login. */
export default function RegisterPage() {
  redirect('/login');
}
