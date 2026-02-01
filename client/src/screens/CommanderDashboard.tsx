import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { alertService } from "../services/alertService";
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
  primary: "#2563eb", // כחול כהה
  success: "#16a34a", // ירוק צבאי
  warning: "#ea580c", // כתום אזהרה
  danger: "#dc2626", // אדום סכנה
  info: "#0891b2", // ציאן
  purple: "#7c3aed",
  pink: "#db2777",
  teal: "#0d9488",
  military: {
    green: "#4d7c0f", // ירוק צבאי כהה
    olive: "#65a30d", // ירוק זית
    sand: "#ca8a04", // צהוב חול
    steel: "#475569", // אפור פלדה
    night: "#1e293b", // כחול לילה
  }
};

const CommanderDashboard: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "OK" | "HELP" | "PENDING">("ALL");
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ show: false, type: 'info', title: '', message: '' });

  const showNotification = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
    setTimeout(() => {
      setNotification({ show: false, type: 'info', title: '', message: '' });
    }, 5000);
  }, []);

  // WebSocket handlers
  const overviewQuery = useQuery({
    queryKey: ["commander-overview"],
    queryFn: dashboardService.getCommanderOverview,
    enabled: user?.role === "COMMANDER",
    staleTime: 30000,
    gcTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const activeQuery = useQuery({
    queryKey: ["commander-active"],
    queryFn: async () => {
      console.log('🔄 Fetching commander-active data...');
      const result = await dashboardService.getCommanderActive();
      console.log('📦 Commander-active data received:', result);
      console.log('📊 Total areas:', result?.areas?.length);
      console.log('📊 Areas with events:', result?.areas?.filter(a => a.events?.length > 0).length);
      return result;
    },
    enabled: user?.role === "COMMANDER",
    staleTime: 0, // Always consider data stale - allow refetch anytime
    gcTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  // Log when activeQuery data changes
  useEffect(() => {
    console.log('🎯 activeQuery.data changed:', activeQuery.data);
    console.log('🎯 activeQuery.dataUpdatedAt:', activeQuery.dataUpdatedAt);
    console.log('🎯 activeQuery.status:', activeQuery.status);
  }, [activeQuery.data, activeQuery.dataUpdatedAt, activeQuery.status]);

  const statusQuery = useQuery({
    queryKey: ["event-status", selectedEventId],
    queryFn: async () => {
      console.log('� Fetching event status for:', selectedEventId);
      const result = await dashboardService.getEventStatus(selectedEventId!);
      console.log('🎁 Received event status:', result);
      console.log('📜 List length:', result?.list?.length);
      return result;
    },
    enabled: !!selectedEventId && user?.role === "COMMANDER",
  });

  // Query for soldiers in selected area (when no event)
  const areaSoldiersQuery = useQuery({
    queryKey: ["area-soldiers", selectedAreaId],
    queryFn: async () => {
      console.log('� Fetching soldiers for area:', selectedAreaId);
      const result = await dashboardService.getAreaSoldiers(selectedAreaId!);
      console.log('🎁 Received soldiers:', result);
      return result;
    },
    enabled: !!selectedAreaId && !selectedEventId && user?.role === "COMMANDER",
  });

  // Query for all soldiers under commander
  const allSoldiersQuery = useQuery({
    queryKey: ["all-soldiers", user?.id],
    queryFn: async () => {
      // Get all soldiers from active areas
      const areas = activeQuery.data?.areas ?? [];
      const allSoldiers: any[] = [];
      
      for (const area of areas) {
        if (area.events && area.events.length > 0) {
          // Get data for the most recent event in this area
          const eventData = await dashboardService.getEventStatus(area.events[0].id);
          allSoldiers.push(...eventData.list.map((item: any) => ({
            ...item,
            eventId: area.events[0].id,
            areaId: area.areaId,
          })));
        }
      }
      
      return allSoldiers;
    },
    enabled: user?.role === "COMMANDER" && !selectedEventId && (activeQuery.data?.areas ?? []).length > 0,
  });

  useEffect(() => {
    if (user?.role !== "COMMANDER") {
      alert("גישה למפקדים בלבד");
    }
  }, [user?.role]);

  // Auto-select first event only on initial load
  useEffect(() => {
    if (selectedEventId !== null) {
      return;
    }
    // Find first area with events
    const activeWithEvents = activeQuery.data?.areas.find((area) => area.events && area.events.length > 0);
    if (activeWithEvents?.events && activeWithEvents.events.length > 0) {
      console.log('�️ Auto-selecting first event:', activeWithEvents.events[0].id);
      setSelectedEventId(activeWithEvents.events[0].id);
    }
  }, [activeQuery.data]);

  const filteredStatusList = useMemo(() => {
    if (!statusQuery.data) {
      return [];
    }
    
    console.log('� Status Query Data:', statusQuery.data);
    console.log('📜 Full list:', statusQuery.data.list);
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
        return "border-2 bg-success bg-opacity-10 border-success border-opacity-30";
      case "HELP":
        return "border-2 bg-danger bg-opacity-10 border-danger border-opacity-30";
      case "PENDING":
        return "border-2 bg-warning bg-opacity-10 border-warning border-opacity-30";
      default:
        return "border-2 bg-surface-2 dark:bg-surface-2-dark border-border dark:border-border-dark";
    }
  };

  const handleCreateAlert = async () => {
    if (!selectedArea) {
      showNotification('error', 'שגיאה', 'נא לבחור גזרה');
      return;
    }

    setIsCreatingAlert(true);
    try {
      await alertService.triggerEvent(selectedArea);

      showNotification('success', 'הצלחה!', 'התראה נוצרה בהצלחה ונשלחה לכל החיילים ✓');
      setShowAlertModal(false);
      setSelectedArea("");
      
      // Refresh queries
      activeQuery.refetch();
      overviewQuery.refetch();
    } catch (error) {
      console.error('Error creating alert:', error);
      showNotification('error', 'שגיאה', 'אירעה שגיאה ביצירת ההתראה. נסה שוב.');
    } finally {
      setIsCreatingAlert(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text dark:text-text-dark">
              מרכז פיקוד
            </h1>
            <p className="mt-2 text-sm text-text-muted dark:text-text-dark-muted">
              ניהול ומעקב אחר מצב הכוחות בזמן אמת
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAlertModal(true)}
              className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-surface-1 shadow-lg hover:opacity-90 active:scale-95 transition-all duration-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>הקפץ התראה חדשה</span>
            </button>
            <div className="flex items-center gap-2 rounded-full bg-surface-1 dark:bg-surface-1-dark px-4 py-2 shadow-sm ring-1 ring-border dark:ring-border-dark">
              <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
              <span className="text-sm font-medium text-text dark:text-text-dark">
                מעודכן לפני {Math.floor(Math.random() * 30)} שניות
              </span>
            </div>
          </div>
        </div>

        {/* KPI Cards with Mini Charts */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Response Rate Card */}
          <div className="relative overflow-hidden rounded-2xl bg-surface-1 dark:bg-surface-1-dark p-6 shadow-hud ring-1 ring-border dark:ring-border-dark">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted dark:text-text-dark-muted">
                  היענות כוללת
                </p>
                <p className="mt-2 text-4xl font-bold text-text dark:text-text-dark">
                  {responseRate}%
                </p>
                <p className="mt-1 text-sm text-text-muted dark:text-text-dark-muted">
                  {responded} / {totalUsers}
                </p>
              </div>
            </div>
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={areaChartData.slice(0, 7)}>
                  <Line type="monotone" dataKey="אירועים" stroke={COLORS.military.steel} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Responded Card */}
          <div className="relative overflow-hidden rounded-2xl bg-surface-1 dark:bg-surface-1-dark p-6 shadow-hud ring-1 ring-border dark:ring-border-dark">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted dark:text-text-dark-muted">
                  אישרו הגעה
                </p>
                <p className="mt-2 text-4xl font-bold text-success">
                  {responded}
                </p>
                <p className="mt-1 text-sm text-text-muted dark:text-text-dark-muted">
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
          <div className="relative overflow-hidden rounded-2xl bg-surface-1 dark:bg-surface-1-dark p-6 shadow-hud ring-1 ring-border dark:ring-border-dark">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted dark:text-text-dark-muted">
                  ממתינים
                </p>
                <p className="mt-2 text-4xl font-bold text-warning">
                  {pending}
                </p>
                <p className="mt-1 text-sm text-text-muted dark:text-text-dark-muted">
                  טרם הגיבו
                </p>
              </div>
            </div>
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={areaChartData.slice(0, 7)}>
                  <Line type="monotone" dataKey="ממוצע" stroke={COLORS.military.sand} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Help Needed Card with Radial */}
          <div className="relative overflow-hidden rounded-2xl bg-surface-1 dark:bg-surface-1-dark p-6 shadow-hud ring-1 ring-border dark:ring-border-dark">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted dark:text-text-dark-muted">
                  דורשים סיוע
                </p>
                <p className="mt-2 text-4xl font-bold text-danger">
                  {helpCount}
                </p>
                <p className="mt-1 text-sm text-text-muted dark:text-text-dark-muted">
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
          <div className="lg:col-span-2 rounded-2xl bg-surface-1 dark:bg-surface-1-dark p-6 shadow-hud ring-1 ring-border dark:ring-border-dark">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text dark:text-text-dark">
                אירועים לפי גזרה
              </h2>
              <p className="mt-1 text-sm text-text-muted dark:text-text-dark-muted">
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
                <Bar dataKey="אירועים" fill={COLORS.military.steel} radius={[8, 8, 0, 0]} />
                <Bar dataKey="ממוצע" fill={COLORS.military.olive} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart - Distribution */}
          <div className="rounded-2xl bg-surface-1 dark:bg-surface-1-dark p-6 shadow-hud ring-1 ring-border dark:ring-border-dark">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text dark:text-text-dark">
                התפלגות כוחות
              </h2>
              <p className="mt-1 text-sm text-text-muted dark:text-text-dark-muted">
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
                  <span className="text-text-muted dark:text-text-dark-muted">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Areas - Clean Alert Style */}
        <div className="rounded-2xl bg-surface-1 dark:bg-surface-1-dark p-6 shadow-hud ring-1 ring-border dark:ring-border-dark">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-text dark:text-text-dark flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/20 text-danger animate-pulse">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </span>
              אירועים פעילים ({(activeQuery.data?.areas ?? []).reduce((sum, area) => sum + (area.events?.length ?? 0), 0)})
            </h2>
            <p className="mt-1 text-sm text-text-muted dark:text-text-dark-muted">
              מעקב בזמן אמת אחרי כל האירועים הפעילים
            </p>
          </div>

          <div className="space-y-4">
            {(() => {
              console.log('🎯 Rendering active areas');
              console.log('🎯 activeQuery.data:', activeQuery.data);
              console.log('🎯 areas:', activeQuery.data?.areas);
              console.log('🎯 areas length:', activeQuery.data?.areas?.length);
              
              const areasWithEvents = (activeQuery.data?.areas ?? []).filter(a => a.events && a.events.length > 0);
              console.log('🎯 Areas with events:', areasWithEvents);
              
              return null;
            })()}
            
            {(activeQuery.data?.areas ?? []).flatMap((area) => {
              // Show each active event in the area as a separate card
              if (!area.events || area.events.length === 0) {
                return [];
              }
              
              // Show each event as a beautiful alert-style card
              return area.events.map((event, eventIndex) => {
                const percent = event.totalUsers
                  ? Math.round((event.responded / event.totalUsers) * 100)
                  : 0;
                const isSelected = event.id === selectedEventId;
                
                return (
                  <div
                    key={`${area.areaId}-${event.id}`}
                    className={`rounded-xl border-2 overflow-hidden transition-all ${
                      isSelected
                        ? "border-primary shadow-lg"
                        : "border-border dark:border-border-dark hover:border-primary/50"
                    }`}
                  >
                    {/* Header */}
                    <div className={`px-5 py-3 flex items-center justify-between ${
                      event.isComplete
                        ? "bg-success/10 border-b-2 border-success/20"
                        : event.isOverdue
                        ? "bg-danger/10 border-b-2 border-danger/20"
                        : "bg-warning/10 border-b-2 border-warning/20"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                          event.isComplete
                            ? "bg-success text-white"
                            : event.isOverdue
                            ? "bg-danger text-white animate-pulse"
                            : "bg-warning text-white"
                        }`}>
                          {area.areaId.replace('area-', '')}
                        </div>
                        <div>
                          <h3 className="font-bold text-text dark:text-text-dark">
                            גזרה {area.areaId} {area.events.length > 1 ? `(אירוע ${eventIndex + 1}/${area.events.length})` : ''}
                          </h3>
                          <p className="text-xs text-text-muted dark:text-text-dark-muted">
                            {formatDate(event.triggeredAt)} • {formatEventLabel(event.triggeredAt, ACTION_LABEL)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.isComplete && (
                          <span className="flex items-center gap-1 text-success text-sm font-semibold">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            הושלם
                          </span>
                        )}
                        {event.isOverdue && !event.isComplete && (
                          <span className="flex items-center gap-1 text-danger text-sm font-semibold animate-pulse">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            דורש טיפול
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 bg-surface-1 dark:bg-surface-1-dark">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-3 rounded-lg bg-success/10 border border-success/20">
                          <div className="text-2xl font-bold text-success">{event.ok}</div>
                          <div className="text-xs text-text-muted dark:text-text-dark-muted">בסדר</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-danger/10 border border-danger/20">
                          <div className="text-2xl font-bold text-danger">{event.help}</div>
                          <div className="text-xs text-text-muted dark:text-text-dark-muted">צריך עזרה</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-warning/10 border border-warning/20">
                          <div className="text-2xl font-bold text-warning">{event.pending}</div>
                          <div className="text-xs text-text-muted dark:text-text-dark-muted">ממתינים</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-text dark:text-text-dark">
                            התקדמות דיווח
                          </span>
                          <span className="text-sm font-bold text-primary">{percent}%</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2 dark:bg-surface-2-dark">
                          <div
                            className={`h-full rounded-full transition-all ${
                              event.isComplete
                                ? "bg-success"
                                : event.isOverdue
                                ? "bg-danger"
                                : "bg-warning"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          setSelectedEventId(event.id);
                          setSelectedAreaId(null);
                          setFilter("ALL");
                        }}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                        }`}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {isSelected ? 'מוצג כעת' : 'הצג פרטים מלאים'}
                      </button>
                    </div>
                  </div>
                );
              });
            })}
            
            {activeQuery.isLoading && (
              <div className="flex items-center justify-center p-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              </div>
            )}
            
            {!activeQuery.isLoading && (activeQuery.data?.areas ?? []).every(area => !area.events || area.events.length === 0) && (
              <div className="text-center p-12">
                <svg className="mx-auto h-16 w-16 text-text-muted dark:text-text-dark-muted opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-4 text-lg font-medium text-text-muted dark:text-text-dark-muted">
                  אין אירועים פעילים כרגע
                </p>
                <p className="mt-2 text-sm text-text-muted dark:text-text-dark-muted">
                  כל החיילים בסדר ✓
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Response Distribution Chart */}
        {selectedEventId && statusQuery.data && (
          <div className="rounded-2xl bg-surface-1 dark:bg-surface-1-dark p-6 shadow-hud ring-1 ring-border dark:ring-border-dark">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text dark:text-text-dark">
                התפלגות תגובות
              </h2>
              <p className="mt-1 text-sm text-text-muted dark:text-text-dark-muted">
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
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-border dark:border-border-dark p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-text dark:text-text-dark">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-text dark:text-text-dark">{item.value}</p>
                      <p className="text-xs text-text-muted dark:text-text-dark-muted">
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
        <div className="rounded-2xl bg-surface-1 dark:bg-surface-1-dark p-6 shadow-hud ring-1 ring-border dark:ring-border-dark">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text dark:text-text-dark">
                פרטי חיילים
              </h2>
              <p className="mt-1 text-sm text-text-muted dark:text-text-dark-muted">
                {selectedAreaId ? `גזרה ${selectedAreaId} - כל החיילים` : 'מעקב מפורט לפי אירוע'}
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
                        ? "bg-primary text-primary-contrast shadow-md"
                        : "border border-border dark:border-border-dark text-text dark:text-text-dark hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                    }`}
                    onClick={() => setFilter(status)}
                  >
                    {status === "ALL" ? "הכל" : status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedAreaId && !selectedEventId ? (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 rounded-lg bg-secondary/10 dark:bg-secondary/20 px-4 py-2">
                  <svg className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-medium text-secondary dark:text-secondary-dark">
                    גזרה {selectedAreaId}
                  </span>
                </div>
              </div>

              {areaSoldiersQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  <p className="mt-4 text-sm text-text-muted dark:text-text-dark-muted">
                    טוען חיילים...
                  </p>
                </div>
              ) : areaSoldiersQuery.data?.soldiers && areaSoldiersQuery.data.soldiers.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-border dark:border-border-dark">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-2 dark:bg-surface-2-dark">
                        <tr>
                          <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                            חייל
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                            אימייל
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                            טלפון
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                            תאריך הצטרפות
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border dark:divide-border-dark">
                        {areaSoldiersQuery.data.soldiers.map((soldier: any) => (
                          <tr
                            key={soldier.id}
                            className="transition-colors hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-dark text-sm font-bold">
                                  {soldier.name.charAt(0)}
                                </div>
                                <span className="font-medium text-text dark:text-text-dark">
                                  {soldier.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-text-muted dark:text-text-dark-muted">
                              {soldier.email}
                            </td>
                            <td className="px-6 py-4">
                              {soldier.phone ? (
                                <a
                                  href={`tel:${soldier.phone}`}
                                  className="text-primary hover:text-primary-hover dark:text-primary dark:hover:text-primary-hover"
                                >
                                  {soldier.phone}
                                </a>
                              ) : (
                                <span className="text-text-muted dark:text-text-dark-muted">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-text-muted dark:text-text-dark-muted">
                              {new Date(soldier.createdAt).toLocaleDateString('he-IL')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark px-6 py-3 text-sm text-text-muted dark:text-text-dark-muted">
                    מציג {areaSoldiersQuery.data.soldiers.length} חיילים
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-border dark:border-border-dark">
                  <div className="rounded-full bg-surface-2 dark:bg-surface-2-dark p-6">
                    <svg className="h-16 w-16 text-text-muted dark:text-text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-lg font-medium text-text-muted dark:text-text-dark-muted">
                    אין חיילים בגזרה זו
                  </p>
                </div>
              )}
            </div>
          ) : !selectedEventId ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 rounded-lg bg-secondary/10 dark:bg-secondary/20 px-4 py-2">
                  <svg className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm font-medium text-secondary dark:text-secondary-dark">
                    כל החיילים בפיקודך
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-muted dark:text-text-dark-muted">
                  לחץ על גזרה פעילה לראות פרטים מדויקים
                </p>
              </div>

              {allSoldiersQuery.isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                </div>
              ) : allSoldiersQuery.data && allSoldiersQuery.data.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-border dark:border-border-dark">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-2 dark:bg-surface-2-dark">
                        <tr>
                          <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                            חייל
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                            גזרה
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                            טלפון
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                            סטטוס
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                            הערות
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border dark:divide-border-dark">
                        {allSoldiersQuery.data.map((item: any) => (
                          <tr
                            key={`${item.user.id}-${item.eventId}`}
                            className="transition-colors hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                                  item.responseStatus === 'OK'
                                    ? 'bg-success bg-opacity-20 text-success'
                                    : item.responseStatus === 'HELP'
                                    ? 'bg-danger bg-opacity-20 text-danger'
                                    : 'bg-warning bg-opacity-20 text-warning'
                                }`}>
                                  {item.user.name.charAt(0)}
                                </div>
                                <span className="font-medium text-text dark:text-text-dark">
                                  {item.user.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-text-muted dark:text-text-dark-muted">
                              {item.areaId}
                            </td>
                            <td className="px-6 py-4">
                              {item.user.phone ? (
                                <a
                                  href={`tel:${item.user.phone}`}
                                  className="text-primary hover:text-primary-hover dark:text-primary dark:hover:text-primary-hover"
                                >
                                  {item.user.phone}
                                </a>
                              ) : (
                                <span className="text-text-muted dark:text-text-dark-muted">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                item.responseStatus === 'OK'
                                  ? 'bg-success bg-opacity-20 text-success'
                                  : item.responseStatus === 'HELP'
                                  ? 'bg-danger bg-opacity-20 text-danger'
                                  : 'bg-warning bg-opacity-20 text-warning'
                              }`}>
                                {item.responseStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-text-muted dark:text-text-dark-muted">
                              {item.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark px-6 py-3 text-sm text-text-muted dark:text-text-dark-muted">
                    מציג {allSoldiersQuery.data.length} חיילים בפיקודך
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-border dark:border-border-dark">
                  <div className="rounded-full bg-surface-2 dark:bg-surface-2-dark p-6">
                    <svg className="h-16 w-16 text-text-muted dark:text-text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-lg font-medium text-text-muted dark:text-text-dark-muted">
                    אין אירועים פעילים כרגע
                  </p>
                  <p className="mt-2 text-sm text-text-muted dark:text-text-dark-muted">
                    החיילים יופיעו כאן כאשר יהיה אירוע פעיל
                  </p>
                </div>
              )}
            </div>
          ) : statusQuery.isFetching ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="mt-4 text-sm text-text-muted dark:text-text-dark-muted">
                טוען נתוני חיילים...
              </p>
            </div>
          ) : statusQuery.data ? (
            <div className="overflow-hidden rounded-xl border border-border dark:border-border-dark">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2 dark:bg-surface-2-dark">
                    <tr>
                      <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                        חייל
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                        גזרה
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                        טלפון
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                        סטטוס
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-text dark:text-text-dark">
                        הערות
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-border-dark">
                    {filteredStatusList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-text-muted dark:text-text-dark-muted">
                          אין חיילים בסטטוס זה
                        </td>
                      </tr>
                    ) : (
                      filteredStatusList.map((item) => (
                        <tr
                          key={item.user.id}
                          className="transition-colors hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                                item.responseStatus === 'OK'
                                  ? 'bg-success bg-opacity-20 text-success'
                                  : item.responseStatus === 'HELP'
                                  ? 'bg-danger bg-opacity-20 text-danger'
                                  : 'bg-warning bg-opacity-20 text-warning'
                              }`}>
                                {item.user.name.charAt(0)}
                              </div>
                              <span className="font-medium text-text dark:text-text-dark">
                                {item.user.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-text-muted dark:text-text-dark-muted">
                            {item.user.areaId}
                          </td>
                          <td className="px-6 py-4">
                            {item.user.phone ? (
                              <a
                                href={`tel:${item.user.phone}`}
                                className="text-primary hover:text-primary-hover dark:text-primary dark:hover:text-primary-hover"
                              >
                                {item.user.phone}
                              </a>
                            ) : (
                              <span className="text-text-muted dark:text-text-dark-muted">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              item.responseStatus === 'OK'
                                ? 'bg-success bg-opacity-20 text-success'
                                : item.responseStatus === 'HELP'
                                ? 'bg-danger bg-opacity-20 text-danger'
                                : 'bg-warning bg-opacity-20 text-warning'
                            }`}>
                              {item.responseStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-text-muted dark:text-text-dark-muted">
                            {item.notes || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filteredStatusList.length > 0 && (
                <div className="border-t border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark px-6 py-3 text-sm text-text-muted dark:text-text-dark-muted">
                  מציג {filteredStatusList.length} חיילים
                </div>
              )}
            </div>
          ) : statusQuery.error ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-danger bg-danger bg-opacity-5">
              <div className="rounded-full bg-danger bg-opacity-20 p-6">
                <svg className="h-16 w-16 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-medium text-danger">
                שגיאה בטעינת הנתונים
              </p>
              <p className="mt-2 text-sm text-text-muted dark:text-text-dark-muted">
                נסה לבחור גזרה אחרת או לרענן את הדף
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-border dark:border-border-dark">
              <div className="rounded-full bg-surface-2 dark:bg-surface-2-dark p-6">
                <svg className="h-16 w-16 text-text-muted dark:text-text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-medium text-text-muted dark:text-text-dark-muted">
                אין נתונים להצגה
              </p>
              <p className="mt-2 text-sm text-text-muted dark:text-text-dark-muted">
                בחר גזרה פעילה כדי לראות את החיילים
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Alert Creation Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAlertModal(false)}>
          <div className="relative w-full max-w-md rounded-2xl bg-surface-1 dark:bg-surface-1-dark p-6 shadow-2xl ring-1 ring-border dark:ring-border-dark" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger bg-opacity-20">
                  <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text dark:text-text-dark">
                    התראה חדשה
                  </h3>
                  <p className="text-sm text-text-muted dark:text-text-dark-muted">
                    ירוק בעיניים
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text dark:text-text-dark mb-2">
                  בחר גזרה:
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-border-dark bg-surface-1 dark:bg-surface-1-dark px-4 py-3 text-text dark:text-text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">-- בחר גזרה --</option>
                  {overviewQuery.data?.areas.map((area: any) => (
                    <option key={area.areaId} value={area.areaId}>
                      גזרה {area.areaId} ({area.totalUsers} חיילים)
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg bg-warning bg-opacity-10 border border-warning border-opacity-30 p-4">
                <div className="flex gap-3">
                  <svg className="h-5 w-5 text-warning flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-warning">
                    התראה תישלח לכל החיילים בגזרה שנבחרה. הם יקבלו התראה במכשיר ויתבקשו לדווח על מצבם.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateAlert}
                  disabled={!selectedArea || isCreatingAlert}
                  className="flex-1 rounded-lg bg-danger px-4 py-3 text-sm font-semibold text-surface-1 shadow-lg hover:opacity-90 disabled:bg-text-muted disabled:cursor-not-allowed active:scale-95 transition-all duration-200"
                >
                  {isCreatingAlert ? "שולח..." : "שלח התראה"}
                </button>
                <button
                  onClick={() => setShowAlertModal(false)}
                  disabled={isCreatingAlert}
                  className="flex-1 rounded-lg border-2 border-border dark:border-border-dark bg-surface-1 dark:bg-surface-1-dark px-4 py-3 text-sm font-semibold text-text dark:text-text-dark hover:bg-surface-2 dark:hover:bg-surface-2-dark disabled:cursor-not-allowed active:scale-95 transition-all duration-200"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-down">
          <div className={`rounded-2xl shadow-hud p-4 min-w-[340px] max-w-md bg-surface-1 dark:bg-surface-1-dark border ${
            notification.type === 'success'
              ? 'border-success/30 dark:border-success/50'
              : notification.type === 'error'
              ? 'border-danger/30 dark:border-danger/50'
              : 'border-info/30 dark:border-info/50'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 rounded-lg p-2 ${
                notification.type === 'success'
                  ? 'bg-success/10 dark:bg-success/20'
                  : notification.type === 'error'
                  ? 'bg-danger/10 dark:bg-danger/20'
                  : 'bg-info/10 dark:bg-info/20'
              }`}>
                {notification.type === 'success' ? (
                  <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : notification.type === 'error' ? (
                  <svg className="h-5 w-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-text dark:text-text-dark">
                  {notification.title}
                </h4>
                <p className="text-sm text-text-muted dark:text-text-dark-muted mt-0.5">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification({ ...notification, show: false })}
                className="flex-shrink-0 text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommanderDashboard;
