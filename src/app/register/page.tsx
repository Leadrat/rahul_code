"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || 'Register failed');
      // show a small success message and redirect
      alert('Registered — you can now login');
      router.push('/login');
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(err?.message || 'Register error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <div style={{ maxWidth: 460, margin: '0 auto', padding: 20, border: '1px solid #eee', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
        <h2 style={{ marginBottom: 8 }}>Create an account</h2>
        <p style={{ marginBottom: 16, color: '#666' }}>Register to save your games and access them from any device.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13, color: '#333' }}>Email</label>
          <input aria-label="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />
          <label style={{ fontSize: 13, color: '#333' }}>Password</label>
          <input aria-label="password" placeholder="password (min 4 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />

          {error && <div role="alert" style={{ color: '#b91c1c', background: '#fff1f2', padding: 8, borderRadius: 6 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="submit" disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#0b8', color: '#fff' }}>{loading ? 'Creating…' : 'Create account'}</button>
            <a href="/login" style={{ marginLeft: 'auto', color: '#2563eb' }}>Already have an account?</a>
          </div>
        </form>
      </div>
    </main>
  );
}
