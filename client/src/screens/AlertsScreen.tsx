import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { alertService } from "../services/alertService";
import { dashboardService } from "../services/dashboardService";
import { responseService } from "../services/responseService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addResponse,
  setCurrentEvent,
  setEventStatus,
  setEvents,
} from "../store/dataSlice";
import { formatAreaName, formatEventLabel, formatStatus, isEventActive } from "../utils/dateUtils";
import { toastError } from "../utils/toast";

const ACTION_LABEL = "ירוק בעיניים לאירוע";

const AlertsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const events = useAppSelector((state) => state.data.events);
  const currentEvent = useAppSelector((state) => state.data.currentEvent);
  const eventStatus = useAppSelector((state) => state.data.eventStatus);
  const myResponses = useAppSelector((state) => state.data.myResponses);
  const isCommander = user?.role === "COMMANDER";
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    currentEvent?.id ?? null,
  );
  const [filter, setFilter] = useState<"ALL" | "OK" | "HELP" | "PENDING">(
    "ALL",
  );
  const [notes, setNotes] = useState("");
  const activeWindowMinutes = 10;

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: alertService.getEvents,
  });

  const statusQuery = useQuery({
    queryKey: ["event-status", selectedEventId],
    queryFn: () => dashboardService.getEventStatus(selectedEventId!),
    enabled: !!selectedEventId && isCommander,
  });

  const respondMutation = useMutation({
    mutationFn: responseService.submitResponse,
    onSuccess: (response) => {
      dispatch(
        addResponse({
          id: response.id,
          eventId: response.eventId,
          status: response.status,
          notes: response.notes,
          respondedAt: response.respondedAt,
        }),
      );
      // Removed alert - silent success
      setNotes("");
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || "שגיאה בשליחת תגובה");
    },
  });

  useEffect(() => {
    if (eventsQuery.data) {
      dispatch(setEvents(eventsQuery.data));
    }
  }, [dispatch, eventsQuery.data]);

  useEffect(() => {
    if (statusQuery.data) {
      dispatch(setEventStatus(statusQuery.data));
    }
  }, [dispatch, statusQuery.data]);

  useEffect(() => {
    if (currentEvent?.id) {
      setSelectedEventId(currentEvent.id);
    }
  }, [currentEvent?.id]);

  const handleSelectEvent = (eventId: string) => {
    const selected = events.find((event) => event.id === eventId);
    if (selected) {
      dispatch(setCurrentEvent(selected));
      setSelectedEventId(eventId);
    }
  };

  const filteredStatusList = useMemo(() => {
    if (!eventStatus) {
      return [];
    }
    if (filter === "ALL") {
      return eventStatus.list;
    }
    return eventStatus.list.filter(
      (item) => item.responseStatus === filter,
    );
  }, [eventStatus, filter]);

  const myResponseForEvent = useMemo(() => {
    if (!selectedEventId) {
      return null;
    }
    return myResponses.find((response) => response.eventId === selectedEventId) || null;
  }, [myResponses, selectedEventId]);

  const handleSubmitResponse = (status: "OK" | "HELP") => {
    if (!selectedEventId) {
      toastError("בחר אירוע כדי לשלוח תגובה");
      return;
    }
    const selectedEvent = events.find((event) => event.id === selectedEventId);
    if (selectedEvent && !isEventActive(selectedEvent.triggeredAt, activeWindowMinutes)) {
      toastError("חלון הזמן לאישור האירוע נסגר");
      return;
    }

    respondMutation.mutate({
      eventId: selectedEventId,
      status,
      notes: notes || undefined,
    });
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-text dark:text-text-dark">התראות ואירועים</h2>
          <p className="text-sm text-text-muted dark:text-text-dark-muted">בחר אירוע כדי לראות מי הגיב ומי ממתין.</p>
        </div>
        <button
          type="button"
          onClick={() => eventsQuery.refetch()}
          disabled={eventsQuery.isFetching}
          className="action-btn ghost"
        >
          רענן רשימה
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="card">
          <h3 className="text-lg font-semibold text-text dark:text-text-dark">היסטוריית אירועים</h3>
          <div className="mt-4 space-y-3 text-sm text-text-muted dark:text-text-dark-muted">
            {eventsQuery.isLoading ? (
              <p>טוען אירועים...</p>
            ) : events.length === 0 ? (
              <p>אין אירועים להצגה.</p>
            ) : (
              events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-right transition ${
                    selectedEventId === event.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 hover:border-primary/40"
                  }`}
                  onClick={() => handleSelectEvent(event.id)}
                >
                  <div className="space-y-1 text-right">
                    <span className="text-sm font-semibold text-text dark:text-text-dark">
                      {formatEventLabel(event.triggeredAt, ACTION_LABEL)}
                    </span>
                    <span className="text-xs text-text-muted dark:text-text-dark-muted">
                      גזרה {formatAreaName(event.areaId)}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted dark:text-text-dark-muted">
                    #{event.id}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-text dark:text-text-dark">
            {isCommander ? "סטטוס אירוע" : "התגובה שלי"}
          </h3>
          {!selectedEventId ? (
            <p className="mt-4 text-sm text-text-muted dark:text-text-dark-muted">בחר אירוע מהרשימה כדי לראות נתונים.</p>
          ) : isCommander ? (
            statusQuery.isFetching ? (
              <p className="mt-4 text-sm text-text-muted dark:text-text-dark-muted">טוען סטטוס...</p>
            ) : eventStatus ? (
              <div className="mt-4 space-y-6">
                <div className="rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 p-4">
                  <p className="text-sm font-semibold text-text dark:text-text-dark">
                    {formatEventLabel(eventStatus.event.triggeredAt, ACTION_LABEL)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted dark:text-text-dark-muted">
                    גזרה {formatAreaName(eventStatus.event.areaId)} • #{eventStatus.event.id}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {([
                    { label: "OK", value: eventStatus.counts.ok },
                    { label: "HELP", value: eventStatus.counts.help },
                    { label: "PENDING", value: eventStatus.counts.pending },
                  ] as const).map((item) => (
                    <div key={item.label} className="glass rounded-2xl p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted dark:text-text-dark-muted">
                        {formatStatus(item.label)}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-text dark:text-text-dark">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["ALL", "OK", "HELP", "PENDING"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        filter === status
                          ? "bg-primary/10 text-primary"
                          : "border border-border dark:border-border-dark text-text-muted dark:text-text-dark-muted hover:border-primary/40"
                      }`}
                      onClick={() => setFilter(status)}
                    >
                      {formatStatus(status)}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {filteredStatusList.map((item) => (
                    <div key={item.user.id} className="rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-text dark:text-text-dark">{item.user.name}</p>
                          {item.user.phone ? (
                            <p className="text-xs text-text-muted dark:text-text-dark-muted">{item.user.phone}</p>
                          ) : null}
                        </div>
                        <span className="badge text-primary">{formatStatus(item.responseStatus)}</span>
                      </div>
                      {item.notes ? (
                        <p className="mt-3 text-xs text-text-muted dark:text-text-dark-muted">{item.notes}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-text-muted dark:text-text-dark-muted">לא נמצאו נתונים לאירוע.</p>
            )
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 p-4">
                <p className="text-sm font-semibold text-text dark:text-text-dark">
                  {currentEvent ? formatEventLabel(currentEvent.triggeredAt, ACTION_LABEL) : "אירוע נבחר"}
                </p>
                <p className="mt-1 text-xs text-text-muted dark:text-text-dark-muted">
                  מזהה אירוע: #{selectedEventId}
                </p>
              </div>
              {myResponseForEvent ? (
                <div className="rounded-2xl border border-border dark:border-border-dark bg-surface-2/90 dark:bg-surface-2-dark/90 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text dark:text-text-dark">התגובה שלך</p>
                    <span
                      className={`badge ${
                        myResponseForEvent.status === "OK"
                          ? "text-success bg-success/10"
                          : myResponseForEvent.status === "HELP"
                            ? "text-danger bg-danger/10"
                            : "text-text"
                      }`}
                    >
                      {formatStatus(myResponseForEvent.status)}
                    </span>
                  </div>
                  {myResponseForEvent.notes ? (
                    <p className="mt-2 text-xs text-text-muted dark:text-text-dark-muted">
                      {myResponseForEvent.notes}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-text-muted dark:text-text-dark-muted">
                  עדיין לא שלחת תגובה לאירוע הזה.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-text dark:text-text-dark">שליחת תגובה מהירה</h3>
        <p className="mt-2 text-sm text-text-muted dark:text-text-dark-muted">בחר סטטוס והוסף הערה אם צריך.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <textarea
            className="input min-h-[120px]"
            placeholder="הערה קצרה (אופציונלי)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="action-btn primary"
              onClick={() => handleSubmitResponse("OK")}
              disabled={respondMutation.isPending}
            >
              אני בסדר
            </button>
            <button
              type="button"
              className="action-btn danger"
              onClick={() => handleSubmitResponse("HELP")}
              disabled={respondMutation.isPending}
            >
              צריך עזרה
            </button>
            {selectedEventId ? (
              (() => {
                const selectedEvent = events.find((event) => event.id === selectedEventId);
                if (!selectedEvent) {
                  return null;
                }
                const active = isEventActive(selectedEvent.triggeredAt, activeWindowMinutes);
                return (
                  <p className="text-xs text-text-muted dark:text-text-dark-muted">
                    חלון אישור: {activeWindowMinutes} דקות • מצב: {active ? "פתוח" : "נסגר"}
                  </p>
                );
              })()
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlertsScreen;






