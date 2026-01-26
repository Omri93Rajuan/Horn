import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { responseService } from "../services/responseService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setMyResponses } from "../store/dataSlice";
import { formatDate } from "../utils/dateUtils";

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
    <section className="page">
      <header className="page-header">
        <div>
          <h2>התגובות שלי</h2>
          <p>מעקב אחר תגובות לאירועים האחרונים.</p>
        </div>
        <button
          type="button"
          onClick={() => responsesQuery.refetch()}
          disabled={responsesQuery.isFetching}
        >
          רענן
        </button>
      </header>

      <div className="card filters">
        <div className="filter-row">
          {(["ALL", "OK", "HELP"] as const).map((status) => (
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
        <input
          type="text"
          placeholder="חיפוש לפי אירוע או הערה"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="card">
        {responsesQuery.isLoading ? (
          <p>טוען תגובות...</p>
        ) : filteredResponses.length === 0 ? (
          <p>אין תגובות להצגה.</p>
        ) : (
          <ul className="list">
            {filteredResponses.map((response) => (
              <li key={response.id} className="list-item-row">
                <div>
                  <strong>אירוע #{response.eventId}</strong>
                  <span>{formatDate(response.respondedAt)}</span>
                  {response.notes ? <p>{response.notes}</p> : null}
                </div>
                <span className={`pill ${response.status.toLowerCase()}`}>
                  {response.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ResponsesScreen;
