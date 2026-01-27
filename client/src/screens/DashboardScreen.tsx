import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { alertService } from "../services/alertService";
import { responseService } from "../services/responseService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addEvent,
  setCurrentEvent,
  setEvents,
  setMyResponses,
} from "../store/dataSlice";
import { formatDate, formatEventLabel, isEventActive } from "../utils/dateUtils";

const ACTION_LABEL = "ירוק בעיניים לאירוע";

const DashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const currentEvent = useAppSelector((state) => state.data.currentEvent);
  const events = useAppSelector((state) => state.data.events);
  const responses = useAppSelector((state) => state.data.myResponses);
  const isCommander = user?.role === "COMMANDER";
  const availableAreas =
    user?.commanderAreas && user.commanderAreas.length > 0
      ? user.commanderAreas
      : user?.areaId
        ? [user.areaId]
        : [];
  const [selectedArea, setSelectedArea] = useState(availableAreas[0] || "");
  const [showConfirm, setShowConfirm] = useState(false);

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: alertService.getEvents,
  });

  const responsesQuery = useQuery({
    queryKey: ["responses"],
    queryFn: responseService.getMyResponses,
  });

  useEffect(() => {
    if (eventsQuery.data) {
      dispatch(setEvents(eventsQuery.data));
    }
  }, [dispatch, eventsQuery.data]);

  useEffect(() => {
    if (responsesQuery.data) {
      dispatch(setMyResponses(responsesQuery.data));
    }
  }, [dispatch, responsesQuery.data]);

  useEffect(() => {
    if (!selectedArea && availableAreas.length > 0) {
      setSelectedArea(availableAreas[0]);
    }
  }, [availableAreas, selectedArea]);

  const triggerMutation = useMutation({
    mutationFn: (areaId: string) => alertService.triggerEvent(areaId),
    onSuccess: (event) => {
      dispatch(addEvent(event));
      dispatch(setCurrentEvent(event));
      setShowConfirm(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "אירעה שגיאה בהקפצת האירוע");
    },
  });

  const stats = useMemo(() => {
    const totalEvents = events.length;
    const activeEvents = currentEvent ? 1 : 0;
    const totalResponses = responses.length;
    const lastEvent = events[0]?.triggeredAt;

    return {
      totalEvents,
      activeEvents,
      totalResponses,
      lastEvent,
    };
  }, [events, currentEvent, responses]);
  const activeWindowMinutes = 10;

  return (
    <section className="space-y-10">
      <div className="card relative overflow-hidden">
        <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-text-muted dark:text-text-dark-muted">
              מצב מרכזי
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-text dark:text-text-dark">
              שלום, {user?.name}
            </h2>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-text-muted dark:text-text-dark-muted">
              <span className="badge">אזור {user?.areaId}</span>
              {user?.phone ? <span className="badge">טלפון {user.phone}</span> : null}
              {isCommander ? <span className="badge text-secondary">קומנדור</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => eventsQuery.refetch()}
              disabled={eventsQuery.isFetching}
              className="action-btn ghost"
            >
              רענון נתונים
            </button>
            {isCommander ? (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={triggerMutation.isPending || !selectedArea}
                className="action-btn success"
              >
                {triggerMutation.isPending ? "מפעיל..." : ACTION_LABEL}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted dark:text-text-dark-muted">סה"כ אירועים</p>
          <div className="mt-4 text-3xl font-semibold text-text dark:text-text-dark">{stats.totalEvents}</div>
          <p className="mt-2 text-sm text-text-muted dark:text-text-dark-muted">כל האירועים שנוצרו במערכת</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted dark:text-text-dark-muted">אירועים פעילים</p>
          <div className="mt-4 text-3xl font-semibold text-text dark:text-text-dark">{stats.activeEvents}</div>
          <p className="mt-2 text-sm text-text-muted dark:text-text-dark-muted">סטטוס בזמן אמת</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted dark:text-text-dark-muted">תגובות שלי</p>
          <div className="mt-4 text-3xl font-semibold text-text dark:text-text-dark">{stats.totalResponses}</div>
          <p className="mt-2 text-sm text-text-muted dark:text-text-dark-muted">
            תגובה אחרונה: {stats.lastEvent ? formatDate(stats.lastEvent) : "—"}
          </p>
        </div>
      </div>

      {currentEvent ? (
        <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="badge text-primary">Live Event</span>
              <span className="text-sm text-text-muted dark:text-text-dark-muted">
                {isEventActive(currentEvent.triggeredAt, activeWindowMinutes) ? "חלון פתוח" : "חלון נסגר"}
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold text-text dark:text-text-dark">
              {formatEventLabel(currentEvent.triggeredAt, ACTION_LABEL)}
            </p>
            <p className="mt-1 text-xs text-text-muted dark:text-text-dark-muted">
              חלון אישור: {activeWindowMinutes} דקות
            </p>
          </div>
          <Link
            to="/alerts"
            className="action-btn ghost text-sm"
          >
            צפה בסטטוס
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="card">
          <h3 className="text-lg font-semibold text-text dark:text-text-dark">ניווט מהיר</h3>
          <div className="mt-4 grid gap-3 text-sm text-text-muted dark:text-text-dark-muted">
            {isCommander ? (
              <Link className="glass rounded-2xl px-4 py-3 hover:border-primary/40" to="/commander">
                דשבורד קומנדור
              </Link>
            ) : null}
            <Link className="glass rounded-2xl px-4 py-3 hover:border-primary/40" to="/alerts">
              אירועים והיסטוריה
            </Link>
            <Link className="glass rounded-2xl px-4 py-3 hover:border-primary/40" to="/responses">
              התגובות שלי
            </Link>
            <Link className="glass rounded-2xl px-4 py-3 hover:border-primary/40" to="/profile">
              פרופיל והגדרות
            </Link>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-text dark:text-text-dark">אירועים אחרונים</h3>
          <div className="mt-4 space-y-3 text-sm text-text-muted dark:text-text-dark-muted">
            {eventsQuery.isFetching && events.length === 0 ? (
              <p>טוען אירועים...</p>
            ) : events.length === 0 ? (
              <p>אין אירועים להצגה.</p>
            ) : (
              events.slice(0, 6).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 px-4 py-3 text-right transition hover:border-primary/40"
                  onClick={() => dispatch(setCurrentEvent(event))}
                >
                  <span>{formatEventLabel(event.triggeredAt, ACTION_LABEL)}</span>
                  <span className="text-xs text-text-muted dark:text-text-dark-muted">
                    #{event.id}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-[28px] border border-border dark:border-border-dark bg-surface-1/95 dark:bg-surface-1-dark/95 p-6 shadow-2xl">
            <div className="space-y-2">
              <span className="badge text-primary">{ACTION_LABEL}</span>
              <h3 className="text-2xl font-semibold text-text dark:text-text-dark">אישור הפצת אירוע</h3>
              <p className="text-sm text-text-muted dark:text-text-dark-muted">
                האירוע יופץ לכל המשתמשים בגזרה הנבחרת. פעולה זו אינה ניתנת לביטול.
              </p>
            </div>
            <div className="mt-6 space-y-4">
              <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
                בחר גזרה להפצה
                <select
                  className="input"
                  value={selectedArea}
                  onChange={(event) => setSelectedArea(event.target.value)}
                >
                  {availableAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="action-btn success"
                  onClick={() => triggerMutation.mutate(selectedArea)}
                  disabled={!selectedArea || triggerMutation.isPending}
                >
                  {triggerMutation.isPending ? "מפעיל..." : "אשר והפעל"}
                </button>
                <button
                  type="button"
                  className="action-btn ghost"
                  onClick={() => setShowConfirm(false)}
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default DashboardScreen;
