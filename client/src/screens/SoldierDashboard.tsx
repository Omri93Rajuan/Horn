import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertService } from "../services/alertService";
import { responseService } from "../services/responseService";
import { useAppSelector } from "../store/hooks";
import { formatDate, formatEventLabel, formatAreaName } from "../utils/dateUtils";

const ACTION_LABEL = "ירוק בעיניים לאירוע";

const SoldierDashboard: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Fetch events for my area only - server already filters to active events
  const eventsQuery = useQuery({
    queryKey: ["soldier-events", user?.areaId],
    queryFn: alertService.getEvents, // Server returns only active events
    enabled: !!user?.areaId,
    staleTime: 5000, // Consider data fresh for 5 seconds
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch my responses
  const responsesQuery = useQuery({
    queryKey: ["my-responses"],
    queryFn: responseService.getMyResponses,
  });

  // Submit/Update response mutation
  const respondMutation = useMutation({
    mutationFn: ({ eventId, status, notes }: { eventId: string; status: 'OK' | 'HELP'; notes?: string }) =>
      responseService.submitResponse({ eventId, status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["soldier-events"] });
      queryClient.invalidateQueries({ queryKey: ["my-responses"] });
    },
  });

  // Get my response for selected event
  const myResponseForEvent = useMemo(() => {
    if (!selectedEventId || !responsesQuery.data) return null;
    return responsesQuery.data.find(r => r.eventId === selectedEventId);
  }, [selectedEventId, responsesQuery.data]);

  // Filter events
  const activeEvents = useMemo(() => {
    if (!eventsQuery.data) return [];
    return eventsQuery.data
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
      .slice(0, 10); // Last 10 events
  }, [eventsQuery.data]);

  const selectedEvent = activeEvents.find(e => e.id === selectedEventId);

  const handleRespond = (status: 'OK' | 'HELP', notes?: string) => {
    if (!selectedEventId) return;
    respondMutation.mutate({ eventId: selectedEventId, status, notes });
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 border-l-4 border-primary">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text dark:text-text-dark">
              הדשבורד שלי
            </h1>
            <p className="mt-2 text-text-muted dark:text-text-dark-muted">
              {user?.name} • {formatAreaName(user?.areaId || '')}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white dark:bg-surface-1-dark rounded-2xl p-5 backdrop-blur shadow-lg border border-border dark:border-border-dark">
            <div className="text-4xl font-bold text-primary mb-1">{activeEvents.length}</div>
            <div className="text-sm font-medium text-text-muted dark:text-text-dark-muted">אירועים בגזרה</div>
          </div>
          <div className="bg-white dark:bg-surface-1-dark rounded-2xl p-5 backdrop-blur shadow-lg border border-border dark:border-border-dark">
            <div className="text-4xl font-bold text-success mb-1">
              {responsesQuery.data?.filter(r => r.status === 'OK').length ?? 0}
            </div>
            <div className="text-sm font-medium text-text-muted dark:text-text-dark-muted">דיווחי בסדר</div>
          </div>
          <div className="bg-white dark:bg-surface-1-dark rounded-2xl p-5 backdrop-blur shadow-lg border border-border dark:border-border-dark">
            <div className="text-4xl font-bold text-danger mb-1">
              {responsesQuery.data?.filter(r => r.status === 'HELP').length ?? 0}
            </div>
            <div className="text-sm font-medium text-text-muted dark:text-text-dark-muted">בקשות עזרה</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left - Events List */}
        <div className="col-span-1 space-y-2">
          <h3 className="font-semibold text-text dark:text-text-dark px-2 mb-3">אירועים בגזרה שלי</h3>
          
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
            {eventsQuery.isLoading ? (
              <div className="text-center p-8 text-text-muted dark:text-text-dark-muted">טוען...</div>
            ) : activeEvents.length === 0 ? (
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
                  אין אירועים בגזרה שלך
                </div>
              </div>
            ) : (
              activeEvents.map((event) => {
                const isSelected = event.id === selectedEventId;
                const myResponse = responsesQuery.data?.find(r => r.eventId === event.id);
                
                return (
                  <div
                    key={event.id}
                    className={`rounded-2xl border overflow-hidden transition-all cursor-pointer hover:shadow-lg ${
                      isSelected
                        ? "border-primary shadow-xl ring-2 ring-primary/20"
                        : "border-border dark:border-border-dark hover:border-primary/30"
                    }`}
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <div className={`px-5 py-4 ${
                      myResponse?.status === 'OK'
                        ? "bg-success/5"
                        : myResponse?.status === 'HELP'
                        ? "bg-danger/5"
                        : "bg-warning/5"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-lg text-text dark:text-text-dark">
                            {formatEventLabel(event.triggeredAt, ACTION_LABEL)}
                          </div>
                          <div className="text-xs text-text-muted dark:text-text-dark-muted mt-1">
                            {formatDate(event.triggeredAt)}
                          </div>
                        </div>
                        {myResponse && (
                          <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            myResponse.status === 'OK'
                              ? "bg-success/20 text-success"
                              : "bg-danger/20 text-danger"
                          }`}>
                            {myResponse.status === 'OK' ? 'דיווחתי בסדר' : 'דיווחתי צורך בעזרה'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right - Response Form */}
        <div className="col-span-2 bg-surface-1 dark:bg-surface-1-dark rounded-2xl p-6">
          {selectedEvent ? (
            <div className="space-y-6">
              {/* Event Header */}
              <div className="pb-6 border-b border-border dark:border-border-dark">
                <h2 className="text-2xl font-bold text-text dark:text-text-dark mb-2">
                  {formatEventLabel(selectedEvent.triggeredAt, ACTION_LABEL)}
                </h2>
                <p className="text-text-muted dark:text-text-dark-muted">
                  {formatDate(selectedEvent.triggeredAt)} • {formatAreaName(selectedEvent.areaId)}
                </p>
              </div>

              {/* Response Status */}
              {myResponseForEvent ? (
                <div className="space-y-4">
                  <div className={`p-6 rounded-2xl border-2 ${
                    myResponseForEvent.status === 'OK'
                      ? "border-success bg-success/5"
                      : "border-danger bg-danger/5"
                  }`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${
                        myResponseForEvent.status === 'OK'
                          ? "bg-success text-white"
                          : "bg-danger text-white"
                      }`}>
                        {myResponseForEvent.status === 'OK' ? '✓' : '!'}
                      </div>
                      <div>
                        <div className="text-xl font-bold text-text dark:text-text-dark">
                          {myResponseForEvent.status === 'OK' ? 'דיווחת שהכל בסדר' : 'דיווחת שאתה צריך עזרה'}
                        </div>
                        <div className="text-sm text-text-muted dark:text-text-dark-muted">
                          {formatDate(myResponseForEvent.respondedAt)}
                        </div>
                      </div>
                    </div>
                    {myResponseForEvent.notes && (
                      <div className="mt-4 p-4 bg-white/50 dark:bg-surface-2-dark/50 rounded-lg">
                        <div className="text-sm font-semibold text-text-muted dark:text-text-dark-muted mb-1">
                          ההערה שלך:
                        </div>
                        <div className="text-text dark:text-text-dark">{myResponseForEvent.notes}</div>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-text-muted dark:text-text-dark-muted mb-3">
                      רוצה לעדכן את התגובה שלך?
                    </p>
                    <button
                      onClick={() => setSelectedEventId(selectedEvent.id)}
                      className="text-primary hover:text-primary-hover underline text-sm font-semibold"
                    >
                      לחץ כאן לשינוי תגובה
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-text dark:text-text-dark mb-2">
                      איך אתה מרגיש?
                    </h3>
                    <p className="text-text-muted dark:text-text-dark-muted">
                      דווח על מצבך כדי שהמפקדים ידעו שאתה בטוח
                    </p>
                  </div>

                  {/* Response Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleRespond('OK')}
                      disabled={respondMutation.isPending}
                      className="p-8 rounded-2xl bg-gradient-to-br from-success to-success/80 hover:from-success/90 hover:to-success/70 text-white transition-all hover:scale-105 shadow-xl disabled:opacity-50"
                    >
                      <div className="text-6xl mb-4">✓</div>
                      <div className="text-2xl font-bold">הכל בסדר</div>
                      <div className="text-sm opacity-90 mt-2">אני בטוח ולא צריך עזרה</div>
                    </button>

                    <button
                      onClick={() => handleRespond('HELP')}
                      disabled={respondMutation.isPending}
                      className="p-8 rounded-2xl bg-gradient-to-br from-danger to-danger/80 hover:from-danger/90 hover:to-danger/70 text-white transition-all hover:scale-105 shadow-xl disabled:opacity-50"
                    >
                      <div className="text-6xl mb-4">!</div>
                      <div className="text-2xl font-bold">צריך עזרה</div>
                      <div className="text-sm opacity-90 mt-2">אני זקוק לסיוע מיידי</div>
                    </button>
                  </div>

                  {/* Optional Notes */}
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-text dark:text-text-dark mb-2">
                      הערות (אופציונלי)
                    </label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-2-dark text-text dark:text-text-dark resize-none"
                      rows={3}
                      placeholder="הוסף הערות או פרטים נוספים..."
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-24 h-24 mx-auto text-text-muted dark:text-text-dark-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-text-muted dark:text-text-dark-muted">בחר אירוע מהרשימה</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoldierDashboard;
