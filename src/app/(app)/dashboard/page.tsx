'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ModulePage } from '@/components/ModulePage';
import { api } from '@/lib/client-api';

export default function DashboardPage() {
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    api('/api/auth/me').then(setMe).catch(() => {});
  }, []);

  const modules = [
    { href: '/finance', title: 'Finanças', desc: 'Contas, tesouraria e movimentos' },
    { href: '/invoicing', title: 'Faturação', desc: 'Facturas, AGT e clientes' },
    { href: '/stock', title: 'Stocks', desc: 'Produtos e armazéns' },
    { href: '/crm', title: 'CRM', desc: 'Leads e pipeline' },
    { href: '/hr', title: 'RH', desc: 'Colaboradores e férias' },
    { href: '/projects', title: 'Projectos', desc: 'Tarefas e acompanhamento' },
    { href: '/support', title: 'Suporte', desc: 'Tickets e mensagens' },
    { href: '/reports', title: 'Relatórios', desc: 'Indicadores e exportação' },
  ];

  return (
    <ModulePage
      title={`Olá${me?.user?.fullName ? `, ${me.user.fullName.split(' ')[0]}` : ''}`}
      subtitle="Painel principal · Nexora Business Suite · AOA"
    >
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="stat-label">Organizações</div>
          <div className="stat-value">{me?.organizations?.length ?? '—'}</div>
        </div>
        <div className="card">
          <div className="stat-label">Estado</div>
          <div className="stat-value" style={{ fontSize: '1.1rem' }}>
            {me?.organizations?.[0]?.status || 'activo'}
          </div>
        </div>
        <div className="card">
          <div className="stat-label">Papel</div>
          <div className="stat-value" style={{ fontSize: '1.1rem' }}>
            {me?.user?.isGlobalAdmin ? 'Admin global' : 'Utilizador'}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Módulos</h2>
      <div className="grid grid-2">
        {modules.map((m) => (
          <Link key={m.href} href={m.href} className="card" style={{ display: 'block' }}>
            <strong style={{ display: 'block', marginBottom: 4 }}>{m.title}</strong>
            <span style={{ color: '#64748b', fontSize: 14 }}>{m.desc}</span>
          </Link>
        ))}
      </div>
    </ModulePage>
  );
}
