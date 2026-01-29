import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3005';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection only if it doesn't exist
    if (!socketRef.current) {
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
    }

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
  const onNewAlertRef = useRef(onNewAlert);
  const onResponseUpdateRef = useRef(onResponseUpdate);
  
  // Keep callback refs updated
  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
    onResponseUpdateRef.current = onResponseUpdate;
  }, [onNewAlert, onResponseUpdate]);

  useEffect(() => {
    if (!socket) {
      console.log('❌ Commander socket not available');
      return;
    }

    console.log('👑 Commander connecting to WebSocket...');
    console.log('🔌 Socket connected:', socket.connected);
    console.log('🆔 Socket ID:', socket.id);
    
    const alertHandler = (data: { eventId: string; areaId: string; triggeredAt: string }) => {
      console.log('🔔 RAW new-alert event received:', data);
      if (onNewAlertRef.current) {
        onNewAlertRef.current(data);
      }
    };
    
    const responseHandler = (data: { eventId: string; userId: string; status: string; timestamp: string }) => {
      console.log('📨 RAW response-update event received:', data);
      if (onResponseUpdateRef.current) {
        onResponseUpdateRef.current(data);
      }
    };
    
    // Wait for connection if not connected yet
    const setupListeners = () => {
      console.log('📡 Setting up commander listeners');
      
      // Join commanders room
      socket.emit('join-commander-room');
      console.log('✅ Emitted join-commander-room');

      // Listen for new alerts
      socket.on('new-alert', alertHandler);
      console.log('📢 Listening for new-alert events');

      // Listen for response updates
      socket.on('response-update', responseHandler);
      console.log('📝 Listening for response-update events');
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
      socket.off('new-alert', alertHandler);
      socket.off('response-update', responseHandler);
    };
  }, [socket]);

  return socket;
}

export function useSoldierSocket(
  areaId: string | undefined,
  onNewAlert?: (data: { eventId: string; areaId: string; triggeredAt: string }) => void
) {
  const socket = useSocket();
  const onNewAlertRef = useRef(onNewAlert);
  
  // Keep callback ref updated
  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    if (!socket || !areaId) {
      console.log('🎖️ Soldier socket - no socket or areaId:', { socket: !!socket, areaId });
      return;
    }

    console.log('🎖️ Soldier connecting to WebSocket for area:', areaId);
    console.log('🔌 Socket connected:', socket.connected);

    const alertHandler = (data: { eventId: string; areaId: string; triggeredAt: string }) => {
      console.log('🔔 RAW new-alert received by soldier:', data);
      if (onNewAlertRef.current) {
        onNewAlertRef.current(data);
      }
    };

    const setupListeners = () => {
      console.log('📡 Setting up soldier listeners for area:', areaId);
      
      // Join area-specific room
      socket.emit('join-area-room', areaId);
      console.log('✅ Emitted join-area-room for:', areaId);

      // Listen for new alerts in this area
      socket.on('new-alert', alertHandler);
      console.log('📢 Soldier listening for new-alert events');
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
      socket.off('new-alert', alertHandler);
      socket.emit('leave-area-room', areaId);
    };
  }, [socket, areaId]);

  return socket;
}
