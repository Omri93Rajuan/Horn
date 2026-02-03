import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { alertService } from "../services/alertService";
import { dashboardService } from "../services/dashboardService";
import { useAppSelector } from "../store/hooks";
import { formatDate, formatAreaName } from "../utils/dateUtils";

const ACTION_LABEL = "ירוק בעיניים לאירוע";

const AlertsHistoryScreen: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isCommander = user?.role === "COMMANDER";
  
  // Filters
  const [searchArea, setSearchArea] = useState<string>("");
  const [searchDate, setSearchDate] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "OK" | "HELP" | "PENDING">("ALL");

  // Fetch all events (history)
  // Always fetch fresh data when screen mounts
  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: alertService.getEvents,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Fetch event status for selected event
  // Always fetch fresh data when event is selected
  const statusQuery = useQuery({
    queryKey: ["event-status", selectedEventId],
    queryFn: () => dashboardService.getEventStatus(selectedEventId!),
    enabled: !!selectedEventId && isCommander,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Calculate overall statistics
  const stats = useMemo(() => {
    if (!eventsQuery.data) return null;
    
    const events = eventsQuery.data;
    const totalEvents = events.length;
    
    // Count completed events (need to check if all users responded)
    // For now, we'll just count total events
    const totalAreas = new Set(events.map(e => e.areaId)).size;
    
    return {
      totalEvents,
      totalAreas,
      last7Days: events.filter(e => {
        const eventDate = new Date(e.triggeredAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return eventDate >= weekAgo;
      }).length,
      last30Days: events.filter(e => {
        const eventDate = new Date(e.triggeredAt);
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return eventDate >= monthAgo;
      }).length,
    };
  }, [eventsQuery.data]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!eventsQuery.data) return [];
    
    let filtered = [...eventsQuery.data];
    
    // Filter by area
    if (searchArea) {
      filtered = filtered.filter(e => e.areaId === searchArea);
    }
    
    // Filter by date
    if (searchDate) {
      const searchDateObj = new Date(searchDate);
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.triggeredAt);
        return eventDate.toDateString() === searchDateObj.toDateString();
      });
    }
    
    // Sort by most recent first
    return filtered.sort((a, b) => 
      new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  }, [eventsQuery.data, searchArea, searchDate]);

  // Filter status list
  const filteredStatusList = useMemo(() => {
    if (!statusQuery.data) return [];
    
    if (filter === "ALL") {
      return statusQuery.data.list;
    }
    
    return statusQuery.data.list.filter(item => item.responseStatus === filter);
  }, [statusQuery.data, filter]);

  const selectedEvent = filteredEvents.find(e => e.id === selectedEventId);

  if (!isCommander) {
    return (
      <section className="space-y-8">
        <div className="card text-center p-12">
          <div className="mb-4">
            <svg className="w-24 h-24 mx-auto text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text dark:text-text-dark mb-2">
            גישה מוגבלת
          </h2>
          <p className="text-text-muted dark:text-text-dark-muted">
            מסך זה זמין למפקדים בלבד
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-text dark:text-text-dark">
            היסטוריית התראות
          </h2>
          <p className="text-sm text-text-muted dark:text-text-dark-muted">
            כל ההתראות במערכת - חיפוש וניתוח
          </p>
        </div>
        <button
          type="button"
          onClick={() => eventsQuery.refetch()}
          disabled={eventsQuery.isFetching}
          className="action-btn ghost"
        >
          רענן
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary mb-1">{stats.totalEvents}</div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">סה"כ התראות</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-success mb-1">{stats.last7Days}</div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">7 ימים אחרונים</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-warning mb-1">{stats.totalAreas}</div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">גזרות</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-info mb-1">{stats.last30Days}</div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">30 ימים אחרונים</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Left - Search & List */}
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="card space-y-3">
            <select
              value={searchArea}
              onChange={(e) => setSearchArea(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark text-sm"
            >
              <option value="">כל הגזרות</option>
              {(user?.commanderAreas || []).map(area => (
                <option key={area} value={area}>{formatAreaName(area)}</option>
              ))}
            </select>
            
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark text-sm"
              placeholder="תאריך"
            />
            
            {(searchArea || searchDate) && (
              <button
                onClick={() => {
                  setSearchArea("");
                  setSearchDate("");
                }}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 dark:bg-surface-2-dark hover:bg-surface-3 dark:hover:bg-surface-3-dark text-sm"
              >
                נקה סינון
              </button>
            )}
            
            <div className="pt-2 text-xs text-text-muted dark:text-text-dark-muted text-center">
              {filteredEvents.length} אירועים
            </div>
          </div>

          {/* Events List */}
          <div className="card max-h-[600px] overflow-y-auto space-y-2">
            {eventsQuery.isLoading ? (
              <p className="text-center text-text-muted dark:text-text-dark-muted p-8">טוען...</p>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center p-8">
                <svg className="w-16 h-16 mx-auto mb-2 text-text-muted dark:text-text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-text-muted dark:text-text-dark-muted">
                  {searchArea || searchDate ? "לא נמצאו תוצאות" : "אין התראות"}
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                    selectedEventId === event.id
                      ? "border-primary bg-primary/5"
                      : event.completedAt
                      ? "border-success/30 bg-success/5 hover:bg-success/10"
                      : "border-transparent hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text dark:text-text-dark">
                        {formatAreaName(event.areaId)}
                      </span>
                      {event.completedAt && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-success/20 text-success font-semibold">
                          נסגר
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted dark:text-text-dark-muted">
                      {new Date(event.triggeredAt).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted dark:text-text-dark-muted">
                    {formatDate(event.triggeredAt)}
                  </p>
                  {event.completionReason && (
                    <p className="text-xs text-success mt-1 truncate">
                      📝 {event.completionReason}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right - Event Details */}
        <div className="card">
          {!selectedEventId ? (
            <div className="text-center p-12">
              <div className="mb-4">
                <svg className="w-24 h-24 mx-auto text-text-muted dark:text-text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text dark:text-text-dark mb-2">
                בחר אירוע
              </h3>
              <p className="text-sm text-text-muted dark:text-text-dark-muted">
                בחר אירוע מהרשימה כדי לראות פרטים
              </p>
            </div>
          ) : statusQuery.isLoading ? (
            <div className="text-center p-12">
              <p className="text-text-muted dark:text-text-dark-muted">טוען פרטים...</p>
            </div>
          ) : statusQuery.data ? (
            <div className="space-y-6">
              {/* Event Header */}
              <div className="pb-4 border-b border-border dark:border-border-dark">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-text dark:text-text-dark">
                    {formatAreaName(selectedEvent?.areaId || '')}
                  </h3>
                  {selectedEvent?.completedAt && (
                    <span className="px-3 py-1 rounded-full bg-success/20 text-success font-semibold text-sm">
                      ✓ נסגר
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted dark:text-text-dark-muted">
                  {selectedEvent && formatDate(selectedEvent.triggeredAt)}
                </p>
                {selectedEvent?.completedAt && (
                  <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-sm text-success font-semibold mb-1">
                      נסגר בתאריך: {formatDate(selectedEvent.completedAt)}
                    </p>
                    {selectedEvent.completionReason && (
                      <p className="text-sm text-text-muted dark:text-text-dark-muted">
                        סיבה: {selectedEvent.completionReason}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Status Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-success/10">
                  <div className="text-2xl font-bold text-success">{statusQuery.data?.counts?.ok ?? 0}</div>
                  <div className="text-xs text-text-muted dark:text-text-dark-muted">בסדר</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-danger/10">
                  <div className="text-2xl font-bold text-danger">{statusQuery.data?.counts?.help ?? 0}</div>
                  <div className="text-xs text-text-muted dark:text-text-dark-muted">עזרה</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-warning/10">
                  <div className="text-2xl font-bold text-warning">{statusQuery.data?.counts?.pending ?? 0}</div>
                  <div className="text-xs text-text-muted dark:text-text-dark-muted">ממתינים</div>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                {(["ALL", "OK", "HELP", "PENDING"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === f
                        ? "bg-primary text-white"
                        : "bg-surface-2 dark:bg-surface-2-dark hover:bg-primary/10"
                    }`}
                  >
                    {f === "ALL" ? "הכל" : f === "OK" ? "בסדר" : f === "HELP" ? "עזרה" : "ממתינים"}
                  </button>
                ))}
              </div>

              {/* Users List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredStatusList.map((item) => (
                  <div
                    key={item.user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-2 dark:bg-surface-2-dark"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          item.responseStatus === "OK"
                            ? "bg-success"
                            : item.responseStatus === "HELP"
                            ? "bg-danger"
                            : "bg-warning"
                        }`}
                      >
                        {item.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-text dark:text-text-dark">
                          {item.user.name}
                        </div>
                        {item.respondedAt && (
                          <div className="text-xs text-text-muted dark:text-text-dark-muted">
                            {formatDate(item.respondedAt)}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-xs text-text-muted dark:text-text-dark-muted italic">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.responseStatus === "OK"
                          ? "bg-success/20 text-success"
                          : item.responseStatus === "HELP"
                          ? "bg-danger/20 text-danger"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {item.responseStatus === "OK"
                        ? "בסדר"
                        : item.responseStatus === "HELP"
                        ? "דורש עזרה"
                        : "ממתין לתגובה"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default AlertsHistoryScreen;
