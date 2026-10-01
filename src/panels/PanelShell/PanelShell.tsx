// panels/PanelShell/PanelShell.tsx
// Moldura padrao dos paineis: titulo + conteudo. Sem regra de negocio.
import type { ReactNode } from 'react';
import type { PanelMode } from '../../workspace/types';

export type { PanelMode };

export interface PanelShellProps {
  title: string;
  children: ReactNode;
  mode?: PanelMode;
  className?: string;
}

export function PanelShell({ title, children, className }: PanelShellProps) {
  return (
    <section className={`ftp-panel${className ? ` ${className}` : ''}`} aria-label={title}>
      <header className="ftp-panel-title">{title}</header>
      <div className="ftp-panel-body">{children}</div>
    </section>
  );
}
