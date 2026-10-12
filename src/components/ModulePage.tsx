'use client';

import { ReactNode } from 'react';

export function ModulePage({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{title}</h1>
          {subtitle && <p style={{ margin: '4px 0 0', color: '#64748b' }}>{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
