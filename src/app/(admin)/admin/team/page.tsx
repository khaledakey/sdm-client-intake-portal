import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/format';
import { InviteTeamMemberForm } from '@/components/admin/InviteTeamMemberForm';
import { TeamStatusToggle } from '@/components/admin/TeamStatusToggle';

export default async function AdminTeamPage() {
  const user = await getCurrentUser();
  // AdminLayout already gates non-staff; team management is admin-only.
  if (!user || user.role !== 'SDM_ADMIN') redirect('/admin');

  const team = await prisma.user.findMany({
    where: { role: { in: ['SDM_ADMIN', 'SDM_TEAM_MEMBER'] } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true, lastLogin: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-midnight">Team</h1>
        <p className="mt-1 text-sm text-slate">
          {team.length} SDM staff login{team.length === 1 ? '' : 's'}.
        </p>
      </div>

      <Card>
        <CardHeader title="Invite a team member" description="They'll get an email to set their own password." />
        <div className="mt-4">
          <InviteTeamMemberForm />
        </div>
      </Card>

      <Card>
        <CardHeader title="All staff" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate/10 text-xs uppercase tracking-wide text-mist">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Last login</th>
                <th className="py-2 pr-4 font-medium">Joined</th>
                <th className="py-2 pr-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id} className="border-b border-slate/5">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-midnight">
                      {member.firstName} {member.lastName}
                    </span>
                    <span className="block text-xs text-mist">{member.email}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate">{member.role === 'SDM_ADMIN' ? 'Admin' : 'Team member'}</td>
                  <td className="py-3 pr-4">
                    {member.isActive ? <Badge tone="emerald">Active</Badge> : <Badge tone="red">Deactivated</Badge>}
                  </td>
                  <td className="py-3 pr-4 text-slate">{member.lastLogin ? formatDate(member.lastLogin) : 'Never'}</td>
                  <td className="py-3 pr-4 text-slate">{formatDate(member.createdAt)}</td>
                  <td className="py-3 pr-4 text-right">
                    <TeamStatusToggle id={member.id} isActive={member.isActive} isSelf={member.id === user.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
