import type { ActivityLog } from '@prisma/client';

export function timeAgo(date: Date) {
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
    return <div className="empty" style={{ padding: '24px 0', textAlign: 'left' }}>No activity yet. Actions you take will appear here.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 6 }}>
      {items.map((item) => (
        <div key={item.id}>
          <div style={{ fontSize: 13 }}>{item.description}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {timeAgo(new Date(item.createdAt))}
          </div>
        </div>
      ))}
    </div>
  );
}
