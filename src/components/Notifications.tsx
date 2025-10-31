"use client";
import React, { useState } from 'react';

type Invite = {
  id: number | string;
  from_user_id?: number | string;
  to_email?: string;
  game_id?: number | string | null;
  message?: string;
  from_user_email?: string;
  senderOnline?: boolean;
  receiverOnline?: boolean;
};

export default function Notifications({
  invites = [],
  onAccept,
  onDecline,
  onSendInvite,
}: {
  invites?: Invite[];
  onAccept?: (inv: Invite) => void;
  onDecline?: (inv: Invite) => void;
  onSendInvite?: (payload: { toEmail: string; message?: string }) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function sendInvite(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!toEmail) return alert('Enter email');
    setSending(true);
    try {
      await onSendInvite?.({ toEmail, message });
      setToEmail('');
      setMessage('');
      setShowInviteForm(false);
      setOpen(true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('sendInvite failed', err);
      alert('Invite failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        aria-label="Notifications"
        onClick={() => setOpen((s) => !s)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6 }}
      >
        🔔
        {invites && invites.length > 0 && (
          <span style={{ marginLeft: 6, fontSize: 12, background: 'red', color: '#fff', padding: '2px 6px', borderRadius: 12 }}>{invites.length}</span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 36, width: 320, background: 'var(--card-bg, #0b0b0b)', border: '1px solid rgba(255,255,255,0.04)', padding: 12, borderRadius: 8, zIndex: 60 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>Notifications</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowInviteForm((s) => !s)} style={{ padding: '4px 8px' }}>Invite</button>
              <button onClick={() => setOpen(false)} style={{ padding: '4px 8px' }}>Close</button>
            </div>
          </div>

          {showInviteForm && (
            <form onSubmit={sendInvite} style={{ marginBottom: 8 }}>
              <input placeholder="Email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 6, borderRadius: 6 }} />
              <input placeholder="Message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 6, borderRadius: 6 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={sending} style={{ padding: '6px 10px' }}>{sending ? 'Sending...' : 'Send'}</button>
                <button type="button" onClick={() => setShowInviteForm(false)} style={{ padding: '6px 10px' }}>Cancel</button>
              </div>
            </form>
          )}

          <div style={{ maxHeight: 280, overflow: 'auto' }}>
            {invites.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>No notifications</div>}
            {invites.map((inv) => {
              const senderOnline = !!inv.senderOnline;
              const receiverOnline = !!inv.receiverOnline;
              const canAccept = senderOnline && receiverOnline; // require both online to enable accept
              return (
                <div key={String(inv.id)} style={{ padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.02)', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13 }}>
                      <strong>Invite from:</strong> {inv.from_user_email || (inv.from_user_id ? `User ${inv.from_user_id}` : 'Unknown')}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: senderOnline ? '#0f0' : '#f33' }}>Sender: {senderOnline ? 'online' : 'offline'}</div>
                      <div style={{ fontSize: 12, color: receiverOnline ? '#0f0' : '#f33' }}>You: {receiverOnline ? 'online' : 'offline'}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    <strong>Sent to:</strong> {inv.to_email}
                  </div>
                  {inv.message && <div style={{ marginTop: 6, fontSize: 13 }}>{inv.message}</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => onAccept?.(inv)} style={{ padding: '6px 8px' }} disabled={!canAccept} title={!canAccept ? 'Both players must be online to accept and start' : 'Accept invite'}>Accept</button>
                    <button onClick={() => onDecline?.(inv)} style={{ padding: '6px 8px' }}>Decline</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
