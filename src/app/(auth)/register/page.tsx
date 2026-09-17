import { redirect } from 'next/navigation';

/** Self-serve sign-up is retired: every real account is now provisioned by
 * the Make CRM automation via POST /api/users (src/app/api/users/route.ts),
 * which emails a set-password link to /reset-password — so this UI isn't
 * needed. The route stays (so old links don't 404, and POST /api/auth/register
 * is untouched in case anything else still calls it) but just sends
 * visitors to /login. */
export default function RegisterPage() {
  redirect('/login');
}
