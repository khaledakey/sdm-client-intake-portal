import { NewTicketForm } from '@/components/portal/NewTicketForm';

export default function NewTicketPage() {
  return (
    <div>
      <h1>New Support Ticket</h1>
      <p className="lede">We&apos;ll notify the SDM team the moment you submit this.</p>
      <NewTicketForm />
    </div>
  );
}
