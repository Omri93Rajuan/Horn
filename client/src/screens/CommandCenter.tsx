import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { alertService } from "../services/alertService";
import { useAppSelector } from "../store/hooks";
import { formatDate, formatEventLabel } from "../utils/dateUtils";
import { useCommanderSocket } from "../hooks/useSocket";

const ACTION_LABEL = "ירוק בעיניים לאירוע";

const CommandCenter: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [filter, setFilter] = useState<"ALL" | "OK" | "HELP" | "PENDING">("ALL");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // WebSocket handlers
  const handleNewAlert = useCallback((data: { eventId: string; areaId: string; triggeredAt: string }) => {
    console.log('🔔 New alert:', data);
    queryClient.invalidateQueries({ queryKey: ["commander-active"] });
  }, [queryClient]);

  const handleResponseUpdate = useCallback((data: { eventId: string; userId: string; status: string }) => {
    console.log('📝 Response update:', data);
    queryClient.invalidateQueries({ queryKey: ["event-status", data.eventId] });
    queryClient.invalidateQueries({ queryKey: ["commander-active"] });
  }, [queryClient]);

  useCommanderSocket(handleNewAlert, handleResponseUpdate);

  // Queries
  const activeQuery = useQuery({
    queryKey: ["commander-active"],
    queryFn: dashboardService.getCommanderActive,
    enabled: user?.role === "COMMANDER",
    refetchInterval: 10000, // Refresh every 10s
  });

  const statusQuery = useQuery({
    queryKey: ["event-status", selectedEventId],
    queryFn: () => dashboardService.getEventStatus(selectedEventId!),
    enabled: !!selectedEventId && user?.role === "COMMANDER",
  });

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: (areaId: string) => alertService.triggerEvent(areaId),
    onSuccess: () => {
      setShowCreateAlert(false);
      setSelectedArea("");
      queryClient.invalidateQueries({ queryKey: ["commander-active"] });
    },
  });

  // Auto-select first event
  useEffect(() => {
    if (!selectedEventId && activeQuery.data?.areas) {
      const firstEvent = activeQuery.data.areas
        .flatMap(area => area.events)
        .filter(e => e)[0];
      if (firstEvent) {
        setSelectedEventId(firstEvent.id);
      }
    }
  }, [activeQuery.data, selectedEventId]);

  const allActiveEvents = useMemo(() => {
    return (activeQuery.data?.areas ?? [])
      .flatMap(area => area.events.map(event => ({ ...event, areaId: area.areaId })))
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  }, [activeQuery.data]);

  const criticalEvents = allActiveEvents.filter(e => e.isOverdue && !e.isComplete);
  const activeEventsCount = allActiveEvents.filter(e => !e.isComplete).length;

  const filteredSoldiers = useMemo(() => {
    if (!statusQuery.data) return [];
    if (filter === "ALL") return statusQuery.data.list;
    return statusQuery.data.list.filter(item => item.responseStatus === filter);
  }, [statusQuery.data, filter]);

  const selectedEvent = allActiveEvents.find(e => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark p-6 space-y-6">
      {/* Header - Command Center */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 border-l-4 border-primary">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text dark:text-text-dark flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                ⚡
              </span>
              מרכז פיקוד
            </h1>
            <p className="mt-2 text-text-muted dark:text-text-dark-muted">
              {user?.name} • {activeEventsCount} אירועים פעילים
              {criticalEvents.length > 0 && (
                <span className="mr-2 text-danger font-semibold animate-pulse">
                  • {criticalEvents.length} דורשים תשומת לב מיידית
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowCreateAlert(true)}
            className="px-6 py-3 bg-danger hover:bg-danger/90 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            הקפצת אירוע חדש
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/50 dark:bg-surface-1-dark/50 rounded-xl p-4 backdrop-blur">
            <div className="text-3xl font-bold text-success">{activeQuery.data?.totals.ok ?? 0}</div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">מאושרים</div>
          </div>
          <div className="bg-white/50 dark:bg-surface-1-dark/50 rounded-xl p-4 backdrop-blur">
            <div className="text-3xl font-bold text-danger">{activeQuery.data?.totals.help ?? 0}</div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">זקוקים לעזרה</div>
          </div>
          <div className="bg-white/50 dark:bg-surface-1-dark/50 rounded-xl p-4 backdrop-blur">
            <div className="text-3xl font-bold text-warning">{activeQuery.data?.totals.pending ?? 0}</div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">ממתינים</div>
          </div>
          <div className="bg-white/50 dark:bg-surface-1-dark/50 rounded-xl p-4 backdrop-blur">
            <div className="text-3xl font-bold text-primary">
              {activeQuery.data?.totals.totalUsers 
                ? Math.round((activeQuery.data.totals.responded / activeQuery.data.totals.totalUsers) * 100)
                : 0}%
            </div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">שיעור תגובה</div>
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left - Active Events List */}
        <div className="col-span-1 space-y-3">
          <h3 className="font-semibold text-text dark:text-text-dark px-2">אירועים פעילים</h3>
          
          {/* Events List */}
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">{allActiveEvents.map((event) => {
            const isSelected = event.id === selectedEventId;
            const isExpanded = event.id === expandedEventId;
            
            return (
              <div
                key={event.id}
                className={`rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary shadow-lg scale-105"
                    : event.isOverdue && !event.isComplete
                    ? "border-danger"
                    : event.isComplete
                    ? "border-success/30"
                    : "border-border dark:border-border-dark hover:border-primary/50"
                }`}
                onClick={() => setSelectedEventId(event.id)}
              >
                {/* Header */}
                <div className={`px-4 py-3 ${
                  event.isComplete
                    ? "bg-success/10"
                    : event.isOverdue
                    ? "bg-danger/10 animate-pulse"
                    : "bg-warning/10"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        event.isComplete
                          ? "bg-success text-white"
                          : event.isOverdue
                          ? "bg-danger text-white"
                          : "bg-warning text-white"
                      }`}>
                        {event.areaId.replace('area-', '')}
                      </div>
                      <div>
                        <div className="font-bold text-text dark:text-text-dark">גזרה {event.areaId}</div>
                        <div className="text-xs text-text-muted dark:text-text-dark-muted">
                          {formatEventLabel(event.triggeredAt, ACTION_LABEL)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-text dark:text-text-dark">
                      {Math.round((event.responded / event.totalUsers) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="px-4 py-3 bg-surface-1 dark:bg-surface-1-dark">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="font-bold text-success">{event.ok}</div>
                      <div className="text-text-muted dark:text-text-dark-muted">OK</div>
                    </div>
                    <div>
                      <div className="font-bold text-danger">{event.help}</div>
                      <div className="text-text-muted dark:text-text-dark-muted">עזרה</div>
                    </div>
                    <div>
                      <div className="font-bold text-warning">{event.pending}</div>
                      <div className="text-text-muted dark:text-text-dark-muted">ממתינים</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {allActiveEvents.length === 0 && (
            <div className="text-center p-12 rounded-xl bg-surface-1 dark:bg-surface-1-dark">
              <div className="text-6xl mb-4">✅</div>
              <div className="text-lg font-semibold text-text dark:text-text-dark">
                הכל רגוע
              </div>
              <div className="text-sm text-text-muted dark:text-text-dark-muted">
                אין אירועים פעילים כרגע
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Right - Detailed View */}
        <div className="col-span-2 bg-surface-1 dark:bg-surface-1-dark rounded-2xl p-6">
          {selectedEvent && statusQuery.data ? (
            <div className="space-y-6">
              {/* Event Header */}
              <div className="pb-6 border-b border-border dark:border-border-dark">
                <h2 className="text-2xl font-bold text-text dark:text-text-dark mb-2">
                  גזרה {selectedEvent.areaId} - {formatDate(selectedEvent.triggeredAt)}
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-3 py-1 rounded-full bg-success/10 text-success font-semibold">
                    ✓ {statusQuery.data.counts.ok} אישרו
                  </span>
                  <span className="px-3 py-1 rounded-full bg-danger/10 text-danger font-semibold">
                    ! {statusQuery.data.counts.help} זקוקים לעזרה
                  </span>
                  <span className="px-3 py-1 rounded-full bg-warning/10 text-warning font-semibold">
                    ⏳ {statusQuery.data.counts.pending} ממתינים
                  </span>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                {["ALL", "OK", "HELP", "PENDING"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as typeof filter)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filter === f
                        ? "bg-primary text-white"
                        : "bg-surface-2 dark:bg-surface-2-dark text-text dark:text-text-dark hover:bg-primary/10"
                    }`}
                  >
                    {f === "ALL" ? "הכל" : f === "OK" ? "בסדר" : f === "HELP" ? "עזרה" : "ממתינים"}
                  </button>
                ))}
              </div>

              {/* Soldiers List */}
              <div className="space-y-2 max-h-[calc(100vh-500px)] overflow-y-auto">
                {filteredSoldiers.map((soldier) => (
                  <div
                    key={soldier.user.id}
                    className={`p-4 rounded-lg border-2 ${
                      soldier.responseStatus === "OK"
                        ? "border-success/20 bg-success/5"
                        : soldier.responseStatus === "HELP"
                        ? "border-danger/20 bg-danger/5"
                        : "border-warning/20 bg-warning/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                          soldier.responseStatus === "OK"
                            ? "bg-success text-white"
                            : soldier.responseStatus === "HELP"
                            ? "bg-danger text-white"
                            : "bg-warning text-white"
                        }`}>
                          {soldier.responseStatus === "OK" ? "✓" : soldier.responseStatus === "HELP" ? "!" : "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-text dark:text-text-dark">{soldier.user.name}</div>
                          {soldier.respondedAt && (
                            <div className="text-xs text-text-muted dark:text-text-dark-muted">
                              {formatDate(soldier.respondedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full font-semibold ${
                        soldier.responseStatus === "OK"
                          ? "bg-success/20 text-success"
                          : soldier.responseStatus === "HELP"
                          ? "bg-danger/20 text-danger"
                          : "bg-warning/20 text-warning"
                      }`}>
                        {soldier.responseStatus === "OK" ? "בסדר" : soldier.responseStatus === "HELP" ? "צריך עזרה" : "ממתין"}
                      </div>
                    </div>
                    {soldier.notes && (
                      <div className="mt-2 text-sm text-text-muted dark:text-text-dark-muted pt-2 border-t border-border/50">
                        {soldier.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted dark:text-text-dark-muted">
              בחר אירוע מהרשימה
            </div>
          )}
        </div>
      </div>

      {/* Create Alert Modal */}
      {showCreateAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-1 dark:bg-surface-1-dark rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-text dark:text-text-dark mb-4">הקפצת אירוע חדש</h3>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark mb-4"
            >
              <option value="">בחר גזרה</option>
              {user?.commanderAreas.map(area => (
                <option key={area} value={area}>גזרה {area}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateAlert(false)}
                className="flex-1 px-4 py-3 rounded-lg bg-surface-2 dark:bg-surface-2-dark hover:bg-surface-3 dark:hover:bg-surface-3-dark"
              >
                ביטול
              </button>
              <button
                onClick={() => selectedArea && createAlertMutation.mutate(selectedArea)}
                disabled={!selectedArea || createAlertMutation.isPending}
                className="flex-1 px-4 py-3 rounded-lg bg-danger text-white font-bold hover:bg-danger/90 disabled:opacity-50"
              >
                {createAlertMutation.isPending ? "שולח..." : "הקפץ אירוע"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandCenter;
