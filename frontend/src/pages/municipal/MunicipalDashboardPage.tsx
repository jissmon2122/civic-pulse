import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Inbox,
  Clock,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  PlayCircle,
  FileCheck2,
  Calendar,
  Building,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { municipalApi } from '../../api';
import { MunicipalDashboardStats, MunicipalComplaint } from '../../types';

export const MunicipalDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<MunicipalDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await municipalApi.getDashboard();
      setStats(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load municipal operational statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getPriorityBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2 py-0.5 rounded border border-red-200">CRITICAL</span>;
      case 'HIGH':
        return <span className="bg-orange-100 text-orange-800 text-[11px] font-bold px-2 py-0.5 rounded border border-orange-200">HIGH</span>;
      case 'MEDIUM':
        return <span className="bg-yellow-100 text-yellow-800 text-[11px] font-semibold px-2 py-0.5 rounded border border-yellow-200">MEDIUM</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded border border-slate-200">LOW</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-full font-medium">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2 py-0.5 rounded-full font-medium">Under Review</span>;
      case 'VERIFIED':
        return <span className="bg-teal-50 text-teal-800 border border-teal-200 text-xs px-2 py-0.5 rounded-full font-medium">Verified</span>;
      case 'ASSIGNED':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-medium">Assigned</span>;
      case 'IN_PROGRESS':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2 py-0.5 rounded-full font-medium">In Progress</span>;
      case 'RESOLUTION_SUBMITTED':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-semibold">Evidence Uploaded</span>;
      case 'RESOLVED':
        return <span className="bg-green-100 text-green-800 border border-green-200 text-xs px-2 py-0.5 rounded-full font-semibold">Resolved</span>;
      case 'REJECTED':
        return <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2 py-0.5 rounded-full font-medium">Rejected</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2 py-0.5 rounded-full font-medium">{status}</span>;
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200 shadow-sm p-12">
        <Loader2 className="w-9 h-9 text-teal-600 animate-spin mb-3" />
        <h3 className="text-base font-semibold text-slate-900">Loading Municipal Dashboard</h3>
        <p className="text-xs text-slate-500 mt-1">Aggregating real-time complaint records and workload statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 shadow-sm text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Unable to load dashboard data</h3>
        <p className="text-sm text-slate-600 mt-1 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-[#0B2545] text-white text-xs font-semibold rounded-lg hover:bg-[#134074] transition-colors inline-flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Municipal Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time public complaint intake, verification, assignments, and resolution tracking.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[11px] text-slate-400">
            Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 flex items-center space-x-1.5"
            title="Refresh statistics from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 8 Primary Statistic Cards with Direct Navigation Filtering */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Complaints */}
        <div
          onClick={() => navigate('/municipal/complaints')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Complaints</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-[#0B2545] group-hover:text-white transition-colors">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">{stats?.total_complaints || 0}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center">
              <span>All recorded complaints</span>
              <ChevronRight className="w-3 h-3 ml-1 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 2: New Complaints */}
        <div
          onClick={() => navigate('/municipal/complaints?status=SUBMITTED')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">New Complaints</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-blue-900">{stats?.new_complaints || 0}</div>
            <div className="text-[11px] text-blue-600 mt-0.5 flex items-center font-medium">
              <span>Awaiting initial intake</span>
              <ChevronRight className="w-3 h-3 ml-1 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 3: Awaiting Verification */}
        <div
          onClick={() => navigate('/municipal/complaints?status=UNDER_REVIEW')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Awaiting Verification</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-indigo-900">{stats?.awaiting_verification || 0}</div>
            <div className="text-[11px] text-indigo-600 mt-0.5 flex items-center font-medium">
              <span>Officer inspection queue</span>
              <ChevronRight className="w-3 h-3 ml-1 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 4: Verified Complaints */}
        <div
          onClick={() => navigate('/municipal/complaints?status=VERIFIED')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-300 shadow-sm hover:shadow cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Verified Issues</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-teal-900">{stats?.verified_complaints || 0}</div>
            <div className="text-[11px] text-teal-600 mt-0.5 flex items-center font-medium">
              <span>Ready for assignment</span>
              <ChevronRight className="w-3 h-3 ml-1 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 5: Assigned Complaints */}
        <div
          onClick={() => navigate('/municipal/complaints?status=ASSIGNED')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-300 shadow-sm hover:shadow cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Assigned to Teams</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-700 group-hover:text-white transition-colors">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-900">{stats?.assigned_complaints || 0}</div>
            <div className="text-[11px] text-amber-700 mt-0.5 flex items-center font-medium">
              <span>Dispatched to crews</span>
              <ChevronRight className="w-3 h-3 ml-1 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 6: Work In Progress */}
        <div
          onClick={() => navigate('/municipal/complaints?status=IN_PROGRESS')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Work In Progress</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-purple-900">{stats?.work_in_progress || 0}</div>
            <div className="text-[11px] text-purple-700 mt-0.5 flex items-center font-medium">
              <span>Field work active</span>
              <ChevronRight className="w-3 h-3 ml-1 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 7: Resolved Complaints */}
        <div
          onClick={() => navigate('/municipal/complaints?status=RESOLVED')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-green-300 shadow-sm hover:shadow cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center group-hover:bg-green-700 group-hover:text-white transition-colors">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-green-900">{stats?.resolved_complaints || 0}</div>
            <div className="text-[11px] text-green-700 mt-0.5 flex items-center font-medium">
              <span>Completed &amp; verified</span>
              <ChevronRight className="w-3 h-3 ml-1 text-green-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 8: Overdue Complaints */}
        <div
          onClick={() => navigate('/municipal/complaints?is_overdue=true')}
          className="bg-white p-4 rounded-xl border border-red-200 hover:border-red-400 shadow-sm hover:shadow cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Overdue Issues</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-red-900">{stats?.overdue_complaints || 0}</div>
            <div className="text-[11px] text-red-600 mt-0.5 flex items-center font-medium">
              <span>SLA deadline exceeded</span>
              <ChevronRight className="w-3 h-3 ml-1 text-red-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: High Priority Issues & Overdue Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Priority Critical Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">High-Priority Attention Queue</h2>
            </div>
            <Link
              to="/municipal/complaints?priority_level=CRITICAL"
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100 flex-1">
            {stats?.high_priority_issues && stats.high_priority_issues.length > 0 ? (
              stats.high_priority_issues.map((issue) => (
                <div key={issue.id} className="py-3 flex items-start justify-between gap-3 group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-[#0B2545]">{issue.public_reference}</span>
                      {getPriorityBadge(issue.priority_level)}
                      {getStatusBadge(issue.status)}
                    </div>
                    <Link
                      to={`/municipal/complaints/${issue.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-teal-700 block mt-1 line-clamp-1 transition-colors"
                    >
                      {issue.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                      <span>{issue.ward_or_area || 'General Ward'}</span>
                      <span>•</span>
                      <span>{issue.category_name}</span>
                    </div>
                  </div>
                  <Link
                    to={`/municipal/complaints/${issue.id}`}
                    className="p-1.5 text-slate-400 group-hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                No unassigned critical issues in the backlog.
              </div>
            )}
          </div>
        </div>

        {/* Overdue Assignments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Overdue &amp; Delayed Issues</h2>
            </div>
            <Link
              to="/municipal/complaints?is_overdue=true"
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100 flex-1">
            {stats?.overdue_assignments && stats.overdue_assignments.length > 0 ? (
              stats.overdue_assignments.map((comp) => (
                <div key={comp.id} className="py-3 flex items-start justify-between gap-3 group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-[#0B2545]">{comp.public_reference}</span>
                      <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded">OVERDUE</span>
                      {getStatusBadge(comp.status)}
                    </div>
                    <Link
                      to={`/municipal/complaints/${comp.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-teal-700 block mt-1 line-clamp-1 transition-colors"
                    >
                      {comp.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                      <span>Assigned: {comp.assignee_name || 'Unassigned'}</span>
                      <span>•</span>
                      <span>Due: {comp.due_date ? new Date(comp.due_date).toLocaleDateString() : 'No Target Date'}</span>
                    </div>
                  </div>
                  <Link
                    to={`/municipal/complaints/${comp.id}`}
                    className="p-1.5 text-slate-400 group-hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                No assignments currently exceeding resolution deadlines.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row: Department Workload & 14-Day Activity Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <Building className="w-4 h-4 text-slate-600" />
              <span>Department Workload &amp; Capacity</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-center">Active Cases</th>
                  <th className="py-2.5 px-3 text-center">Resolved</th>
                  <th className="py-2.5 px-3 text-center">Total Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.department_workload && stats.department_workload.length > 0 ? (
                  stats.department_workload.map((dept) => (
                    <tr
                      key={dept.department_id}
                      onClick={() => navigate(`/municipal/complaints?department_id=${dept.department_id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{dept.department_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{dept.department_code}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                          {dept.active_count}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-green-50 text-green-800 font-bold border border-green-200">
                          {dept.resolved_count}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {dept.total_count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      No department workloads recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 14-Day Inflow vs Resolution Trend */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>14-Day Activity Trend</span>
              </h2>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center space-x-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
                  <span>Submitted</span>
                </span>
                <span className="flex items-center space-x-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded bg-green-500 inline-block" />
                  <span>Resolved</span>
                </span>
              </div>
            </div>

            {/* Daily timeline bar chart */}
            <div className="space-y-2 mt-4">
              {stats?.daily_trend && stats.daily_trend.length > 0 ? (
                stats.daily_trend.slice(-7).map((day) => {
                  const maxVal = Math.max(...stats.daily_trend.map(d => Math.max(d.submitted, d.resolved, 1)));
                  const subPct = Math.min(100, Math.round((day.submitted / maxVal) * 100));
                  const resPct = Math.min(100, Math.round((day.resolved / maxVal) * 100));
                  return (
                    <div key={day.date} className="flex items-center text-xs gap-3">
                      <span className="w-14 text-slate-500 font-medium shrink-0">{day.date}</span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 rounded bg-blue-500" style={{ width: `${Math.max(subPct, 4)}%` }} />
                          <span className="text-[10px] text-slate-400 font-mono">{day.submitted}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 rounded bg-green-500" style={{ width: `${Math.max(resPct, 4)}%` }} />
                          <span className="text-[10px] text-slate-400 font-mono">{day.resolved}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No activity history within the last 14 days.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated from real municipal database records</span>
            <Link to="/municipal/analytics" className="font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center">
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Complaints Intake Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Recent Citizen Complaints Intake
          </h2>
          <Link
            to="/municipal/complaints"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
          >
            <span>Open Complaint Management</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Title &amp; Category</th>
                <th className="py-2.5 px-3">Ward / Area</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Reported</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recent_complaints && stats.recent_complaints.length > 0 ? (
                stats.recent_complaints.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0B2545]">
                      {comp.public_reference}
                    </td>
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 truncate">{comp.title}</div>
                      <div className="text-[11px] text-slate-400">{comp.category_name}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {comp.ward_or_area || 'General Ward'}
                    </td>
                    <td className="py-2.5 px-3">
                      {getStatusBadge(comp.status)}
                    </td>
                    <td className="py-2.5 px-3">
                      {getPriorityBadge(comp.priority_level)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(comp.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/municipal/complaints/${comp.id}`}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center space-x-0.5"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No complaints registered in the system yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
