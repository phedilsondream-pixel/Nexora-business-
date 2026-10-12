export default function HomePage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', color: '#0f172a' }}>Nexora Business Suite</h1>
      <p style={{ color: '#64748b', lineHeight: 1.6 }}>
        Plataforma SaaS empresarial multiempresa · pt-AO · AOA
      </p>
      <ul style={{ color: '#334155', lineHeight: 1.8 }}>
        <li>
          API health: <code>/api/health</code>
        </li>
        <li>
          Auth: <code>/api/auth/register</code>, <code>/api/auth/login</code>,{' '}
          <code>/api/auth/me</code>
        </li>
        <li>
          Admin: email <strong>phedilsondream@gmail.com</strong> → isGlobalAdmin automático
        </li>
        <li>Base de dados: Railway PostgreSQL (sem Supabase)</li>
      </ul>
    </main>
  );
}
