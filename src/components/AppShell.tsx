'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { api } from '@/lib/client-api';

type Me = {
  user: { id: string; email: string; fullName: string | null; isGlobalAdmin: boolean };
  organizations: Array<{ id: string; name: string; slug: string; status: string; isOwner: boolean }>;
};

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    api<Me>('/api/auth/me')
      .then((data) => {
        setMe(data);
        const first = data.organizations?.[0]?.id || null;
        setOrgId(first);
        if (first) localStorage.setItem('nexora_org_id', first);
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#64748b' }}>
        A carregar Nexora…
      </div>
    );
  }
  if (!me) return null;

  const org = me.organizations.find((o) => o.id === orgId) || me.organizations[0];

  return (
    <div className="shell">
      <Sidebar isGlobalAdmin={me.user.isGlobalAdmin} />
      <div className="main">
        <header className="topbar">
          <div>
            <div style={{ fontWeight: 700 }}>{org?.name || 'Sem organização'}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {me.user.isGlobalAdmin && <span className="badge badge-teal" style={{ marginRight: 8 }}>Admin global</span>}
              {org?.status && <span className="badge badge-slate">{org.status}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{me.user.fullName || me.user.email}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{me.user.email}</div>
            </div>
            <button className="btn btn-ghost" onClick={logout}>Sair</button>
          </div>
        </header>
        <div className="content" data-org-id={org?.id || ''}>
          {children}
        </div>
      </div>
    </div>
  );
}
