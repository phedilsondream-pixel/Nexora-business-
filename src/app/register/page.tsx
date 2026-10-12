'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/client-api';

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          password,
          organizationName,
          organizationSlug: organizationSlug || slugify(organizationName),
        }),
      });
      // auto login
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Falha no registo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>Criar conta</h1>
        <p className="sub">30 dias de teste · pt-AO · Kwanza (AOA)</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label className="label">Nome completo</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Palavra-passe</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div className="field">
            <label className="label">Nome da empresa</label>
            <input
              className="input"
              value={organizationName}
              onChange={(e) => {
                setOrganizationName(e.target.value);
                setOrganizationSlug(slugify(e.target.value));
              }}
              required
            />
          </div>
          <div className="field">
            <label className="label">Identificador (slug)</label>
            <input className="input" value={organizationSlug} onChange={(e) => setOrganizationSlug(slugify(e.target.value))} required pattern="[a-z0-9\-]+" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'A criar…' : 'Começar grátis'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14, color: '#64748b', textAlign: 'center' }}>
          Já tem conta? <Link href="/login" style={{ color: '#0d9488', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
