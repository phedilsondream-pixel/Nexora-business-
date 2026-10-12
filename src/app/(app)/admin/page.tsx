'use client';

import { useEffect, useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { api } from '@/lib/client-api';

export default function AdminPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    api('/api/auth/me')
      .then((m) => {
        setMe(m);
        if (!m.user?.isGlobalAdmin) {
          setError('Acesso restrito ao administrador global.');
          return null;
        }
        return api<{ organizations: any[] }>('/api/admin/organizations');
      })
      .then((data) => {
        if (data?.organizations) setOrgs(data.organizations);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <ModulePage title="Admin global" subtitle="Gestão da plataforma Nexora · planos, organizações e auditoria">
      {error && <div className="error">{error}</div>}
      {!error && me?.user?.isGlobalAdmin && (
        <>
          <div className="grid grid-3" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="stat-label">Organizações</div>
              <div className="stat-value">{orgs.length}</div>
            </div>
            <div className="card">
              <div className="stat-label">Admin</div>
              <div className="stat-value" style={{ fontSize: '1rem' }}>{me.user.email}</div>
            </div>
            <div className="card">
              <div className="stat-label">Moeda base</div>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>AOA</div>
            </div>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {orgs.length === 0 ? (
              <div className="empty">Nenhuma organização registada.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Slug</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((o) => (
                    <tr key={o.id}>
                      <td><strong>{o.name}</strong></td>
                      <td>{o.slug}</td>
                      <td><span className="badge badge-teal">{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </ModulePage>
  );
}
