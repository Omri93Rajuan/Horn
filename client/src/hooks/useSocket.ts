import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef.current;
}

export function useCommanderSocket(
  onNewAlert?: (data: { eventId: string; areaId: string; triggeredAt: string }) => void,
  onResponseUpdate?: (data: { eventId: string; userId: string; status: string; timestamp: string }) => void
) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) {
      console.log('❌ Commander socket not available');
      return;
    }

    console.log('👑 Commander connecting to WebSocket...');
    console.log('🔌 Socket connected:', socket.connected);
    console.log('🆔 Socket ID:', socket.id);
    
    // Wait for connection if not connected yet
    const setupListeners = () => {
      console.log('📡 Setting up commander listeners');
      
      // Join commanders room
      socket.emit('join-commander-room');
      console.log('✅ Emitted join-commander-room');

      // Listen for new alerts
      if (onNewAlert) {
        socket.on('new-alert', (data) => {
          console.log('🔔 RAW new-alert event received:', data);
          onNewAlert(data);
        });
        console.log('📢 Listening for new-alert events');
      }

      // Listen for response updates
      if (onResponseUpdate) {
        socket.on('response-update', (data) => {
          console.log('📨 RAW response-update event received:', data);
          onResponseUpdate(data);
        });
        console.log('📝 Listening for response-update events');
      }
    };

    if (socket.connected) {
      setupListeners();
    } else {
      console.log('⏳ Socket not connected yet, waiting...');
      socket.once('connect', () => {
        console.log('✅ Socket connected, setting up listeners');
        setupListeners();
      });
    }

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up commander socket listeners');
      if (onNewAlert) {
        socket.off('new-alert');
      }
      if (onResponseUpdate) {
        socket.off('response-update');
      }
    };
  }, [socket, onNewAlert, onResponseUpdate]);

  return socket;
}

export function useSoldierSocket(
  areaId: string | undefined,
  onNewAlert?: (data: { eventId: string; areaId: string; triggeredAt: string }) => void
) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !areaId) {
      console.log('🎖️ Soldier socket - no socket or areaId:', { socket: !!socket, areaId });
      return;
    }

    console.log('🎖️ Soldier connecting to WebSocket for area:', areaId);
    console.log('🔌 Socket connected:', socket.connected);

    const setupListeners = () => {
      console.log('📡 Setting up soldier listeners for area:', areaId);
      
      // Join area-specific room
      socket.emit('join-area-room', areaId);
      console.log('✅ Emitted join-area-room for:', areaId);

      // Listen for new alerts in this area
      if (onNewAlert) {
        socket.on('new-alert', (data) => {
          console.log('🔔 RAW new-alert received by soldier:', data);
          onNewAlert(data);
        });
        console.log('📢 Soldier listening for new-alert events');
      }
    };

    if (socket.connected) {
      setupListeners();
    } else {
      console.log('⏳ Socket not connected yet, waiting...');
      socket.once('connect', () => {
        console.log('✅ Socket connected, setting up soldier listeners');
        setupListeners();
      });
    }

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up soldier listeners for area:', areaId);
      if (onNewAlert) {
        socket.off('new-alert');
      }
      socket.emit('leave-area-room', areaId);
    };
  }, [socket, areaId, onNewAlert]);

  return socket;
}
