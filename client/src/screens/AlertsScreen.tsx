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
import { formatDate } from "../utils/dateUtils";

const AlertsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const events = useAppSelector((state) => state.data.events);
  const currentEvent = useAppSelector((state) => state.data.currentEvent);
  const eventStatus = useAppSelector((state) => state.data.eventStatus);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    currentEvent?.id ?? null,
  );
  const [filter, setFilter] = useState<"ALL" | "OK" | "HELP" | "PENDING">(
    "ALL",
  );
  const [notes, setNotes] = useState("");

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: alertService.getEvents,
  });

  const statusQuery = useQuery({
    queryKey: ["event-status", selectedEventId],
    queryFn: () => dashboardService.getEventStatus(selectedEventId!),
    enabled: !!selectedEventId,
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
      alert("התגובה נשלחה בהצלחה");
      setNotes("");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "שגיאה בשליחת תגובה");
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

  const handleSubmitResponse = (status: "OK" | "HELP") => {
    if (!selectedEventId) {
      alert("בחר אירוע כדי לשלוח תגובה");
      return;
    }

    respondMutation.mutate({
      eventId: selectedEventId,
      status,
      notes: notes || undefined,
    });
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>התראות ואירועים</h2>
          <p>בחר אירוע כדי לראות מי הגיב ומי עדיין ממתין.</p>
        </div>
        <button
          type="button"
          onClick={() => eventsQuery.refetch()}
          disabled={eventsQuery.isFetching}
        >
          רענן רשימה
        </button>
      </header>

      <div className="grid two">
        <div className="card">
          <h3>היסטוריית אירועים</h3>
          {eventsQuery.isLoading ? (
            <p>טוען אירועים...</p>
          ) : events.length === 0 ? (
            <p>אין אירועים להצגה.</p>
          ) : (
            <ul className="list">
              {events.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    className={`list-item ${
                      selectedEventId === event.id ? "active" : ""
                    }`}
                    onClick={() => handleSelectEvent(event.id)}
                  >
                    <span>אירוע #{event.id}</span>
                    <span>{formatDate(event.triggeredAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>סטטוס אירוע</h3>
          {!selectedEventId ? (
            <p>בחר אירוע מהרשימה כדי לראות נתונים.</p>
          ) : statusQuery.isFetching ? (
            <p>טוען סטטוס...</p>
          ) : eventStatus ? (
            <div className="status-panel">
              <div className="status-summary">
                <div>
                  <span>OK</span>
                  <strong>{eventStatus.counts.ok}</strong>
                </div>
                <div>
                  <span>HELP</span>
                  <strong>{eventStatus.counts.help}</strong>
                </div>
                <div>
                  <span>PENDING</span>
                  <strong>{eventStatus.counts.pending}</strong>
                </div>
              </div>

              <div className="filter-row">
                {(["ALL", "OK", "HELP", "PENDING"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`chip ${filter === status ? "active" : ""}`}
                    onClick={() => setFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <ul className="list">
                {filteredStatusList.map((item) => (
                  <li key={item.user.id}>
                    <div className="status-row">
                      <div>
                        <strong>{item.user.name}</strong>
                        {item.user.phone ? (
                          <span>{item.user.phone}</span>
                        ) : null}
                      </div>
                      <span
                        className={`pill ${item.responseStatus.toLowerCase()}`}
                      >
                        {item.responseStatus}
                      </span>
                    </div>
                    {item.notes ? <p>{item.notes}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>לא נמצאו נתונים לאירוע.</p>
          )}
        </div>
      </div>

      <div className="card command">
        <h3>שליחת תגובה מהירה</h3>
        <p>בחר סטטוס והוסף הערה אם צריך.</p>
        <div className="command-grid">
          <textarea
            placeholder="הערה קצרה (אופציונלי)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
          />
          <div className="command-actions">
            <button
              type="button"
              className="success"
              onClick={() => handleSubmitResponse("OK")}
              disabled={respondMutation.isPending}
            >
              אני בסדר
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => handleSubmitResponse("HELP")}
              disabled={respondMutation.isPending}
            >
              צריך עזרה
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlertsScreen;