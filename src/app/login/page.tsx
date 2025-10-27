"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // basic client validation
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
      const res = await fetch('http://localhost:4001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || 'Login failed');
      // store token
      if (body.token) {
        localStorage.setItem('tictactoe:token', body.token);
      }
      // redirect to main page (game)
      router.push('/');
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(err?.message || 'Login error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      padding: 20,
      backgroundImage: "url('https://devimages-cdn.apple.com/wwdc-services/articles/images/3D5F5DD3-14F7-4384-94C0-798D15EE7CD7/2048.jpeg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
  <div style={{ maxWidth: 460, margin: '0 auto', padding: 20, borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.6)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', color: '#fff' }}>
        <h2 style={{ marginBottom: 8 }}>Welcome back</h2>
        <p style={{ marginBottom: 16, color: '#666' }}>Sign in to continue to Tic Tac Toe</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13, color: '#7f7b7bff' }}>Email</label>
          <input aria-label="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff' }} />
          <label style={{ fontSize: 13, color: '#7f7b7bff' }}>Password</label>
          <input aria-label="password" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff' }} />

          {error && <div role="alert" style={{ color: '#b91c1c', background: '#fff1f2', padding: 8, borderRadius: 6 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="submit" disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#111827', color: '#fff' }}>{loading ? 'Signing in…' : 'Sign in'}</button>
            <a href="/register" style={{ marginLeft: 'auto', color: '#93c5fd' }}>Create account</a>
          </div>
        </form>
      </div>
    </main>
  );
}
