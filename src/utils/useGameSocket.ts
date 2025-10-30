"use client";
import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';

type Invite = any;

export function createGameSocket({ onInvite, onInviteStatus, onPresence, onGameState, onGameStarted, onGamePleaseStart, onMove }: {
  onInvite?: (invite: Invite) => void,
  onInviteStatus?: (data: any) => void,
  onPresence?: (data: any) => void,
  onGameState?: (state: any) => void,
  onGameStarted?: (payload: any) => void,
  onGamePleaseStart?: (payload: any) => void,
  onMove?: (payload: any) => void,
}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null;
  const socket: Socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket']
  });

  if (onInvite) socket.on('invite:received', onInvite);
  if (onInviteStatus) socket.on('invite:status', onInviteStatus);
  if (onPresence) socket.on('presence:changed', onPresence);
  if (onGameState) socket.on('game:state', onGameState);
  if (onGameStarted) socket.on('game:started', onGameStarted);
  // allow handlers to respond to a "please start" request from another client
  // If a dedicated onGamePleaseStart handler isn't provided, fall back to
  // the onGameStarted handler so the same UI popup/flow is used.
  if (onGamePleaseStart) {
    socket.on('game:please-start', onGamePleaseStart);
  } else if (onGameStarted) {
    socket.on('game:please-start', onGameStarted as any);
  }
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
