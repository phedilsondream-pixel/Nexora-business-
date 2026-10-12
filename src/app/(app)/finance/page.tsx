'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { api } from '@/lib/client-api';

type Account = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: string | number;
  isActive: boolean;
};

export default function FinancePage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [initialBalance, setInitialBalance] = useState(0);

  async function load(oid: string) {
    setLoading(true);
    try {
      const data = await api<{ accounts: Account[] }>(`/api/organizations/${oid}/finance/accounts`);
      setAccounts(data.accounts || []);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api<{ organizations: { id: string }[] }>('/api/auth/me')
      .then((me) => {
        const id = me.organizations?.[0]?.id;
        setOrgId(id || null);
        if (id) load(id);
        else setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    try {
      await api(`/api/organizations/${orgId}/finance/accounts`, {
        method: 'POST',
        body: JSON.stringify({ name, type, currency: 'AOA', initialBalance }),
      });
      setShowForm(false);
      setName('');
      setInitialBalance(0);
      load(orgId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  const total = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  return (
    <ModulePage
      title="Finanças e tesouraria"
      subtitle="Contas bancárias, caixa e saldos em Kwanza (AOA)"
      actions={
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Nova conta'}
        </button>
      }
    >
      {error && <div className="error">{error}</div>}

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="stat-label">Saldo total</div>
          <div className="stat-value">{total.toLocaleString('pt-AO')} Kz</div>
        </div>
        <div className="card">
          <div className="stat-label">Contas activas</div>
          <div className="stat-value">{accounts.length}</div>
        </div>
        <div className="card">
          <div className="stat-label">Moeda</div>
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>AOA</div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={onCreate} className="grid grid-2">
            <div className="field">
              <label className="label">Nome</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Caixa principal" />
            </div>
            <div className="field">
              <label className="label">Tipo</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="cash">Caixa</option>
                <option value="bank">Banco</option>
                <option value="mobile_money">Mobile money</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Saldo inicial (Kz)</label>
              <input className="input" type="number" value={initialBalance} onChange={(e) => setInitialBalance(Number(e.target.value))} />
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary" type="submit">Guardar conta</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty">A carregar contas…</div>
        ) : accounts.length === 0 ? (
          <div className="empty">
            Ainda não há contas. Crie a primeira conta de tesouraria para começar.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Moeda</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td><span className="badge badge-slate">{a.type}</span></td>
                  <td>{a.currency}</td>
                  <td><strong>{Number(a.balance).toLocaleString('pt-AO')} Kz</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModulePage>
  );
}
