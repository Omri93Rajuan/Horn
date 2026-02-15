import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { alertService } from "../services/alertService";
import { useAppSelector } from "../store/hooks";
import { formatAreaName, formatDate, formatEventLabel, formatStatus } from "../utils/dateUtils";
import { toastError } from "../utils/toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
  COLORS.purple,
  COLORS.pink,
  COLORS.teal,
];

const CommanderDashboard: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
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
    queryFn: dashboardService.getCommanderActive,
    enabled: user?.role === "COMMANDER",
    staleTime: 0, // Always consider data stale - allow refetch anytime
    gcTime: 60000,
    refetchOnMount: true, // Refetch on mount to ensure fresh data
    refetchOnWindowFocus: true, // Also refetch when window regains focus
    refetchOnReconnect: true, // And when network reconnects
    retry: false,
  });

  const statusQuery = useQuery({
    queryKey: ["event-status", selectedEventId],
    queryFn: async () => {
      if (import.meta.env.DEV) {
        console.log('🔍 Fetching event status for:', selectedEventId);
      }
      const result = await dashboardService.getEventStatus(selectedEventId!);
      if (import.meta.env.DEV) {
        console.log('🎁 Received event status:', result);
        console.log('📜 List length:', result?.list?.length);
      }
      return result;
    },
    enabled: !!selectedEventId && user?.role === "COMMANDER",
  });

  // Query for soldiers in selected area (when no event)
  const areaSoldiersQuery = useQuery({
    queryKey: ["area-soldiers", selectedAreaId],
    queryFn: async () => {
      if (import.meta.env.DEV) {
        console.log('👥 Fetching soldiers for area:', selectedAreaId);
      }
      const result = await dashboardService.getAreaSoldiers(selectedAreaId!);
      if (import.meta.env.DEV) {
        console.log('🎁 Received soldiers:', result);
      }
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
      toastError("גישה למפקדים בלבד");
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
      if (import.meta.env.DEV) {
        console.log('🎯 Auto-selecting first event:', activeWithEvents.events[0].id);
      }
      setSelectedEventId(activeWithEvents.events[0].id);
    }
  }, [activeQuery.data]);

  const filteredStatusList = useMemo(() => {
    if (!statusQuery.data) {
      return [];
    }
    
    if (import.meta.env.DEV) {
      console.log('📊 Status Query Data:', statusQuery.data);
      console.log('📜 Full list:', statusQuery.data.list);
      console.log('🔢 Counts:', statusQuery.data.counts);
    }
    
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
  const helpCount = activeQuery.data?.totals.help ?? 0;

  // Data for charts
  const areaChartData = useMemo(() => {
    return (overviewQuery.data?.areas ?? []).map((area) => ({
      name: formatAreaName(area.areaId),
      אירועים: area.last30Days,
      ממוצע: Math.round((overviewQuery.data?.areas.reduce((sum, a) => sum + a.last30Days, 0) ?? 0) / (overviewQuery.data?.areas.length ?? 1)),
    }));
  }, [overviewQuery.data]);

  const pieChartData = useMemo(() => {
    return (activeQuery.data?.areas ?? []).map((area) => ({
      name: formatAreaName(area.areaId),
      value: area.totalUsers,
      responded: area.responded,
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
    <div className="min-h-screen bg-gradient-to-br from-bg via-bg to-surface-2 dark:from-bg-dark dark:via-bg-dark dark:to-surface-2-dark p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface-1/80 dark:bg-surface-1-dark/80 backdrop-blur-sm shadow-hud border border-border/50 dark:border-border-dark/50">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text dark:text-text-dark">
                  מרכז פיקוד
                </h1>
                <p className="mt-0.5 text-sm text-text-muted dark:text-text-dark-muted">
                  ניהול ומעקב בזמן אמת • {activeAreas} גזרות פעילות
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAlertModal(true)}
              className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-danger to-danger/90 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="h-5 w-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="relative z-10">התראה חדשה</span>
            </button>
            <div className="flex items-center gap-2.5 rounded-xl bg-success/10 dark:bg-success/20 px-4 py-3 border border-success/30 dark:border-success/40">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-success shadow-lg shadow-success/50" />
              <span className="text-sm font-medium text-success">
                מעודכן
              </span>
            </div>
          </div>
        </div>

        {/* KPI Cards with Mini Charts */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Response Rate Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-1 to-surface-2 dark:from-surface-1-dark dark:to-surface-2-dark p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 dark:border-border-dark/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-text-dark-muted">
                  שיעור היענות
                </p>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-br from-primary to-primary-hover bg-clip-text text-transparent">
                {responseRate}%
              </p>
              <p className="mt-2 text-sm font-medium text-text-muted dark:text-text-dark-muted">
                {responded} מתוך {totalUsers} חיילים
              </p>
            </div>
            <div className="mt-4 h-12 opacity-50 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={areaChartData.slice(0, 7)}>
                  <Line type="monotone" dataKey="אירועים" stroke="#B79B4A" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Responded Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-1 to-surface-2 dark:from-surface-1-dark dark:to-surface-2-dark p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 dark:border-border-dark/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success/10 to-transparent rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 dark:bg-success/20">
                  <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-text-dark-muted">
                  מוכנים לפעולה
                </p>
              </div>
              <p className="text-4xl font-bold text-success">
                {responded}
              </p>
              <p className="mt-2 text-sm font-medium text-text-muted dark:text-text-dark-muted">
                חיילים הגיבו
              </p>
            </div>
            <div className="mt-4 h-12 opacity-50 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData.slice(0, 7)}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="אירועים" stroke={COLORS.success} strokeWidth={2} fill="url(#colorSuccess)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-1 to-surface-2 dark:from-surface-1-dark dark:to-surface-2-dark p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 dark:border-border-dark/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-warning/10 to-transparent rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 dark:bg-warning/20">
                  <svg className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-text-dark-muted">
                  ממתינים
                </p>
              </div>
              <p className="text-4xl font-bold text-warning">
                {pending}
              </p>
              <p className="mt-2 text-sm font-medium text-text-muted dark:text-text-dark-muted">
                טרם הגיבו
              </p>
            </div>
            <div className="mt-4 h-12 opacity-50 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={areaChartData.slice(0, 7)}>
                  <Line type="monotone" dataKey="ממוצע" stroke="#B07A2A" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Help Needed Card with Radial */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-1 to-surface-2 dark:from-surface-1-dark dark:to-surface-2-dark p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 dark:border-border-dark/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-danger/10 to-transparent rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10 dark:bg-danger/20">
                  <svg className="h-5 w-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-text-dark-muted">
                  דורשים סיוע
                </p>
              </div>
              <p className="text-4xl font-bold text-danger">
                {helpCount}
              </p>
              <p className="mt-2 text-sm font-medium text-text-muted dark:text-text-dark-muted">
                {helpCount > 0 ? 'דרוש טיפול מיידי' : 'הכל תקין'}
              </p>
            </div>
            <div className="mt-4 h-12 opacity-50 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="60%" outerRadius="100%" data={radialData} startAngle={180} endAngle={0}>
                  <RadialBar background dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Bar Chart - Area Events */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-surface-1 to-surface-2 dark:from-surface-1-dark dark:to-surface-2-dark p-6 shadow-lg border border-border/50 dark:border-border-dark/50">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-text dark:text-text-dark">
                  אירועים לפי גזרה
                </h2>
              </div>
              <p className="text-sm text-text-muted dark:text-text-dark-muted mr-12">
                30 יום אחרונים • {activeAreas} גזרות פעילות
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8D1C3" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#5A5F66' }} 
                  stroke="#D8D1C3" 
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#5A5F66' }} 
                  stroke="#D8D1C3"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.98)",
                    border: "1px solid #D8D1C3",
                    borderRadius: "12px",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                    padding: "12px",
                  }}
                  cursor={{ fill: 'rgba(183, 155, 74, 0.1)' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Bar dataKey="אירועים" fill="#B79B4A" radius={[8, 8, 0, 0]} />
                <Bar dataKey="ממוצע" fill="#4E5B3A" radius={[8, 8, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart - Distribution */}
          <div className="rounded-2xl bg-gradient-to-br from-surface-1 to-surface-2 dark:from-surface-1-dark dark:to-surface-2-dark p-6 shadow-lg border border-border/50 dark:border-border-dark/50">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 dark:bg-secondary/20">
                  <svg className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-text dark:text-text-dark">
                  התפלגות כוחות
                </h2>
              </div>
              <p className="text-sm text-text-muted dark:text-text-dark-muted mr-12">
                לפי גזרות
              </p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.98)",
                    border: "1px solid #D8D1C3",
                    borderRadius: "12px",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                    padding: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
              {pieChartData.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-2 dark:hover:bg-surface-2-dark transition-colors">
                  <div
                    className="h-3 w-3 rounded-full shadow-sm"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  <span className="font-medium text-text dark:text-text-dark">{item.name}:</span>
                  <span className="text-text-muted dark:text-text-dark-muted">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Areas - Clean Alert Style */}
        <div className="rounded-2xl bg-gradient-to-br from-surface-1 to-surface-2 dark:from-surface-1-dark dark:to-surface-2-dark p-6 shadow-lg border border-border/50 dark:border-border-dark/50">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-danger to-danger/90 shadow-lg animate-pulse">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-text dark:text-text-dark">
                  אירועים פעילים
                </h2>
              </div>
              <p className="text-sm text-text-muted dark:text-text-dark-muted mr-13">
                {(activeQuery.data?.areas ?? []).reduce((sum, area) => sum + (area.events?.length ?? 0), 0)} אירועים במעקב • מעודכן בזמן אמת
              </p>
            </div>
          </div>

          <div className="space-y-4">
            
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
                    className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
                      isSelected
                        ? "shadow-2xl scale-[1.01] border-2 border-primary"
                        : "shadow-lg hover:shadow-xl border-2 border-border dark:border-border-dark hover:border-primary/30"
                    }`}
                  >
                    {/* Header with gradient */}
                    <div className={`relative px-6 py-4 flex items-center justify-between overflow-hidden ${
                      event.isComplete
                        ? "bg-gradient-to-r from-success/15 via-success/10 to-transparent"
                        : event.isOverdue
                        ? "bg-gradient-to-r from-danger/15 via-danger/10 to-transparent"
                        : "bg-gradient-to-r from-warning/15 via-warning/10 to-transparent"
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-l from-transparent to-surface-1/50 dark:to-surface-1-dark/50" />
                      <div className="relative flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full shadow-lg ${
                          event.isComplete
                            ? "bg-success animate-pulse"
                            : event.isOverdue
                            ? "bg-danger animate-pulse"
                            : "bg-warning"
                        }`} />
                        <div>
                          <h3 className="font-bold text-lg text-text dark:text-text-dark">
                            {formatAreaName(area.areaId)}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-text-muted dark:text-text-dark-muted">
                              {formatDate(event.triggeredAt)}
                            </p>
                            {area.events.length > 1 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                                אירוע {eventIndex + 1}/{area.events.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="relative flex items-center gap-2">
                        {event.isComplete && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/20 text-success text-sm font-semibold">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            הושלם
                          </span>
                        )}
                        {event.isOverdue && !event.isComplete && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/20 text-danger text-sm font-semibold animate-pulse">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            דורש טיפול
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 bg-surface-1 dark:bg-surface-1-dark">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-5">
                        <div className="relative overflow-hidden text-center p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/20 hover:border-success/40 transition-colors group/card">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-success/10 rounded-full blur-xl" />
                          <div className="relative">
                            <div className="text-3xl font-bold text-success mb-1">{event.ok}</div>
                            <div className="text-xs font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wide">{formatStatus("OK")}</div>
                          </div>
                        </div>
                        <div className="relative overflow-hidden text-center p-4 rounded-xl bg-gradient-to-br from-danger/10 to-danger/5 border-2 border-danger/20 hover:border-danger/40 transition-colors group/card">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-danger/10 rounded-full blur-xl" />
                          <div className="relative">
                            <div className="text-3xl font-bold text-danger mb-1">{event.help}</div>
                            <div className="text-xs font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wide">{formatStatus("HELP")}</div>
                          </div>
                        </div>
                        <div className="relative overflow-hidden text-center p-4 rounded-xl bg-gradient-to-br from-warning/10 to-warning/5 border-2 border-warning/20 hover:border-warning/40 transition-colors group/card">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-warning/10 rounded-full blur-xl" />
                          <div className="relative">
                            <div className="text-3xl font-bold text-warning mb-1">{event.pending}</div>
                            <div className="text-xs font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wide">ממתינים</div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-text dark:text-text-dark">
                            התקדמות דיווח
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-text-muted dark:text-text-dark-muted">
                              {event.responded}/{event.totalUsers}
                            </div>
                            <span className="text-lg font-bold text-primary">{percent}%</span>
                          </div>
                        </div>
                        <div className="relative h-4 w-full overflow-hidden rounded-full bg-surface-2 dark:bg-surface-2-dark shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-500 shadow-lg ${
                              event.isComplete
                                ? "bg-gradient-to-r from-success to-success/80"
                                : event.isOverdue
                                ? "bg-gradient-to-r from-danger to-danger/80"
                                : "bg-gradient-to-r from-warning to-warning/80"
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
                        className={`group/btn relative w-full py-3.5 px-5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 overflow-hidden ${
                          isSelected
                            ? "bg-gradient-to-r from-primary to-primary-hover text-white shadow-lg"
                            : "bg-primary/10 text-primary hover:bg-gradient-to-r hover:from-primary hover:to-primary-hover hover:text-white hover:shadow-lg"
                        }`}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        <svg className="relative z-10 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="relative z-10">{isSelected ? 'מוצג כעת' : 'הצג פרטים מלאים'}</span>
                      </button>
                    </div>
                  </div>
                );
              });
            })}
            
            {activeQuery.isLoading && (
              <div className="flex flex-col items-center justify-center p-16">
                <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-primary/10" />
                </div>
                <p className="mt-6 text-sm font-medium text-text-muted dark:text-text-dark-muted">
                  טוען אירועים פעילים...
                </p>
              </div>
            )}
            
            {!activeQuery.isLoading && (activeQuery.data?.areas ?? []).every(area => !area.events || area.events.length === 0) && (
              <div className="text-center p-16 rounded-2xl bg-gradient-to-br from-success/5 to-transparent border-2 border-dashed border-success/20">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-success/10 mb-4">
                  <svg className="h-10 w-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-success mb-2">
                  אין אירועים פעילים
                </p>
                <p className="text-sm text-text-muted dark:text-text-dark-muted">
                  כל החיילים מדווחים תקין • המערכת פעילה ומוכנה
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
                {selectedAreaId ? `${formatAreaName(selectedAreaId)} - כל החיילים` : 'מעקב מפורט לפי אירוע'}
              </p>
            </div>
            {selectedEventId && statusQuery.data && (
              <div className="flex flex-wrap gap-3">
                {(["ALL", "OK", "HELP", "PENDING"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`group relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 overflow-hidden ${
                      filter === status
                        ? "bg-gradient-to-r from-primary to-primary-hover text-white shadow-lg scale-105"
                        : "bg-surface-2 dark:bg-surface-2-dark text-text dark:text-text-dark hover:bg-primary/10 border-2 border-border dark:border-border-dark hover:border-primary/30"
                    }`}
                    onClick={() => setFilter(status)}
                  >
                    {filter === status && (
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    <span className="relative z-10">{formatStatus(status)}</span>
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
                    {formatAreaName(selectedAreaId || "")}
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
                              {formatAreaName(item.areaId)}
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
                                {formatStatus(item.responseStatus)}
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
                            {formatAreaName(item.user.areaId)}
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
                              {formatStatus(item.responseStatus)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowAlertModal(false)}>
          <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-br from-surface-1 to-surface-2 dark:from-surface-1-dark dark:to-surface-2-dark p-8 shadow-2xl border-2 border-border/50 dark:border-border-dark/50 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setShowAlertModal(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-surface-2 dark:hover:bg-surface-2-dark text-text-muted hover:text-text dark:text-text-dark-muted dark:hover:text-text-dark transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-danger to-danger/80 shadow-lg">
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-text dark:text-text-dark mb-1">
                התראה חדשה
              </h3>
              <p className="text-sm text-text-muted dark:text-text-dark-muted">
                ירוק בעיניים לאירוע
              </p>
            </div>

            <div className="space-y-5">
              {/* Area Selection */}
              <div>
                <label className="block text-sm font-semibold text-text dark:text-text-dark mb-3">
                  בחר גזרה:
                </label>
                <div className="relative">
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full appearance-none rounded-xl border-2 border-border dark:border-border-dark bg-surface-1 dark:bg-surface-1-dark px-4 py-3.5 text-text dark:text-text-dark font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    <option value="" className="text-text-muted">-- בחר גזרה --</option>
                    {overviewQuery.data?.areas.map((area: any) => (
                      <option key={area.areaId} value={area.areaId}>
                        {formatAreaName(area.areaId)} • {area.totalUsers} חיילים
                      </option>
                    ))}
                  </select>
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Warning Box */}
              <div className="rounded-xl bg-gradient-to-r from-warning/15 to-warning/5 border-2 border-warning/30 p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/20">
                      <svg className="h-4 w-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warning mb-1">
                      שים לב!
                    </p>
                    <p className="text-xs text-warning/90">
                      התראה תישלח מיידית לכל החיילים בגזרה. הם יקבלו הודעה במכשיר ויתבקשו לדווח על מצבם.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={handleCreateAlert}
                  disabled={!selectedArea || isCreatingAlert}
                  className="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-danger to-danger/90 px-6 py-4 text-sm font-bold text-white shadow-lg hover:shadow-xl disabled:from-text-muted disabled:to-text-muted disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity" />
                  <span className="relative z-10">{isCreatingAlert ? "שולח התראה..." : "שלח התראה"}</span>
                </button>
                <button
                  onClick={() => setShowAlertModal(false)}
                  disabled={isCreatingAlert}
                  className="flex-1 rounded-xl border-2 border-border dark:border-border-dark bg-surface-1 dark:bg-surface-1-dark px-6 py-4 text-sm font-bold text-text dark:text-text-dark hover:bg-surface-2 dark:hover:bg-surface-2-dark hover:border-primary/30 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
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
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top duration-300">
          <div className={`relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-sm p-5 min-w-[380px] max-w-md border-2 ${
            notification.type === 'success'
              ? 'bg-gradient-to-r from-success/10 via-success/5 to-transparent border-success/30 dark:border-success/40'
              : notification.type === 'error'
              ? 'bg-gradient-to-r from-danger/10 via-danger/5 to-transparent border-danger/30 dark:border-danger/40'
              : 'bg-gradient-to-r from-info/10 via-info/5 to-transparent border-info/30 dark:border-info/40'
          } bg-surface-1/95 dark:bg-surface-1-dark/95`}>
            {/* Background decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 ${
              notification.type === 'success'
                ? 'bg-success'
                : notification.type === 'error'
                ? 'bg-danger'
                : 'bg-info'
            }`} />
            
            <div className="relative flex items-start gap-4">
              <div className={`flex-shrink-0 rounded-xl p-3 shadow-lg ${
                notification.type === 'success'
                  ? 'bg-gradient-to-br from-success to-success/80'
                  : notification.type === 'error'
                  ? 'bg-gradient-to-br from-danger to-danger/80'
                  : 'bg-gradient-to-br from-info to-info/80'
              }`}>
                {notification.type === 'success' ? (
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : notification.type === 'error' ? (
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg text-text dark:text-text-dark">
                  {notification.title}
                </h4>
                <p className="text-sm text-text-muted dark:text-text-dark-muted mt-1 leading-relaxed">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification({ ...notification, show: false })}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-surface-2 dark:hover:bg-surface-2-dark text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark transition-all"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Progress bar */}
            <div className={`absolute bottom-0 left-0 h-1 animate-progress ${
              notification.type === 'success'
                ? 'bg-success'
                : notification.type === 'error'
                ? 'bg-danger'
                : 'bg-info'
            }`} style={{ width: '100%', animation: 'progress 5s linear' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CommanderDashboard;





