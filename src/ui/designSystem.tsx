import type { ReactNode } from 'react';
import './designSystem.css';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <div className="ds-theme">{children}</div>;
}

/* ═══ BADGE ═══ */

type BadgeVariant = 'neutral' | 'info' | 'special' | 'warning' | 'buy' | 'sell';

export function Badge({
  variant,
  title,
  dot,
  children,
}: {
  variant: BadgeVariant;
  title?: string;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`ds-badge ds-badge-${variant}`} title={title}>
      {dot && <span className="ds-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

/* ═══ BUTTON ═══ */

type ButtonVariant = 'primary' | 'ghost' | 'danger';

export function Button({
  variant,
  compact,
  onClick,
  children,
  ...rest
}: {
  variant: ButtonVariant;
  compact?: boolean;
  onClick?: () => void;
  children: ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'>) {
  return (
    <button
      type="button"
      className={`ds-button ds-button-${variant}${compact ? ' ds-button-compact' : ''}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ═══ TOOLTIP ═══ */

export function Tooltip({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}) {
  return (
    <span className="ds-tooltip">
      {children}
      <span className="ds-tooltip-bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}

/* ═══ SKELETON ═══ */

export function Skeleton({
  width = '100%',
  height = 12,
}: {
  width?: number | string;
  height?: number | string;
}) {
  return <span className="ds-skeleton" style={{ width, height }} aria-hidden="true" />;
}

/* ═══ ICON ═══ */

export type IconName =
  | 'import'
  | 'config'
  | 'layout'
  | 'help'
  | 'play'
  | 'pause'
  | 'stop'
  | 'download'
  | 'database'
  | 'calendar'
  | 'chart'
  | 'search'
  | 'close'
  | 'chevron-down';

const STROKE = {
  stroke: 'currentColor',
  strokeWidth: 1.4,
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const ICON_PATHS: Record<IconName, ReactNode> = {
  import: <path d="M8 2v8m0 0L5 7m3 3 3-3M3 12v3h10v-3" {...STROKE} />,
  config: (
    <path
      d="M8 5.5A2.5 2.5 0 1 0 8 10.5 2.5 2.5 0 0 0 8 5.5ZM2.5 8h2M11.5 8h2M8 2.5v2M8 11.5v2M4.3 4.3l1.4 1.4M10.3 10.3l1.4 1.4M11.7 4.3l-1.4 1.4M5.7 10.3 4.3 11.7"
      {...STROKE}
      strokeWidth={1.2}
    />
  ),
  layout: <path d="M2.5 2.5h11v11h-11zM2.5 6.5h11M6.5 6.5v7" {...STROKE} strokeWidth={1.2} />,
  help: (
    <path
      d="M6 6a2 2 0 1 1 2.6 1.9c-.8.3-.6 1.1-.6 1.6M8 13.5v.1"
      {...STROKE}
    />
  ),
  play: <path d="M4.5 2.8v10.4L13 8z" {...STROKE} />,
  pause: <path d="M5 3v10M11 3v10" {...STROKE} strokeWidth={1.8} />,
  stop: <path d="M4.5 4.5h7v7h-7z" {...STROKE} />,
  download: <path d="M8 2v8m0 0L5 7m3 3 3-3M3 12v2.5h10V12" {...STROKE} />,
  database: (
    <path
      d="M8 2c3 0 5 .8 5 1.8v8.4c0 1-2 1.8-5 1.8s-5-.8-5-1.8V3.8C3 2.8 5 2 8 2ZM3 6.5c0 1 2 1.8 5 1.8s5-.8 5-1.8M3 10c0 1 2 1.8 5 1.8s5-.8 5-1.8"
      {...STROKE}
      strokeWidth={1.2}
    />
  ),
  calendar: <path d="M3 4h10v9.5H3zM3 6.5h10M5.5 2.5v3M10.5 2.5v3" {...STROKE} strokeWidth={1.2} />,
  chart: <path d="M3 13V8m3.5 5V4M10 13V6.5M13 13V9" {...STROKE} />,
  search: <path d="M7.2 2.8a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8ZM10.5 10.5 13.5 13.5" {...STROKE} />,
  close: <path d="m4 4 8 8M12 4l-8 8" {...STROKE} />,
  'chevron-down': <path d="m4 6 4 4 4-4" {...STROKE} />,
};

export function Icon({ name, label }: { name: IconName; label: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" role="img" aria-label={label}>
      {ICON_PATHS[name]}
    </svg>
  );
}
