import React, { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { alertService } from "../services/alertService";
import { responseService } from "../services/responseService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addEvent, setCurrentEvent, setEvents, setMyResponses } from "../store/dataSlice";
import { formatDate } from "../utils/dateUtils";

const DashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const currentEvent = useAppSelector((state) => state.data.currentEvent);
  const events = useAppSelector((state) => state.data.events);
  const responses = useAppSelector((state) => state.data.myResponses);

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

  const triggerMutation = useMutation({
    mutationFn: (areaId: string) => alertService.triggerEvent(areaId),
    onSuccess: (event) => {
      dispatch(addEvent(event));
      dispatch(setCurrentEvent(event));
      alert("האירוע הופץ בהצלחה לכל המשתמשים");
    },
    onError: (error: any) => {
      alert(
        error.response?.data?.message || "אירעה שגיאה בהקפצת האירוע",
      );
    },
  });

  const handleTrigger = () => {
    if (!user?.areaId) {
      alert("לא נמצא קוד אזור למשתמש");
      return;
    }

    const confirm = window.confirm(
      "האם אתה בטוח שברצונך להקפיץ אירוע לכל המשתמשים באזור?",
    );
    if (confirm) {
      triggerMutation.mutate(user.areaId);
    }
  };

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

  return (
    <section className="page">
      <header className="page-header hero">
        <div>
          <h2>שלום, {user?.name}</h2>
          <p>אזור: {user?.areaId}</p>
          {user?.phone ? <p>טלפון: {user.phone}</p> : null}
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={() => eventsQuery.refetch()}
            disabled={eventsQuery.isFetching}
            className="ghost"
          >
            רענן נתונים
          </button>
          <button
            type="button"
            onClick={handleTrigger}
            disabled={triggerMutation.isPending}
            className="cta"
          >
            {triggerMutation.isPending ? "מפעיל..." : "הקפץ אירוע"}
          </button>
        </div>
      </header>

      <div className="grid three">
        <div className="card stat">
          <span>סה"כ אירועים</span>
          <strong>{stats.totalEvents}</strong>
          <p>מעקב גלובלי של המערכת</p>
        </div>
        <div className="card stat">
          <span>אירועים פעילים</span>
          <strong>{stats.activeEvents}</strong>
          <p>סטטוס בזמן אמת</p>
        </div>
        <div className="card stat">
          <span>תגובות שלי</span>
          <strong>{stats.totalResponses}</strong>
          <p>תגובה אחרונה: {stats.lastEvent ? formatDate(stats.lastEvent) : "—"}</p>
        </div>
      </div>

      {currentEvent ? (
        <div className="card highlight lift">
          <div className="card-head">
            <h3>אירוע פעיל</h3>
            <span className="pill live">Live</span>
          </div>
          <p>{formatDate(currentEvent.triggeredAt)}</p>
          <Link to="/alerts" className="text-link">
            צפה בסטטוס
          </Link>
        </div>
      ) : null}

      <div className="grid two">
        <div className="card">
          <h3>ניווט מהיר</h3>
          <div className="list">
            <Link to="/alerts">אירועים והיסטוריה</Link>
            <Link to="/responses">התגובות שלי</Link>
            <Link to="/profile">פרופיל והגדרות</Link>
          </div>
        </div>
        <div className="card">
          <h3>אירועים אחרונים</h3>
          {eventsQuery.isFetching && events.length === 0 ? (
            <p>טוען אירועים...</p>
          ) : events.length === 0 ? (
            <p>אין אירועים להצגה.</p>
          ) : (
            <ul className="list">
              {events.slice(0, 5).map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => dispatch(setCurrentEvent(event))}
                  >
                    אירוע #{event.id} - {formatDate(event.triggeredAt)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardScreen;
