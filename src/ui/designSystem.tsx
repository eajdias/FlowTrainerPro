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
