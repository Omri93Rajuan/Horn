import React, { useCallback, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tantml:react-query';
import { useCommanderSocket, useSoldierSocket } from '../hooks/useSocket';
import { useAppSelector } from '../store/hooks';
import { responseService } from '../services/responseService';

// Debounce mechanism for preventing excessive refetches
const DEBOUNCE_MS = 1000; // Wait 1 second after last update before refetching

const GlobalSocketManager: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const isCommander = user?.role === 'COMMANDER';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Debounce timer for refetches - allows all rapid updates to queue up
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingInvalidationsRef = useRef<Set<string>>(new Set());
  
  const [newAlertNotification, setNewAlertNotification] = useState<{
    show: boolean;
    eventId: string;
    areaId: string;
    triggeredAt: string;
  } | null>(null);

  // Initialize audio with alarm sound
  React.useEffect(() => {
    audioRef.current = new Audio('/alert-sound.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 1.0;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play alarm sound
  const playAlarmSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error('Failed to play alarm sound:', err);
      });
    }
  }, []);

  // Stop alarm sound
  const stopAlarmSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Mutation for responding to an alert
  const respondMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: 'OK' | 'HELP' }) =>
      responseService.submitResponse({ eventId, status }),
    onSuccess: () => {
      stopAlarmSound();
      setNewAlertNotification(null);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['responses'] });
      queryClient.invalidateQueries({ queryKey: ['soldier-events'] });
      queryClient.invalidateQueries({ queryKey: ['my-responses'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'שגיאה בשליחת התגובה');
    },
  });

  // Handler for soldiers - new alert received
  const handleSoldierNewAlert = useCallback(
    async (data: { eventId: string; areaId: string; triggeredAt: string }) => {
      console.log('� Global: Soldier received new alert:', data);
      
      // IMPORTANT: Only show alert if it's for this soldier's area
      if (data.areaId !== user?.areaId) {
        console.log(`⏭️ Skipping alert - not for my area (mine: ${user?.areaId}, alert: ${data.areaId})`);
        return;
      }
      
      console.log('💎 Alert is for my area - showing notification');

      // Show notification with the data we already have from the socket
      // No need to fetch - the socket already gave us the eventId
      setNewAlertNotification({
        show: true,
        eventId: data.eventId,
        areaId: data.areaId,
        triggeredAt: data.triggeredAt,
      });

      // Play alarm sound
      playAlarmSound();

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['responses'] });
      queryClient.invalidateQueries({ queryKey: ['soldier-events'] });
      queryClient.invalidateQueries({ queryKey: ['my-responses'] });
    },
    [queryClient, user?.areaId, playAlarmSound]
  );

  // Handler for commanders - new alert received
  const handleCommanderNewAlert = useCallback(
    async (data: { eventId: string; areaId: string; triggeredAt: string }): Promise<void> => {
      console.log('👑 Global: Commander received new alert:', data);
      
      // Invalidate queries to trigger automatic refetch
      console.log('🔄 Invalidating commander-active query...');
      await queryClient.invalidateQueries({ 
        queryKey: ['commander-active'],
        refetchType: 'active'
      });
      console.log('✅ Query invalidated - UI should update');
    },
    [queryClient]
  );

  // Handler for commanders - response update
  const handleResponseUpdate = useCallback(
    async (data: { eventId: string; userId: string; status: string; timestamp: string }) => {
      console.log('📨 Global: Response update received:', data);
      
      // Add to pending invalidations queue
      pendingInvalidationsRef.current.add(`event-status-${data.eventId}`);
      pendingInvalidationsRef.current.add('commander-active');
      
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set new debounce timer - will execute after all rapid updates finish
      debounceTimerRef.current = setTimeout(async () => {
        console.log('🔄 Executing debounced refetch for:', Array.from(pendingInvalidationsRef.current));
        
        // Process all pending invalidations
        for (const key of pendingInvalidationsRef.current) {
          if (key === 'commander-active') {
            await queryClient.invalidateQueries({ queryKey: ['commander-active'] });
          } else if (key.startsWith('event-status-')) {
            const eventId = key.replace('event-status-', '');
            await queryClient.invalidateQueries({ queryKey: ['event-status', eventId] });
          }
        }
        
        // Clear the queue
        pendingInvalidationsRef.current.clear();
        console.log('✅ All debounced queries invalidated');
      }, DEBOUNCE_MS);
    },
    [queryClient]
  );

  // Connect to WebSocket - must call hooks unconditionally
  useCommanderSocket(
    isCommander ? handleCommanderNewAlert : undefined,
    isCommander ? handleResponseUpdate : undefined
  );
  useSoldierSocket(
    !isCommander ? user?.areaId : undefined,
    !isCommander ? handleSoldierNewAlert : undefined
  );

  const handleQuickResponse = (status: 'OK' | 'HELP') => {
    if (newAlertNotification) {
      respondMutation.mutate({
        eventId: newAlertNotification.eventId,
        status,
      });
    }
  };

  const handleDismiss = () => {
    stopAlarmSound();
    setNewAlertNotification(null);
  };

  const handleViewAlert = () => {
    stopAlarmSound();
    setNewAlertNotification(null);
    window.location.href = '/soldier';
  };

  if (!newAlertNotification?.show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-1 dark:bg-surface-1-dark rounded-2xl shadow-2xl border-2 border-danger overflow-hidden min-w-[400px] max-w-[500px] animate-in slide-in-from-top duration-300">
        {/* Header */}
        <div className="bg-danger px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">ירוק בעיניים</h3>
              <p className="text-sm text-white/90">אירוע חדש באזור {newAlertNotification.areaId}</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-lg text-text dark:text-text-dark font-semibold mb-2">
              האם אתה בסדר?
            </p>
            <p className="text-sm text-text-muted dark:text-text-dark-muted">
              אנא דווח על מצבך מיד
            </p>
          </div>

          {/* Quick Response Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleQuickResponse('OK')}
              disabled={respondMutation.isPending}
              className="flex flex-col items-center gap-2 p-6 bg-success/10 hover:bg-success/20 border-2 border-success rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-12 h-12 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-lg font-bold text-success">בסדר</span>
              <span className="text-xs text-text-muted dark:text-text-dark-muted">אני במצב טוב</span>
            </button>

            <button
              onClick={() => handleQuickResponse('HELP')}
              disabled={respondMutation.isPending}
              className="flex flex-col items-center gap-2 p-6 bg-danger/10 hover:bg-danger/20 border-2 border-danger rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-12 h-12 text-danger" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-lg font-bold text-danger">צריך עזרה</span>
              <span className="text-xs text-text-muted dark:text-text-dark-muted">דרוש סיוע</span>
            </button>
          </div>

          {/* View Details Button */}
          <button
            onClick={handleViewAlert}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
          >
            צפה בפרטים מלאים
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalSocketManager;
