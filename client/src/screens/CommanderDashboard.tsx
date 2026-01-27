import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { useAppSelector } from "../store/hooks";
import { formatDate, formatEventLabel } from "../utils/dateUtils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
} from "recharts";

const ACTION_LABEL = "ירוק בעיניים לאירוע";

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
  pink: "#ec4899",
  teal: "#14b8a6",
};

const CommanderDashboard: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "OK" | "HELP" | "PENDING">("ALL");

  const overviewQuery = useQuery({
    queryKey: ["commander-overview"],
    queryFn: dashboardService.getCommanderOverview,
    enabled: user?.role === "COMMANDER",
  });

  const activeQuery = useQuery({
    queryKey: ["commander-active"],
    queryFn: dashboardService.getCommanderActive,
    enabled: user?.role === "COMMANDER",
    refetchInterval: 10_000,
  });

  const statusQuery = useQuery({
    queryKey: ["event-status", selectedEventId],
    queryFn: async () => {
      console.log('🔍 Fetching event status for:', selectedEventId);
      const result = await dashboardService.getEventStatus(selectedEventId!);
      console.log('📦 Received event status:', result);
      return result;
    },
    enabled: !!selectedEventId && user?.role === "COMMANDER",
  });

  // Query for all soldiers under commander
  const allSoldiersQuery = useQuery({
    queryKey: ["all-soldiers", user?.id],
    queryFn: async () => {
      // Get all soldiers from active areas
      const areas = activeQuery.data?.areas ?? [];
      const allSoldiers: any[] = [];
      
      for (const area of areas) {
        if (area.event) {
          const eventData = await dashboardService.getEventStatus(area.event.id);
          allSoldiers.push(...eventData.list.map((item: any) => ({
            ...item,
            eventId: area.event!.id,
            areaId: area.areaId,
          })));
        }
      }
      
      return allSoldiers;
    },
    enabled: user?.role === "COMMANDER" && !selectedEventId && (activeQuery.data?.areas ?? []).length > 0,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (user?.role !== "COMMANDER") {
      alert("גישה למפקדים בלבד");
    }
  }, [user?.role]);

  useEffect(() => {
    if (selectedEventId) {
      return;
    }
    const activeWithEvent = activeQuery.data?.areas.find((area) => area.event);
    if (activeWithEvent?.event) {
      setSelectedEventId(activeWithEvent.event.id);
    }
  }, [activeQuery.data, selectedEventId]);

  const filteredStatusList = useMemo(() => {
    if (!statusQuery.data) {
      return [];
    }
    
    console.log('📊 Status Query Data:', statusQuery.data);
    console.log('📋 Full list:', statusQuery.data.list);
    console.log('🔢 Counts:', statusQuery.data.counts);
    
    if (filter === "ALL") {
      return statusQuery.data.list;
    }
    return statusQuery.data.list.filter((item) => item.responseStatus === filter);
  }, [filter, statusQuery.data]);

  const totalUsers = activeQuery.data?.totals.totalUsers ?? 0;
  const responded = activeQuery.data?.totals.responded ?? 0;
  const pending = activeQuery.data?.totals.pending ?? 0;
  const responseRate = totalUsers ? Math.round((responded / totalUsers) * 100) : 0;
  const activeAreas = activeQuery.data?.totals.activeAreas ?? 0;
  const okCount = (activeQuery.data?.areas ?? []).reduce((sum, area) => sum + (area.okCount ?? 0), 0);
  const helpCount = (activeQuery.data?.areas ?? []).reduce((sum, area) => sum + (area.helpCount ?? 0), 0);

  const chartPoints = useMemo(() => {
    const areas = overviewQuery.data?.areas ?? [];
    if (areas.length === 0) {
      return "0,40 20,35 40,32 60,30 80,28 100,26";
    }
    const values = areas.map((area) => area.last30Days);
    const max = Math.max(...values, 1);
    return values
      .map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * 100;
        const y = 40 - (value / max) * 30;
        return `${x},${y}`;
      })
      .join(" ");
  }, [overviewQuery.data]);

  // Data for charts
  const areaChartData = useMemo(() => {
    return (overviewQuery.data?.areas ?? []).map((area, idx) => ({
      name: `גזרה ${area.areaId}`,
      אירועים: area.last30Days,
      ממוצע: Math.round((overviewQuery.data?.areas.reduce((sum, a) => sum + a.last30Days, 0) ?? 0) / (overviewQuery.data?.areas.length ?? 1)),
    }));
  }, [overviewQuery.data]);

  const pieChartData = useMemo(() => {
    return (activeQuery.data?.areas ?? []).map((area) => ({
      name: `גזרה ${area.areaId}`,
      value: area.totalUsers,
      responded: area.responded,
    }));
  }, [activeQuery.data]);

  const scatterData = useMemo(() => {
    return (activeQuery.data?.areas ?? []).map((area) => ({
      x: area.totalUsers,
      y: area.responded,
      z: Math.round((area.responded / area.totalUsers) * 100),
      name: `גזרה ${area.areaId}`,
    }));
  }, [activeQuery.data]);

  const responseDistribution = useMemo(() => {
    if (!statusQuery.data) return [];
    return [
      { name: "מוכנים", value: statusQuery.data.counts.ok, color: COLORS.success },
      { name: "סיוע", value: statusQuery.data.counts.help, color: COLORS.danger },
      { name: "ממתינים", value: statusQuery.data.counts.pending, color: COLORS.warning },
    ];
  }, [statusQuery.data]);

  const radialData = useMemo(() => {
    return [
      {
        name: "היענות",
        value: responseRate,
        fill: responseRate > 80 ? COLORS.success : responseRate > 50 ? COLORS.warning : COLORS.danger,
      },
    ];
  }, [responseRate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OK":
        return "border-2 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800";
      case "HELP":
        return "border-2 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800";
      case "PENDING":
        return "border-2 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
      default:
        return "border-2 bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              מרכז פיקוד
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              ניהול ומעקב אחר מצב הכוחות בזמן אמת
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 px-4 py-2 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              מעודכן לפני {Math.floor(Math.random() * 30)} שניות
            </span>
          </div>
        </div>

        {/* KPI Cards with Mini Charts */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Response Rate Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  היענות כוללת
                </p>
                <p className="mt-2 text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {responseRate}%
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {responded} / {totalUsers}
                </p>
              </div>
            </div>
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={areaChartData.slice(0, 7)}>
                  <Line type="monotone" dataKey="אירועים" stroke={COLORS.primary} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Responded Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  אישרו הגעה
                </p>
                <p className="mt-2 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  {responded}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  חיילים מוכנים
                </p>
              </div>
            </div>
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData.slice(0, 7)}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="אירועים" stroke={COLORS.success} fill="url(#colorSuccess)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  ממתינים
                </p>
                <p className="mt-2 text-4xl font-bold text-amber-600 dark:text-amber-400">
                  {pending}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  טרם הגיבו
                </p>
              </div>
            </div>
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={areaChartData.slice(0, 7)}>
                  <Line type="monotone" dataKey="ממוצע" stroke={COLORS.warning} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Help Needed Card with Radial */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  דורשים סיוע
                </p>
                <p className="mt-2 text-4xl font-bold text-rose-600 dark:text-rose-400">
                  {helpCount}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  דרוש טיפול
                </p>
              </div>
            </div>
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="60%" outerRadius="100%" data={radialData} startAngle={180} endAngle={0}>
                  <RadialBar background dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bar Chart - Area Events */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                אירועים לפי גזרה
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                30 יום אחרונים • {activeAreas} גזרות פעילות
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar dataKey="אירועים" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                <Bar dataKey="ממוצע" fill={COLORS.teal} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart - Distribution */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                התפלגות כוחות
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                לפי גזרות
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {pieChartData.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: Object.values(COLORS)[idx % Object.values(COLORS).length] }}
                  />
                  <span className="text-slate-600 dark:text-slate-400">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scatter & Active Areas */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Scatter Chart */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                מתאם כוחות-היענות
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                היענות לעומת גודל גזרה
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="x" name="סה״כ חיילים" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis type="number" dataKey="y" name="ענו" tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Scatter name="גזרות" data={scatterData} fill={COLORS.primary}>
                  {scatterData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.z > 80 ? COLORS.success : entry.z > 50 ? COLORS.warning : COLORS.danger}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Active Areas */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                גזרות פעילות
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                מצב זמן אמת
              </p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {(activeQuery.data?.areas ?? []).map((area) => {
                const percent = area.totalUsers
                  ? Math.round((area.responded / area.totalUsers) * 100)
                  : 0;
                const isSelected = area.event?.id === selectedEventId;
                
                return (
                  <button
                    key={area.areaId}
                    type="button"
                    onClick={() => {
                      console.log('🖱️ Clicked on area:', area.areaId, 'Event:', area.event);
                      if (area.event) {
                        console.log('✅ Setting event ID:', area.event.id);
                        setSelectedEventId(area.event.id);
                      } else {
                        console.log('❌ No event for this area');
                      }
                    }}
                    className={`w-full rounded-xl border-2 p-4 text-right transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                        : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm ${
                          area.isComplete
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : area.isOverdue
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        }`}>
                          {area.areaId}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            גזרה {area.areaId}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {area.responded}/{area.totalUsers}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {percent}%
                      </span>
                    </div>
                    
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full transition-all ${
                          area.isComplete
                            ? "bg-emerald-500"
                            : area.isOverdue
                            ? "bg-rose-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
              {activeQuery.isLoading && (
                <div className="flex items-center justify-center p-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Response Distribution Chart */}
        {selectedEventId && statusQuery.data && (
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                התפלגות תגובות
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {formatEventLabel(statusQuery.data.event.triggeredAt, ACTION_LABEL)}
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={responseDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {responseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col justify-center space-y-3">
                {responseDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{item.value}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {Math.round((item.value / (statusQuery.data.counts.ok + statusQuery.data.counts.help + statusQuery.data.counts.pending)) * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Event Details with Data Table */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                פרטי חיילים
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                מעקב מפורט לפי אירוע
              </p>
            </div>
            {selectedEventId && statusQuery.data && (
              <div className="flex flex-wrap gap-2">
                {(["ALL", "OK", "HELP", "PENDING"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                      filter === status
                        ? "bg-blue-600 text-white shadow-md"
                        : "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                    onClick={() => setFilter(status)}
                  >
                    {status === "ALL" ? "הכל" : status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!selectedEventId ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-4 py-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    כל החיילים בפיקודך
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  לחץ על גזרה פעילה לראות פרטים מדויקים
                </p>
              </div>

              {allSoldiersQuery.isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                </div>
              ) : allSoldiersQuery.data && allSoldiersQuery.data.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                          <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                            חייל
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                            גזרה
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                            טלפון
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                            סטטוס
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                            הערות
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {allSoldiersQuery.data.map((item: any) => (
                          <tr
                            key={`${item.user.id}-${item.eventId}`}
                            className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/30"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                                  item.responseStatus === 'OK'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : item.responseStatus === 'HELP'
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                  {item.user.name.charAt(0)}
                                </div>
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                  {item.user.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              {item.areaId}
                            </td>
                            <td className="px-6 py-4">
                              {item.user.phone ? (
                                <a
                                  href={`tel:${item.user.phone}`}
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  {item.user.phone}
                                </a>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                item.responseStatus === 'OK'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : item.responseStatus === 'HELP'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {item.responseStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              {item.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                    מציג {allSoldiersQuery.data.length} חיילים בפיקודך
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <div className="rounded-full bg-slate-100 dark:bg-slate-900 p-6">
                    <svg className="h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-lg font-medium text-slate-600 dark:text-slate-400">
                    אין אירועים פעילים כרגע
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    החיילים יופיעו כאן כאשר יהיה אירוע פעיל
                  </p>
                </div>
              )}
            </div>
          ) : statusQuery.isFetching ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
          ) : statusQuery.data ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        חייל
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        גזרה
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        טלפון
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        סטטוס
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        הערות
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredStatusList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          אין חיילים בסטטוס זה
                        </td>
                      </tr>
                    ) : (
                      filteredStatusList.map((item) => (
                        <tr
                          key={item.user.id}
                          className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/30"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                                item.responseStatus === 'OK'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : item.responseStatus === 'HELP'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {item.user.name.charAt(0)}
                              </div>
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {item.user.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {item.user.areaId}
                          </td>
                          <td className="px-6 py-4">
                            {item.user.phone ? (
                              <a
                                href={`tel:${item.user.phone}`}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {item.user.phone}
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              item.responseStatus === 'OK'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : item.responseStatus === 'HELP'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {item.responseStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {item.notes || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filteredStatusList.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                  מציג {filteredStatusList.length} חיילים
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                לא נמצאו נתונים
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommanderDashboard;
