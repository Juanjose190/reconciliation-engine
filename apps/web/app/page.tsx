"use client";

import { AlertTriangle, CheckCircle2, FileDown, RefreshCw, Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Tenant = { id: string; name: string; ledgerName: string };
type User = { id: string; displayName: string; externalRef: string; account: string };
type Alert = {
  id: string;
  status: string;
  type: string;
  expectedAmount: string;
  actualAmount: string | null;
  deltaAmount: string;
  description: string;
  detectedAt: string;
};
type Transaction = {
  id: string;
  type: string;
  status: string;
  requestedAmount: string;
  createdAt: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function Dashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [busy, setBusy] = useState(false);

  const headers = useMemo(() => ({ "Content-Type": "application/json", "X-Tenant-Id": tenantId }), [tenantId]);

  useEffect(() => {
    void loadTenants();
  }, []);

  useEffect(() => {
    if (tenantId) {
      void refreshTenantData();
    }
  }, [tenantId]);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${apiUrl}${path}`, init);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.json() as Promise<T>;
  }

  async function loadTenants() {
    const data = await request<Tenant[]>("/tenants");
    setTenants(data);
    setTenantId((current) => current || data[0]?.id || "");
  }

  async function refreshTenantData() {
    const [nextUsers, nextAlerts, nextTransactions] = await Promise.all([
      request<User[]>("/users", { headers }),
      request<Alert[]>("/reconciliation/alerts", { headers }),
      request<Transaction[]>("/transactions", { headers })
    ]);
    setUsers(nextUsers);
    setAlerts(nextAlerts);
    setTransactions(nextTransactions);
  }

  async function runReconciliation() {
    setBusy(true);
    try {
      await request("/reconciliation/run", { method: "POST", headers });
      await refreshTenantData();
    } finally {
      setBusy(false);
    }
  }

  async function submitDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const userId = String(form.get("userId"));
    const amount = String(form.get("amount"));
    await request("/deposits", {
      method: "POST",
      headers,
      body: JSON.stringify({
        userId,
        amount,
        chain: "ethereum",
        token: "USD",
        idempotencyKey: `deposit-${crypto.randomUUID()}`
      })
    });
    event.currentTarget.reset();
    await refreshTenantData();
  }

  const openCount = alerts.filter((alert) => alert.status !== "RESOLVED").length;
  const reconciledCount = transactions.filter((tx) => tx.status === "RECONCILED").length;

  return (
    <main className="shell">
      <div className="topbar">
        <div>
          <div className="brand">Reconciliation Ops</div>
          <div className="muted">Formance Ledger multi-tenant control plane</div>
        </div>
        <div className="toolbar">
          <select value={tenantId} onChange={(event) => setTenantId(event.target.value)} aria-label="Tenant">
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
          <button className="button secondary" onClick={() => void refreshTenantData()}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="button" disabled={busy || !tenantId} onClick={() => void runReconciliation()}>
            <CheckCircle2 size={16} /> Reconcile
          </button>
        </div>
      </div>

      <div className="content">
        <div className="stack">
          <section className="section">
            <div className="metric-grid">
              <div className="metric">
                <span className="muted">Open alerts</span>
                <strong>{openCount}</strong>
              </div>
              <div className="metric">
                <span className="muted">Transactions</span>
                <strong>{transactions.length}</strong>
              </div>
              <div className="metric">
                <span className="muted">Reconciled</span>
                <strong>{reconciledCount}</strong>
              </div>
              <div className="metric">
                <span className="muted">Users</span>
                <strong>{users.length}</strong>
              </div>
            </div>
          </section>

          <section className="section">
            <header>
              <h2>Reconciliation Alerts</h2>
              <AlertTriangle size={18} />
            </header>
            {alerts.length === 0 ? (
              <div className="empty">No active discrepancies.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Delta</th>
                    <th>Detected</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>
                        <span className={`status ${alert.status.toLowerCase()}`}>{alert.status}</span>
                      </td>
                      <td>{alert.type}</td>
                      <td>${alert.deltaAmount}</td>
                      <td>{new Date(alert.detectedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="section">
            <header>
              <h2>Transactions</h2>
            </header>
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <span className={`status ${transaction.status.toLowerCase()}`}>{transaction.status}</span>
                    </td>
                    <td>{transaction.type}</td>
                    <td>${transaction.requestedAmount}</td>
                    <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <aside className="stack">
          <section className="section">
            <header>
              <h2>New Deposit</h2>
              <Send size={18} />
            </header>
            <form className="form" onSubmit={(event) => void submitDeposit(event)}>
              <select name="userId" required>
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName}
                  </option>
                ))}
              </select>
              <input name="amount" placeholder="Amount, e.g. 100.00" pattern="^[0-9]+(\\.[0-9]{1,2})?$" required />
              <button className="button" type="submit">
                <Send size={16} /> Create Deposit
              </button>
            </form>
          </section>

          <section className="section">
            <header>
              <h2>Accounts</h2>
            </header>
            <table className="table">
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.displayName}</strong>
                      <div className="muted">{user.account}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="section">
            <header>
              <h2>Reports</h2>
              <FileDown size={18} />
            </header>
            <div className="form">
              <a
                className="button secondary"
                href={`${apiUrl}/reports/reconciliation?from=2026-01-01T00:00:00.000Z&to=2026-12-31T23:59:59.000Z&format=csv`}
              >
                <FileDown size={16} /> Export CSV
              </a>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
