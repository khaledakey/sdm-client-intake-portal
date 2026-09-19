import type { SVGProps } from 'react';

function Icon(props: SVGProps<SVGSVGElement> & { d: string }) {
  const { d, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d={d} />
    </svg>
  );
}

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
);
export const IconBriefcase = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} d="M3 8.5h18M3 8.5v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9M8 8.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.5M10 13h4" />
);
export const IconClipboard = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1ZM6 6h12v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6ZM9 11h6M9 15h6" />
);
export const IconFolder = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" />
);
export const IconLifeBuoy = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 5l4.2 4.2M14.8 14.8 19 19M19 5l-4.2 4.2M9.2 14.8 5 19" />
);
export const IconBell = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9ZM13.7 21a2 2 0 0 1-3.4 0" />
);
export const IconSettings = (p: SVGProps<SVGSVGElement>) => (
  <Icon
    {...p}
    d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.36.5 1 1.55 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
  />
);
export const IconMenu = (p: SVGProps<SVGSVGElement>) => <Icon {...p} d="M4 6h16M4 12h16M4 18h16" />;
export const IconClose = (p: SVGProps<SVGSVGElement>) => <Icon {...p} d="M6 6l12 12M18 6 6 18" />;
export const IconCheck = (p: SVGProps<SVGSVGElement>) => <Icon {...p} d="M5 13l4 4L19 7" />;
export const IconUpload = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
);
export const IconArrowRight = (p: SVGProps<SVGSVGElement>) => <Icon {...p} d="M5 12h14M13 6l6 6-6 6" />;
export const IconLogout = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9" />
);
export const IconFile = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} d="M14 3v5a1 1 0 0 0 1 1h5M6 21h12a1 1 0 0 0 1-1V8l-6-6H7a1 1 0 0 0-1 1v17a1 1 0 0 0 1 1Z" />
);
export const IconTrash = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
);
export const IconUsers = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M17 7.5a3 3 0 1 1-1.5 5.6M20.5 20v-1a4.5 4.5 0 0 0-3-4.24" />
);
