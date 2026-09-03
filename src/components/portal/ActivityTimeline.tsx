import type { ActivityLog } from '@prisma/client';

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Infinity, 'year'],
  ];
  let value = seconds;
  let unit = 'second';
  for (const [size, name] of units) {
    if (value < size) {
      unit = name;
      break;
    }
    value = Math.floor(value / size);
    unit = name;
  }
  if (value <= 1 && unit === 'second') return 'just now';
  return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
}

export function ActivityTimeline({ items }: { items: ActivityLog[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-mist">No activity yet. Actions you take will appear here.</p>;
  }
  return (
    <ol className="relative space-y-5 border-l border-slate/10 pl-5">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-teal" />
          <p className="text-sm text-midnight">{item.description}</p>
          <p className="mt-0.5 text-xs text-mist">{timeAgo(new Date(item.createdAt))}</p>
        </li>
      ))}
    </ol>
  );
}
