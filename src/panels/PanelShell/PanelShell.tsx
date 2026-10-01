// panels/PanelShell/PanelShell.tsx
// Moldura padrao dos paineis: titulo + conteudo. Sem regra de negocio.
import type { ReactNode } from 'react';
import type { PanelMode } from '../../workspace/types';

export type { PanelMode };

export interface PanelShellProps {
  title: string;
  children: ReactNode;
  mode?: PanelMode;
}

export function PanelShell({ title, children }: PanelShellProps) {
  return (
    <section className="ftp-panel" aria-label={title}>
      <header className="ftp-panel-title">{title}</header>
      <div className="ftp-panel-body">{children}</div>
    </section>
  );
}
