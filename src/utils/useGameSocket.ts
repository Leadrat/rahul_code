"use client";
import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';

type Invite = any;

export function createGameSocket({ onInvite, onInviteStatus, onPresence, onGameState, onGameStarted, onMove }: {
  onInvite?: (invite: Invite) => void,
  onInviteStatus?: (data: any) => void,
  onPresence?: (data: any) => void,
  onGameState?: (state: any) => void,
  onGameStarted?: (payload: any) => void,
  onMove?: (payload: any) => void,
}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null;
  const socket: Socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001', {
    auth: { token },
    transports: ['websocket']
  });

  if (onInvite) socket.on('invite:received', onInvite);
  if (onInviteStatus) socket.on('invite:status', onInviteStatus);
  if (onPresence) socket.on('presence:changed', onPresence);
  if (onGameState) socket.on('game:state', onGameState);
  if (onGameStarted) socket.on('game:started', onGameStarted);
  if (onMove) socket.on('move:applied', onMove);

  return socket;
}

export function useGameSocket(opts: any) {
  const sockRef = useRef<Socket | null>(null);
  useEffect(() => {
    sockRef.current = createGameSocket(opts);
    return () => {
      try { sockRef.current?.disconnect(); } catch (e) { /* ignore */ }
      sockRef.current = null;
    };
  }, []);
  return sockRef;
}
