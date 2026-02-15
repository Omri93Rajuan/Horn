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
import { formatEventLabel, formatAreaName, formatStatus, isEventActive } from "../utils/dateUtils";
import { toastError } from "../utils/toast";

const ACTION_LABEL = "???? ??????? ??????";

const DashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
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
      toastError(error.response?.data?.message || "????? ????? ?????? ??????");
    },
  });

  const activeWindowMinutes = 10;

  const stats = useMemo(() => {
    const totalEvents = events.length;
    const activeEvents = events.filter(event => 
      isEventActive(event.triggeredAt, activeWindowMinutes)
    );
    const totalResponses = responses.length;
    const lastEvent = events[0]?.triggeredAt;

    return {
      totalEvents,
      activeEvents: activeEvents.length,
      activeEventsList: activeEvents,
      totalResponses,
      lastEvent,
    };
  }, [events, responses, activeWindowMinutes]);

  return (
    <section className="space-y-10">
      <div className="card relative overflow-hidden">
        <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
        <div className="relative">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-text-muted dark:text-text-dark-muted">
                ???? ???? ????
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-text dark:text-text-dark">
                {user?.name}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {formatAreaName(user?.areaId || "")}
                </span>
                {isCommander && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" />
                    </svg>
                    ????
                  </span>
                )}
              </div>
            </div>
            {isCommander && (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={triggerMutation.isPending || !selectedArea}
                className="action-btn danger"
              >
                {triggerMutation.isPending ? "?????..." : ACTION_LABEL}
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-2/50 p-4 dark:border-border-dark dark:bg-surface-2-dark/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-muted dark:text-text-dark-muted">???????</p>
                  <p className="mt-1 text-2xl font-bold text-text dark:text-text-dark">{stats.totalEvents}</p>
                </div>
                <div className="rounded-lg bg-info/10 p-2">
                  <svg className="h-5 w-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-2/50 p-4 dark:border-border-dark dark:bg-surface-2-dark/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-muted dark:text-text-dark-muted">??????</p>
                  <p className="mt-1 text-2xl font-bold text-success">{stats.activeEvents}</p>
                </div>
                <div className="rounded-lg bg-success/10 p-2">
                  <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-2/50 p-4 dark:border-border-dark dark:bg-surface-2-dark/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-muted dark:text-text-dark-muted">????????</p>
                  <p className="mt-1 text-2xl font-bold text-primary">{stats.totalResponses}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/alerts"
          className="group card hover:border-info dark:hover:border-info transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-info/10 p-3 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-text dark:text-text-dark">??????</p>
              <p className="text-xs text-text-muted dark:text-text-dark-muted">????????? ???????</p>
            </div>
          </div>
        </Link>

        <Link
          to="/responses"
          className="group card hover:border-success dark:hover:border-success transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-success/10 p-3 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-text dark:text-text-dark">??????</p>
              <p className="text-xs text-text-muted dark:text-text-dark-muted">???????? ???</p>
            </div>
          </div>
        </Link>

        <Link
          to="/profile"
          className="group card hover:border-secondary dark:hover:border-secondary transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-secondary/10 p-3 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-text dark:text-text-dark">??????</p>
              <p className="text-xs text-text-muted dark:text-text-dark-muted">?????? ??????</p>
            </div>
          </div>
        </Link>

        {isCommander && (
          <Link
            to="/commander"
            className="group card hover:border-primary dark:hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/10 p-3 transition-transform group-hover:scale-110">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-text dark:text-text-dark">???? ?????</p>
                <p className="text-xs text-text-muted dark:text-text-dark-muted">????? ????</p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {stats.activeEventsList.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text dark:text-text-dark">
            ??????? ?????? ({stats.activeEventsList.length})
          </h3>
          {stats.activeEventsList.map((event) => {
            const myResponse = responses.find(r => r.eventId === event.id);
            return (
              <div key={event.id} className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-2 border-danger/30 dark:border-danger/30">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger animate-pulse">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="10" />
                      </svg>
                      ????? ????
                    </span>
                    <span className="text-sm text-text-muted dark:text-text-dark-muted">
                      {isEventActive(event.triggeredAt, activeWindowMinutes) ? "???? ????" : "???? ????"}
                    </span>
                    {myResponse && (
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                        myResponse.status === 'OK' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      }`}>
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        ??????: {formatStatus(myResponse.status)}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-lg font-semibold text-text dark:text-text-dark">
                    {formatEventLabel(event.triggeredAt, ACTION_LABEL)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted dark:text-text-dark-muted">
                    {formatAreaName(event.areaId)} � ???? ?????: {activeWindowMinutes} ????
                  </p>
                </div>
                <div className="flex gap-2">
                  {!myResponse && isEventActive(event.triggeredAt, activeWindowMinutes) && (
                    <Link
                      to="/alerts"
                      onClick={() => dispatch(setCurrentEvent(event))}
                      className="action-btn success text-sm"
                    >
                      ???? ?????
                    </Link>
                  )}
                  <Link
                    to="/alerts"
                    onClick={() => dispatch(setCurrentEvent(event))}
                    className="action-btn ghost text-sm"
                  >
                    {isCommander ? '??? ??????' : '?????'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="card">
          <h3 className="text-lg font-semibold text-text dark:text-text-dark">????? ????</h3>
          <div className="mt-4 grid gap-3 text-sm text-text-muted dark:text-text-dark-muted">
            {isCommander ? (
              <Link className="glass rounded-2xl px-4 py-3 hover:border-primary/40" to="/commander">
                ?????? ???????
              </Link>
            ) : null}
            <Link className="glass rounded-2xl px-4 py-3 hover:border-primary/40" to="/alerts">
              ??????? ?????????
            </Link>
            <Link className="glass rounded-2xl px-4 py-3 hover:border-primary/40" to="/responses">
              ??????? ???
            </Link>
            <Link className="glass rounded-2xl px-4 py-3 hover:border-primary/40" to="/profile">
              ?????? ???????
            </Link>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-text dark:text-text-dark">??????? ???????</h3>
          <div className="mt-4 space-y-3 text-sm text-text-muted dark:text-text-dark-muted">
            {eventsQuery.isFetching && events.length === 0 ? (
              <p>???? ???????...</p>
            ) : events.length === 0 ? (
              <p>??? ??????? ?????.</p>
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
              <h3 className="text-2xl font-semibold text-text dark:text-text-dark">????? ???? ?????</h3>
              <p className="text-sm text-text-muted dark:text-text-dark-muted">
                ?????? ???? ??? ???????? ????? ??????. ????? ?? ???? ????? ??????.
              </p>
            </div>
            <div className="mt-6 space-y-4">
              <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
                ??? ???? ?????
                <select
                  className="input"
                  value={selectedArea}
                  onChange={(event) => setSelectedArea(event.target.value)}
                >
                  {availableAreas.map((area) => (
                    <option key={area} value={area}>
                      {formatAreaName(area)}
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
                  {triggerMutation.isPending ? "?????..." : "??? ?????"}
                </button>
                <button
                  type="button"
                  className="action-btn ghost"
                  onClick={() => setShowConfirm(false)}
                >
                  ?????
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
