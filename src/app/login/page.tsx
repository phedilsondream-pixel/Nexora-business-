'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/client-api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className="logo" style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg,#14b8a6,#0d9488)',
            display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800
          }}>N</div>
          <div>
            <strong>Nexora Business Suite</strong>
            <div style={{ fontSize: 12, color: '#64748b' }}>SaaS empresarial · Angola (AOA)</div>
          </div>
        </div>
        <h1>Entrar</h1>
        <p className="sub">Aceda ao painel da sua empresa</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="voce@empresa.ao" />
          </div>
          <div className="field">
            <label className="label">Palavra-passe</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'A entrar…' : 'Entrar'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14, color: '#64748b', textAlign: 'center' }}>
          Ainda não tem conta? <Link href="/register" style={{ color: '#0d9488', fontWeight: 600 }}>Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
