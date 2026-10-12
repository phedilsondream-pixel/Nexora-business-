'use client';

import { ModulePage } from '@/components/ModulePage';

export default function Page() {
  return (
    <ModulePage title="Stocks" subtitle="Produtos, armazéns e movimentos">
      <div className="card">
        <p style={{ marginTop: 0, color: '#334155' }}>
          Módulo <strong>Stocks</strong> integrado na plataforma Nexora.
          A estrutura de dados já existe na base PostgreSQL (Supabase) e as APIs
          de autenticação e multiempresa estão activas.
        </p>
        <div className="grid grid-2">
          <div className="card" style={{ background: '#f8fafc', boxShadow: 'none' }}>
            <strong>Estado</strong>
            <div style={{ marginTop: 6 }}><span className="badge badge-green">Operacional (UI + BD)</span></div>
          </div>
          <div className="card" style={{ background: '#f8fafc', boxShadow: 'none' }}>
            <strong>Próximos endpoints</strong>
            <div style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>CRUD completo deste módulo</div>
          </div>
        </div>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 0 }}>
          Use o menu lateral para navegar entre todos os módulos. Finanças e Admin global
          já têm listagens ligadas à API em produção.
        </p>
      </div>
    </ModulePage>
  );
}
