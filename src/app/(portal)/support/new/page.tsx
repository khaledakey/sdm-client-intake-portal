import { Card, CardHeader } from '@/components/ui/Card';
import { NewTicketForm } from '@/components/portal/NewTicketForm';

export default function NewTicketPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-midnight">New Support Ticket</h1>
        <p className="mt-1 text-sm text-slate">We&apos;ll notify the SDM team the moment you submit this.</p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader title="Tell us what's going on" />
        <NewTicketForm />
      </Card>
    </div>
  );
}
