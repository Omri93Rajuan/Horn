import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { useAppSelector } from "../store/hooks";

interface TeamMember {
  id: string;
  username: string;
  email: string;
  areaId: string;
  role: string;
  createdAt: string;
  responseStats?: {
    totalResponses: number;
    okResponses: number;
    helpResponses: number;
    averageResponseTime: number; // in seconds
    lastResponseDate: string | null;
  };
}

const TeamScreen: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isCommander = user?.role === "COMMANDER";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Fetch team members
  const teamQuery = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const response = await api.get<TeamMember[]>("/users/team");
      return response.data;
    },
    enabled: isCommander,
  });

  // Filter team members
  const filteredMembers = useMemo(() => {
    if (!teamQuery.data) return [];
    
    let filtered = teamQuery.data.filter(m => m.role === "USER"); // Only soldiers
    
    // Search by name or email
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.username.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term)
      );
    }
    
    // Filter by area
    if (filterArea) {
      filtered = filtered.filter(m => m.areaId === filterArea);
    }
    
    return filtered.sort((a, b) => a.username.localeCompare(b.username));
  }, [teamQuery.data, searchTerm, filterArea]);

  // Calculate team statistics
  const teamStats = useMemo(() => {
    if (!teamQuery.data) return null;
    
    const soldiers = teamQuery.data.filter(m => m.role === "USER");
    const totalSoldiers = soldiers.length;
    const areas = new Set(soldiers.map(s => s.areaId));
    const activeLastWeek = soldiers.filter(s => {
      if (!s.responseStats?.lastResponseDate) return false;
      const lastResponse = new Date(s.responseStats.lastResponseDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastResponse >= weekAgo;
    }).length;
    
    return {
      totalSoldiers,
      totalAreas: areas.size,
      activeLastWeek,
      avgResponseTime: soldiers.reduce((acc, s) => 
        acc + (s.responseStats?.averageResponseTime || 0), 0
      ) / totalSoldiers || 0,
    };
  }, [teamQuery.data]);

  if (!isCommander) {
    return (
      <section className="space-y-8">
        <div className="card text-center p-12">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-text dark:text-text-dark mb-2">
            גישה מוגבלת
          </h2>
          <p className="text-text-muted dark:text-text-dark-muted">
            מסך זה זמין למפקדים בלבד
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-text dark:text-text-dark">
            הצוות שלי
          </h2>
          <p className="text-sm text-text-muted dark:text-text-dark-muted">
            ניהול וניטור כל החיילים במערכת
          </p>
        </div>
        <button
          type="button"
          onClick={() => teamQuery.refetch()}
          disabled={teamQuery.isFetching}
          className="action-btn ghost"
        >
          רענן
        </button>
      </div>

      {/* Statistics Cards */}
      {teamStats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {teamStats.totalSoldiers}
            </div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">
              סה"כ חיילים
            </div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-success mb-1">
              {teamStats.activeLastWeek}
            </div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">
              פעילים בשבוע
            </div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-warning mb-1">
              {teamStats.totalAreas}
            </div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">
              גזרות
            </div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-info mb-1">
              {Math.round(teamStats.avgResponseTime / 60)}
            </div>
            <div className="text-sm text-text-muted dark:text-text-dark-muted">
              דקות ממוצע תגובה
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Left - Search & List */}
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="card space-y-3">
            <input
              type="text"
              placeholder="חיפוש לפי שם או אימייל..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark text-sm"
            />
            
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark text-sm"
            >
              <option value="">כל הגזרות</option>
              {user?.commanderAreas.map(area => (
                <option key={area} value={area}>גזרה {area}</option>
              ))}
            </select>
            
            {(searchTerm || filterArea) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterArea("");
                }}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 dark:bg-surface-2-dark hover:bg-surface-3 dark:hover:bg-surface-3-dark text-sm"
              >
                נקה חיפוש
              </button>
            )}
            
            <div className="pt-2 text-xs text-text-muted dark:text-text-dark-muted text-center">
              {filteredMembers.length} חיילים
            </div>
          </div>

          {/* Members List */}
          <div className="card max-h-[600px] overflow-y-auto space-y-2">
            {teamQuery.isLoading ? (
              <p className="text-center text-text-muted dark:text-text-dark-muted p-8">טוען...</p>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center p-8">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-text-muted dark:text-text-dark-muted">
                  {searchTerm || filterArea ? "לא נמצאו חיילים" : "אין חיילים"}
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                    selectedMember?.id === member.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text dark:text-text-dark">
                        {member.username}
                      </div>
                      <div className="text-xs text-text-muted dark:text-text-dark-muted">
                        גזרה {member.areaId}
                      </div>
                    </div>
                    {member.responseStats && member.responseStats.totalResponses > 0 && (
                      <div className="text-xs px-2 py-1 rounded-full bg-success/20 text-success font-bold">
                        {member.responseStats.totalResponses}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right - Member Details */}
        <div className="card">
          {!selectedMember ? (
            <div className="text-center p-12">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-text dark:text-text-dark mb-2">
                בחר חייל
              </h3>
              <p className="text-sm text-text-muted dark:text-text-dark-muted">
                בחר חייל מהרשימה כדי לראות פרטים
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Member Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-border dark:border-border-dark">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center font-bold text-2xl text-primary">
                  {selectedMember.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text dark:text-text-dark">
                    {selectedMember.username}
                  </h3>
                  <p className="text-sm text-text-muted dark:text-text-dark-muted">
                    {selectedMember.email}
                  </p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-text dark:text-text-dark">פרטים כלליים</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-surface-2 dark:bg-surface-2-dark">
                    <div className="text-xs text-text-muted dark:text-text-dark-muted mb-1">
                      גזרה
                    </div>
                    <div className="font-bold text-text dark:text-text-dark">
                      {selectedMember.areaId}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-2 dark:bg-surface-2-dark">
                    <div className="text-xs text-text-muted dark:text-text-dark-muted mb-1">
                      תפקיד
                    </div>
                    <div className="font-bold text-text dark:text-text-dark">
                      {selectedMember.role === "USER" ? "חייל" : "מפקד"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Response Statistics */}
              {selectedMember.responseStats && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-text dark:text-text-dark">
                    סטטיסטיקות תגובות
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-success/10">
                      <div className="text-2xl font-bold text-success">
                        {selectedMember.responseStats.okResponses}
                      </div>
                      <div className="text-xs text-text-muted dark:text-text-dark-muted">
                        OK
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-danger/10">
                      <div className="text-2xl font-bold text-danger">
                        {selectedMember.responseStats.helpResponses}
                      </div>
                      <div className="text-xs text-text-muted dark:text-text-dark-muted">
                        עזרה
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-primary/10">
                      <div className="text-2xl font-bold text-primary">
                        {selectedMember.responseStats.totalResponses}
                      </div>
                      <div className="text-xs text-text-muted dark:text-text-dark-muted">
                        סה"כ
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-surface-2 dark:bg-surface-2-dark">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-text-muted dark:text-text-dark-muted">
                        זמן תגובה ממוצע
                      </span>
                      <span className="text-lg font-bold text-text dark:text-text-dark">
                        {Math.round(selectedMember.responseStats.averageResponseTime / 60)} דקות
                      </span>
                    </div>
                    {selectedMember.responseStats.lastResponseDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted dark:text-text-dark-muted">
                          תגובה אחרונה
                        </span>
                        <span className="text-sm font-medium text-text dark:text-text-dark">
                          {new Date(selectedMember.responseStats.lastResponseDate).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Member since */}
              <div className="pt-4 border-t border-border dark:border-border-dark">
                <div className="text-xs text-text-muted dark:text-text-dark-muted">
                  חבר מאז: {new Date(selectedMember.createdAt).toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TeamScreen;
