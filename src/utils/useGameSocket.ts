"use client";
import * as signalR from '@microsoft/signalr';
import { useEffect, useRef } from 'react';

type Invite = any;

export function createGameSocket({ onInvite, onInviteStatus, onPresence, onGameState, onGameStarted, onGamePleaseStart, onMove, onOnlineUsers }: {
  onInvite?: (invite: Invite) => void,
  onInviteStatus?: (data: any) => void,
  onPresence?: (data: any) => void,
  onGameState?: (state: any) => void,
  onGameStarted?: (payload: any) => void,
  onGamePleaseStart?: (payload: any) => void,
  onMove?: (payload: any) => void,
  onOnlineUsers?: (data: any) => void,
}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tictactoe:token') : null;
  
  console.log('SignalR: Creating connection with token:', !!token);
  console.log('SignalR: Token value (first 50 chars):', token ? token.substring(0, 50) + '...' : 'null');
  
  // Configure connection options based on whether we have a token
  const connectionOptions: signalR.IHttpConnectionOptions = {};
  if (token) {
    connectionOptions.accessTokenFactory = () => {
      console.log('SignalR: Access token factory called');
      return token;
    };
  }
  
  const connection = new signalR.HubConnectionBuilder()
    .withUrl('http://localhost:5281/gameHub', connectionOptions)
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

  // Set up event handlers
  if (onInvite) connection.on('invite:received', onInvite);
  if (onInviteStatus) connection.on('invite:status', onInviteStatus);
  if (onPresence) connection.on('presence:changed', onPresence);
  if (onOnlineUsers) connection.on('online:users', onOnlineUsers);
  if (onGameState) connection.on('game:state', onGameState);
  if (onGameStarted) connection.on('game:started', onGameStarted);
  if (onGamePleaseStart) {
    connection.on('game:please-start', onGamePleaseStart);
  } else if (onGameStarted) {
    connection.on('game:please-start', onGameStarted as any);
  }
  if (onMove) connection.on('move:applied', onMove);

  // Add Socket.IO compatibility methods
  const enhancedConnection = connection as any;
  enhancedConnection.connected = false;
  let isConnecting = false;

  // Start the connection with retry logic
  const startConnection = async (retryCount = 0) => {
    if (isConnecting || connection.state !== signalR.HubConnectionState.Disconnected) {
      console.log('SignalR: Connection already in progress or not disconnected');
      return;
    }

    isConnecting = true;
    console.log(`SignalR: Starting connection (attempt ${retryCount + 1})`);
    
    try {
      await connection.start();
      console.log('SignalR connected successfully');
      enhancedConnection.connected = true;
    } catch (err) {
      console.error('SignalR connection failed:', err);
      console.error('Connection state:', connection.state);
      console.error('Connection URL:', 'http://localhost:5281/gameHub');
      console.error('Token available:', !!token);
      enhancedConnection.connected = false;
      
      // Retry logic for network issues
      if (retryCount < 2 && err instanceof Error && !err.message.includes('401')) {
        console.log(`SignalR: Retrying connection in 2 seconds...`);
        setTimeout(() => startConnection(retryCount + 1), 2000);
      }
    } finally {
      isConnecting = false;
    }
  };

  // Delay connection start to avoid race conditions
  setTimeout(() => startConnection(), 100);

  // Update connection state when it changes
  connection.onreconnecting(err => {
    console.log('SignalR reconnecting...', err);
    enhancedConnection.connected = false;
  });

  connection.onreconnected(connectionId => {
    console.log('SignalR reconnected with ID:', connectionId);
    enhancedConnection.connected = true;
  });

  connection.onclose(err => {
    console.log('SignalR connection closed:', err);
    enhancedConnection.connected = false;
  });
  enhancedConnection.emit = (event: string, data: any) => {
    // Map Socket.IO events to SignalR hub methods
    switch (event) {
      case 'game:join':
        return connection.invoke('JoinGame', data.gameId, data);
      case 'game:open':
        return connection.invoke('OpenGame', data.gameId, data);
      case 'move':
        return connection.invoke('SendMove', data.gameId, data.move);
      case 'invite:send':
        return connection.invoke('SendInvite', data.toUserId, data);
      case 'invite:update-status':
        return connection.invoke('UpdateInviteStatus', data.inviteId, data.status);
      case 'getOnlineUsers':
        return connection.invoke('GetOnlineUsers');
      default:
        console.warn(`Unknown event: ${event}`);
        return Promise.resolve();
    }
  };

  return enhancedConnection;
}

export function useGameSocket(opts: any) {
  const sockRef = useRef<signalR.HubConnection | null>(null);
  useEffect(() => {
    sockRef.current = createGameSocket(opts);
    return () => {
      if (sockRef.current) {
        sockRef.current.stop().catch(err => console.error('Error stopping SignalR connection:', err));
        sockRef.current = null;
      }
    };
  }, []);
  return sockRef;
}
