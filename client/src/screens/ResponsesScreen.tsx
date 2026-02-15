import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { responseService } from "../services/responseService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setMyResponses } from "../store/dataSlice";
import { formatDate, formatStatus } from "../utils/dateUtils";

const ResponsesScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const responses = useAppSelector((state) => state.data.myResponses);
  const [filter, setFilter] = useState<"ALL" | "OK" | "HELP">("ALL");
  const [search, setSearch] = useState("");

  const responsesQuery = useQuery({
    queryKey: ["responses"],
    queryFn: responseService.getMyResponses,
  });

  useEffect(() => {
    if (responsesQuery.data) {
      dispatch(setMyResponses(responsesQuery.data));
    }
  }, [dispatch, responsesQuery.data]);

  const filteredResponses = useMemo(() => {
    return responses.filter((response) => {
      const matchesFilter =
        filter === "ALL" ? true : response.status === filter;
      const matchesSearch =
        search.trim().length === 0
          ? true
          : response.notes?.toLowerCase().includes(search.toLowerCase()) ||
            response.eventId.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [responses, filter, search]);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-text dark:text-text-dark">התגובות שלי</h2>
          <p className="text-sm text-text-muted dark:text-text-dark-muted">מעקב אחר תגובות לאירועים האחרונים.</p>
        </div>
        <button
          type="button"
          onClick={() => responsesQuery.refetch()}
          disabled={responsesQuery.isFetching}
          className="action-btn ghost"
        >
          רענן
        </button>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {(["ALL", "OK", "HELP"] as const).map((status) => (
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
        <input
          className="input"
          type="text"
          placeholder="חיפוש לפי אירוע או הערה"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="card">
        {responsesQuery.isLoading ? (
          <p className="text-sm text-text-muted dark:text-text-dark-muted">טוען תגובות...</p>
        ) : filteredResponses.length === 0 ? (
          <p className="text-sm text-text-muted dark:text-text-dark-muted">אין תגובות להצגה.</p>
        ) : (
          <div className="space-y-3">
            {filteredResponses.map((response) => (
              <div
                key={response.id}
                className="flex flex-col gap-3 rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-text dark:text-text-dark">
                    אירוע #{response.eventId}
                  </p>
                  <p className="text-xs text-text-muted dark:text-text-dark-muted">{formatDate(response.respondedAt)}</p>
                  {response.notes ? (
                    <p className="text-xs text-text-muted dark:text-text-dark-muted">{response.notes}</p>
                  ) : null}
                </div>
                <span className="badge text-primary">{formatStatus(response.status)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ResponsesScreen;
