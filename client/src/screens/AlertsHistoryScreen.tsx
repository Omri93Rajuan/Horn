import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { alertService } from "../services/alertService";
import { dashboardService } from "../services/dashboardService";
import { useAppSelector } from "../store/hooks";
import { formatDate, formatEventLabel } from "../utils/dateUtils";

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
  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: alertService.getEvents,
  });

  // Fetch event status for selected event
  const statusQuery = useQuery({
    queryKey: ["event-status", selectedEventId],
    queryFn: () => dashboardService.getEventStatus(selectedEventId!),
    enabled: !!selectedEventId && isCommander,
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
          <div className="text-6xl mb-4">🚫</div>
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
            כל ההתראות במערכת + חיפוש וסטטיסטיקה
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
            <div className="text-3xl font-bold text-warning mb-1">{stats.totalAreas}</div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">גזרות פעילות</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-success mb-1">{stats.last7Days}</div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">7 ימים אחרונים</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-info mb-1">{stats.last30Days}</div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">30 ימים אחרונים</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Left - Events List with Filters */}
        <div className="space-y-4">
          {/* Search Filters */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-text dark:text-text-dark">חיפוש וסינון</h3>
            
            <select
              value={searchArea}
              onChange={(e) => setSearchArea(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark text-sm"
            >
              <option value="">כל הגזרות</option>
              {user?.commanderAreas.map(area => (
                <option key={area} value={area}>גזרה {area}</option>
              ))}
            </select>
            
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark text-sm"
              placeholder="תאריך"
            />
            
            <button
              onClick={() => {
                setSearchArea("");
                setSearchDate("");
              }}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 dark:bg-surface-2-dark hover:bg-surface-3 dark:hover:bg-surface-3-dark text-sm"
            >
              נקה סינון
            </button>
            
            <div className="pt-2 text-xs text-text-muted dark:text-text-dark-muted text-center">
              {filteredEvents.length} תוצאות
            </div>
          </div>

          {/* Events List */}
          <div className="card max-h-[600px] overflow-y-auto space-y-2">
            {eventsQuery.isLoading ? (
              <p className="text-center text-text-muted dark:text-text-dark-muted p-8">טוען...</p>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center p-8">
                <div className="text-4xl mb-2">🔍</div>
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
                      : "border-transparent hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-text dark:text-text-dark">
                      גזרה {event.areaId}
                    </span>
                    <span className="text-xs text-text-muted dark:text-text-dark-muted">
                      {formatDate(event.triggeredAt)}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted dark:text-text-dark-muted">
                    {formatEventLabel(event.triggeredAt, ACTION_LABEL)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right - Event Details */}
        <div className="card">
          {!selectedEventId ? (
            <div className="text-center p-12">
              <div className="text-6xl mb-4">📋</div>
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
                <h3 className="text-xl font-bold text-text dark:text-text-dark mb-2">
                  גזרה {selectedEvent?.areaId}
                </h3>
                <p className="text-sm text-text-muted dark:text-text-dark-muted">
                  {selectedEvent && formatEventLabel(selectedEvent.triggeredAt, ACTION_LABEL)}
                </p>
              </div>

              {/* Status Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-success/10">
                  <div className="text-2xl font-bold text-success">{statusQuery.data.summary.ok}</div>
                  <div className="text-xs text-text-muted dark:text-text-dark-muted">OK</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-danger/10">
                  <div className="text-2xl font-bold text-danger">{statusQuery.data.summary.help}</div>
                  <div className="text-xs text-text-muted dark:text-text-dark-muted">עזרה</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-warning/10">
                  <div className="text-2xl font-bold text-warning">{statusQuery.data.summary.pending}</div>
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
                    key={item.userId}
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
                        {item.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-text dark:text-text-dark">
                          {item.username}
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
                        ? "✓ בסדר"
                        : item.responseStatus === "HELP"
                        ? "⚠ עזרה"
                        : "⏳ ממתין"}
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
