import type { ReactNode } from 'react';
import './designSystem.css';
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <div className="ds-theme">{children}</div>;
}

type BadgeVariant = 'neutral' | 'info' | 'special' | 'warning' | 'buy' | 'sell';

export function Badge({
  variant,
  title,
  children,
}: {
  variant: BadgeVariant;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span className={`ds-badge ds-badge-${variant}`} title={title}>
      {children}
    </span>
  );
}

type ButtonVariant = 'primary' | 'ghost';

export function Button({
  variant,
  onClick,
  children,
  ...rest
}: {
  variant: ButtonVariant;
  onClick?: () => void;
  children: ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'>) {
  return (
    <button type="button" className={`ds-button ds-button-${variant}`} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}

export type IconName = 'import' | 'config' | 'layout' | 'help';

const ICON_PATHS: Record<IconName, ReactNode> = {
  import: (
    <path d="M8 2v8m0 0L5 7m3 3 3-3M3 12v3h10v-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  config: (
    <path d="M8 5.5A2.5 2.5 0 1 0 8 10.5 2.5 2.5 0 0 0 8 5.5ZM2.5 8h2M11.5 8h2M8 2.5v2M8 11.5v2M4.3 4.3l1.4 1.4M10.3 10.3l1.4 1.4M11.7 4.3l-1.4 1.4M5.7 10.3 4.3 11.7" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
  ),
  layout: (
    <path d="M2.5 2.5h11v11h-11zM2.5 6.5h11M6.5 6.5v7" stroke="currentColor" strokeWidth="1.3" fill="none" />
  ),
  help: (
    <path d="M6 6a2 2 0 1 1 2.6 1.9c-.8.3-.6 1.1-.6 1.6M8 13.5v.1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  ),
};

export function Icon({ name, label }: { name: IconName; label: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" role="img" aria-label={label}>
      {ICON_PATHS[name]}
    </svg>
  );
}
