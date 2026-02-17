import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertService } from "../services/alertService";
import { responseService } from "../services/responseService";
import { useI18n } from "../i18n";
import { useAppSelector } from "../store/hooks";
import { formatAreaName, formatDate, formatEventLabel } from "../utils/dateUtils";

const SoldierDashboard: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const eventsQuery = useQuery({
    queryKey: ["soldier-events", user?.areaId],
    queryFn: alertService.getEvents,
    enabled: !!user?.areaId,
    staleTime: 30000,
  });

  const responsesQuery = useQuery({
    queryKey: ["my-responses"],
    queryFn: responseService.getMyResponses,
  });

  const respondMutation = useMutation({
    mutationFn: ({ eventId, status, notes }: { eventId: string; status: "OK" | "HELP"; notes?: string }) =>
      responseService.submitResponse({ eventId, status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["soldier-events"] });
      queryClient.invalidateQueries({ queryKey: ["my-responses"] });
    },
  });

  const myResponseForEvent = useMemo(() => {
    if (!selectedEventId || !responsesQuery.data) return null;
    return responsesQuery.data.find((r) => r.eventId === selectedEventId) ?? null;
  }, [responsesQuery.data, selectedEventId]);

  const activeEvents = useMemo(() => {
    if (!eventsQuery.data) return [];
    return eventsQuery.data
      .slice()
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
      .slice(0, 10);
  }, [eventsQuery.data]);

  const selectedEvent = activeEvents.find((event) => event.id === selectedEventId) ?? null;

  const handleRespond = (status: "OK" | "HELP") => {
    if (!selectedEventId) return;
    respondMutation.mutate({
      eventId: selectedEventId,
      status,
      notes: notes || undefined,
    });
    setNotes("");
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 dark:bg-background-dark">
      <div className="rounded-2xl border-l-4 border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text dark:text-text-dark">{t("sd.title")}</h1>
            <p className="mt-2 text-text-muted dark:text-text-dark-muted">
              {user?.name} • {formatAreaName(user?.areaId || "")}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-lg backdrop-blur dark:border-border-dark dark:bg-surface-1-dark">
            <div className="mb-1 text-4xl font-bold text-primary">{activeEvents.length}</div>
            <div className="text-sm font-medium text-text-muted dark:text-text-dark-muted">{t("sd.events_in_area")}</div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-lg backdrop-blur dark:border-border-dark dark:bg-surface-1-dark">
            <div className="mb-1 text-4xl font-bold text-success">
              {responsesQuery.data?.filter((r) => r.status === "OK").length ?? 0}
            </div>
            <div className="text-sm font-medium text-text-muted dark:text-text-dark-muted">{t("sd.ok_reports")}</div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-lg backdrop-blur dark:border-border-dark dark:bg-surface-1-dark">
            <div className="mb-1 text-4xl font-bold text-danger">
              {responsesQuery.data?.filter((r) => r.status === "HELP").length ?? 0}
            </div>
            <div className="text-sm font-medium text-text-muted dark:text-text-dark-muted">{t("sd.help_requests")}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="col-span-1 space-y-2">
          <h3 className="mb-3 px-2 font-semibold text-text dark:text-text-dark">{t("sd.my_area_events")}</h3>

          <div className="max-h-[calc(100vh-400px)] space-y-2 overflow-y-auto pr-1">
            {eventsQuery.isLoading ? (
              <div className="p-8 text-center text-text-muted dark:text-text-dark-muted">{t("sd.loading")}</div>
            ) : activeEvents.length === 0 ? (
              <div className="rounded-xl bg-surface-1 p-12 text-center dark:bg-surface-1-dark">
                <div className="mb-4">
                  <svg className="mx-auto h-24 w-24 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-text dark:text-text-dark">{t("sd.no_events_title")}</div>
                <div className="text-sm text-text-muted dark:text-text-dark-muted">{t("sd.no_events_subtitle")}</div>
              </div>
            ) : (
              activeEvents.map((event) => {
                const isSelected = event.id === selectedEventId;
                const myResponse = responsesQuery.data?.find((r) => r.eventId === event.id);

                return (
                  <div
                    key={event.id}
                    className={`cursor-pointer overflow-hidden rounded-2xl border transition-all hover:shadow-lg ${
                      isSelected
                        ? "border-primary shadow-xl ring-2 ring-primary/20"
                        : "border-border hover:border-primary/30 dark:border-border-dark"
                    }`}
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <div
                      className={`px-5 py-4 ${
                        myResponse?.status === "OK"
                          ? "bg-success/5"
                          : myResponse?.status === "HELP"
                            ? "bg-danger/5"
                            : "bg-warning/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold text-text dark:text-text-dark">
                            {formatEventLabel(event.triggeredAt, t("cc.alert_action"))}
                          </div>
                          <div className="mt-1 text-xs text-text-muted dark:text-text-dark-muted">
                            {formatDate(event.triggeredAt)}
                          </div>
                        </div>
                        {myResponse ? (
                          <div
                            className={`rounded-lg px-3 py-1 text-xs font-bold ${
                              myResponse.status === "OK" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                            }`}
                          >
                            {myResponse.status === "OK" ? t("sd.reported_ok") : t("sd.reported_help")}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="col-span-2 rounded-2xl bg-surface-1 p-6 dark:bg-surface-1-dark">
          {selectedEvent ? (
            <div className="space-y-6">
              <div className="border-b border-border pb-6 dark:border-border-dark">
                <h2 className="mb-2 text-2xl font-bold text-text dark:text-text-dark">
                  {formatEventLabel(selectedEvent.triggeredAt, t("cc.alert_action"))}
                </h2>
                <p className="text-text-muted dark:text-text-dark-muted">
                  {formatDate(selectedEvent.triggeredAt)} • {formatAreaName(selectedEvent.areaId)}
                </p>
              </div>

              {myResponseForEvent ? (
                <div className="space-y-4">
                  <div
                    className={`rounded-2xl border-2 p-6 ${
                      myResponseForEvent.status === "OK" ? "border-success bg-success/5" : "border-danger bg-danger/5"
                    }`}
                  >
                    <div className="mb-4 flex items-center gap-4">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-xl text-3xl ${
                          myResponseForEvent.status === "OK" ? "bg-success text-white" : "bg-danger text-white"
                        }`}
                      >
                        {myResponseForEvent.status === "OK" ? "✓" : "!"}
                      </div>
                      <div>
                        <div className="text-xl font-bold text-text dark:text-text-dark">
                          {myResponseForEvent.status === "OK" ? t("sd.report_status_ok") : t("sd.report_status_help")}
                        </div>
                        <div className="text-sm text-text-muted dark:text-text-dark-muted">
                          {formatDate(myResponseForEvent.respondedAt)}
                        </div>
                      </div>
                    </div>
                    {myResponseForEvent.notes ? (
                      <div className="mt-4 rounded-lg bg-white/50 p-4 dark:bg-surface-2-dark/50">
                        <div className="mb-1 text-sm font-semibold text-text-muted dark:text-text-dark-muted">
                          {t("sd.your_note")}
                        </div>
                        <div className="text-text dark:text-text-dark">{myResponseForEvent.notes}</div>
                      </div>
                    ) : null}
                  </div>

                  <div className="text-center">
                    <p className="mb-3 text-sm text-text-muted dark:text-text-dark-muted">{t("sd.update_response_q")}</p>
                    <button
                      onClick={() => setSelectedEventId(selectedEvent.id)}
                      className="text-sm font-semibold text-primary underline hover:text-primary-hover"
                    >
                      {t("sd.update_response_action")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-6 text-center">
                    <h3 className="mb-2 text-xl font-bold text-text dark:text-text-dark">{t("sd.how_feel")}</h3>
                    <p className="text-text-muted dark:text-text-dark-muted">{t("sd.how_feel_sub")}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleRespond("OK")}
                      disabled={respondMutation.isPending}
                      className="rounded-2xl bg-gradient-to-br from-success to-success/80 p-8 text-white shadow-xl transition-all hover:scale-105 hover:from-success/90 hover:to-success/70 disabled:opacity-50"
                    >
                      <div className="mb-4 text-6xl">✓</div>
                      <div className="text-2xl font-bold">{t("sd.i_am_ok")}</div>
                      <div className="mt-2 text-sm opacity-90">{t("sd.i_am_ok_sub")}</div>
                    </button>

                    <button
                      onClick={() => handleRespond("HELP")}
                      disabled={respondMutation.isPending}
                      className="rounded-2xl bg-gradient-to-br from-danger to-danger/80 p-8 text-white shadow-xl transition-all hover:scale-105 hover:from-danger/90 hover:to-danger/70 disabled:opacity-50"
                    >
                      <div className="mb-4 text-6xl">!</div>
                      <div className="text-2xl font-bold">{t("sd.need_help")}</div>
                      <div className="mt-2 text-sm opacity-90">{t("sd.need_help_sub")}</div>
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold text-text dark:text-text-dark">
                      {t("sd.notes_optional")}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-text dark:border-border-dark dark:bg-surface-2-dark dark:text-text-dark"
                      rows={3}
                      placeholder={t("sd.notes_placeholder")}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto mb-4 h-24 w-24 text-text-muted dark:text-text-dark-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-text-muted dark:text-text-dark-muted">{t("sd.select_event")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoldierDashboard;
