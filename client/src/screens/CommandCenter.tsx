import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { alertService } from "../services/alertService";
import { useAppSelector } from "../store/hooks";
import { formatDate, formatEventLabel, formatAreaName } from "../utils/dateUtils";

const ACTION_LABEL = "ירוק בעיניים לאירוע";

const CommandCenter: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [filter, setFilter] = useState<"ALL" | "OK" | "HELP" | "PENDING">("ALL");


  // Queries
  const activeQuery = useQuery({
    queryKey: ["commander-active"],
    queryFn: dashboardService.getCommanderActive,
    enabled: user?.role === "COMMANDER",
    staleTime: 0, // Always fetch fresh data - socket will trigger updates
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false,
    retry: false,
  });

  const statusQuery = useQuery({
    queryKey: ["event-status", selectedEventId],
    queryFn: () => dashboardService.getEventStatus(selectedEventId!),
    enabled: !!selectedEventId && user?.role === "COMMANDER",
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
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
        .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())[0];
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
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
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
            className="px-8 py-4 bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-white rounded-2xl font-bold transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 border-2 border-success/20"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-lg">ירוק בעיניים</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white dark:bg-surface-1-dark rounded-2xl p-5 backdrop-blur shadow-lg border border-border dark:border-border-dark">
            <div className="text-4xl font-bold text-success mb-1">{activeQuery.data?.totals.ok ?? 0}</div>
            <div className="text-sm font-medium text-text-muted dark:text-text-dark-muted">מאושרים</div>
          </div>
          <div className="bg-white dark:bg-surface-1-dark rounded-2xl p-5 backdrop-blur shadow-lg border border-border dark:border-border-dark">
            <div className="text-4xl font-bold text-danger mb-1">{activeQuery.data?.totals.help ?? 0}</div>
            <div className="text-sm font-medium text-text-muted dark:text-text-dark-muted">זקוקים לעזרה</div>
          </div>
          <div className="bg-white dark:bg-surface-1-dark rounded-2xl p-5 backdrop-blur shadow-lg border border-border dark:border-border-dark">
            <div className="text-4xl font-bold text-warning mb-1">{activeQuery.data?.totals.pending ?? 0}</div>
            <div className="text-sm font-medium text-text-muted dark:text-text-dark-muted">ממתינים</div>
          </div>
          <div className="bg-white dark:bg-surface-1-dark rounded-2xl p-5 backdrop-blur shadow-lg border border-border dark:border-border-dark">
            <div className="text-4xl font-bold text-primary mb-1">
              {activeQuery.data?.totals.totalUsers 
                ? Math.round((activeQuery.data.totals.responded / activeQuery.data.totals.totalUsers) * 100)
                : 0}%
            </div>
            <div className="text-sm font-medium text-text-muted dark:text-text-dark-muted">שיעור תגובה</div>
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left - Active Events List */}
        <div className="col-span-1 space-y-2">
          <h3 className="font-semibold text-text dark:text-text-dark px-2 mb-3">אירועים פעילים</h3>
          
          {/* Events List */}
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">{allActiveEvents.map((event) => {
            const isSelected = event.id === selectedEventId;
            
            return (
              <div
                key={event.id}
                className={`rounded-2xl border overflow-hidden transition-all cursor-pointer hover:shadow-lg ${
                  isSelected
                    ? "border-primary shadow-xl ring-2 ring-primary/20"
                    : event.isOverdue && !event.isComplete
                    ? "border-danger/50 hover:border-danger"
                    : event.isComplete
                    ? "border-success/30 opacity-60"
                    : "border-border dark:border-border-dark hover:border-primary/30"
                }`}
                onClick={() => setSelectedEventId(event.id)}
              >
                {/* Header */}
                <div className={`px-5 py-4 ${
                  event.isComplete
                    ? "bg-success/5"
                    : event.isOverdue
                    ? "bg-danger/5"
                    : "bg-surface-2 dark:bg-surface-2-dark"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-md ${
                        event.isComplete
                          ? "bg-success text-white"
                          : event.isOverdue
                          ? "bg-danger text-white animate-pulse"
                          : "bg-primary text-white"
                      }`}>
                        {event.areaId.replace('area-', '')}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-text dark:text-text-dark">{formatAreaName(event.areaId)}</div>
                        <div className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">
                          {formatEventLabel(event.triggeredAt, ACTION_LABEL)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round((event.responded / event.totalUsers) * 100)}%
                      </div>
                      <div className="text-xs text-text-muted dark:text-text-dark-muted">תגובה</div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="px-5 py-3 bg-white dark:bg-surface-1-dark">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-xl font-bold text-success">{event.ok}</div>
                      <div className="text-xs text-text-muted dark:text-text-dark-muted font-medium">בסדר</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-danger">{event.help}</div>
                      <div className="text-xs text-text-muted dark:text-text-dark-muted font-medium">עזרה</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-warning">{event.pending}</div>
                      <div className="text-xs text-text-muted dark:text-text-dark-muted font-medium">ממתינים</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {allActiveEvents.length === 0 && (
            <div className="text-center p-12 rounded-xl bg-surface-1 dark:bg-surface-1-dark">
              <div className="mb-4">
                <svg className="w-24 h-24 mx-auto text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
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
                  {formatAreaName(selectedEvent.areaId)} - {formatDate(selectedEvent.triggeredAt)}
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
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      filter === f
                        ? "bg-primary text-white shadow-lg scale-105"
                        : "bg-surface-2 dark:bg-surface-2-dark text-text dark:text-text-dark hover:bg-primary/10 border border-border dark:border-border-dark"
                    }`}
                  >
                    {f === "ALL" ? "הכל" : f === "OK" ? "בסדר" : f === "HELP" ? "עזרה" : "ממתינים"}
                  </button>
                ))}
              </div>

              {/* Soldiers List */}
              <div className="space-y-3 max-h-[calc(100vh-500px)] overflow-y-auto pr-2">
                {filteredSoldiers.map((soldier) => (
                  <div
                    key={soldier.user.id}
                    className={`p-5 rounded-xl transition-all ${
                      soldier.responseStatus === "OK"
                        ? "bg-success/5 border-l-4 border-success hover:bg-success/10"
                        : soldier.responseStatus === "HELP"
                        ? "bg-danger/5 border-l-4 border-danger hover:bg-danger/10"
                        : "bg-warning/5 border-l-4 border-warning hover:bg-warning/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-md ${
                          soldier.responseStatus === "OK"
                            ? "bg-gradient-to-br from-success to-success/80 text-white"
                            : soldier.responseStatus === "HELP"
                            ? "bg-gradient-to-br from-danger to-danger/80 text-white"
                            : "bg-gradient-to-br from-warning to-warning/80 text-white"
                        }`}>
                          {soldier.responseStatus === "OK" ? "✓" : soldier.responseStatus === "HELP" ? "!" : "?"}
                        </div>
                        <div>
                          <div className="font-bold text-lg text-text dark:text-text-dark">{soldier.user.name}</div>
                          {soldier.respondedAt && (
                            <div className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">
                              {formatDate(soldier.respondedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
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
                      <div className="mt-3 text-sm text-text-muted dark:text-text-dark-muted pt-3 border-t border-border/30">
                        💬 {soldier.notes}
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
              {(user?.commanderAreas || []).map(area => (
                <option key={area} value={area}>{formatAreaName(area)}</option>
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
