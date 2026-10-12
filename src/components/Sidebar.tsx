'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon: string; adminOnly?: boolean };

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '◫' },
    ],
  },
  {
    title: 'Operações',
    items: [
      { href: '/finance', label: 'Finanças', icon: '₫' },
      { href: '/invoicing', label: 'Faturação', icon: '🧾' },
      { href: '/stock', label: 'Stocks', icon: '▣' },
      { href: '/crm', label: 'CRM / Vendas', icon: '◎' },
      { href: '/purchases', label: 'Compras', icon: '⬇' },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { href: '/hr', label: 'RH', icon: '👤' },
      { href: '/projects', label: 'Projectos', icon: '☰' },
      { href: '/support', label: 'Suporte', icon: '✦' },
      { href: '/documents', label: 'Documentos', icon: '📄' },
      { href: '/assets', label: 'Activos', icon: '⬡' },
    ],
  },
  {
    title: 'Análise',
    items: [
      { href: '/reports', label: 'Relatórios', icon: '▦' },
      { href: '/settings', label: 'Definições', icon: '⚙' },
    ],
  },
  {
    title: 'Plataforma',
    items: [
      { href: '/admin', label: 'Admin global', icon: '★', adminOnly: true },
    ],
  },
];

export function Sidebar({ isGlobalAdmin }: { isGlobalAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">N</div>
        <div>
          <strong>Nexora</strong>
          <span>Business Suite</span>
        </div>
      </div>
      <nav className="nav">
        {SECTIONS.map((section) => {
          const items = section.items.filter((i) => !i.adminOnly || isGlobalAdmin);
          if (!items.length) return null;
          return (
            <div key={section.title}>
              <div className="nav-section">{section.title}</div>
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link key={item.href} href={item.href} className={active ? 'active' : ''}>
                    <span style={{ width: 18, textAlign: 'center', opacity: 0.9 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
