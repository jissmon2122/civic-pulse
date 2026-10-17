import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Building,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  History
} from 'lucide-react';
import { municipalApi } from '../../api';
import { MunicipalDashboardStats, AuditLogItem } from '../../types';

export const MunicipalAnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<MunicipalDashboardStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, logsData] = await Promise.all([
        municipalApi.getDashboard(),
        municipalApi.getAuditLogs({ limit: 25 }),
      ]);
      setStats(statsData);
      setAuditLogs(logsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load municipal analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCsv = () => {
    const url = municipalApi.getExportCsvUrl();
    window.open(url, '_blank');
  };

  if (isLoading && !stats) {
    return (
      <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Aggregating database analytics and workload metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 shadow-sm text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Analytics Unavailable</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-[#0B2545] text-white text-xs font-semibold rounded-lg hover:bg-[#134074]"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const resolutionRate = stats.total_complaints > 0
    ? Math.round((stats.resolved_complaints / stats.total_complaints) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Operational Statistics &amp; SLA Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time quantitative analytics computed directly from live municipal database records.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAnalytics}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-300" />
            <span>Download All Records (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Resolution Rate</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{resolutionRate}%</span>
            <span className="text-xs text-slate-500">of total intake</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-green-600 h-full rounded-full" style={{ width: `${resolutionRate}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved Cases</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-green-700">{stats.resolved_complaints}</span>
            <span className="text-xs text-slate-500">closed successfully</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Verified by municipal officers</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Workload</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-blue-900">
              {stats.assigned_complaints + stats.work_in_progress}
            </span>
            <span className="text-xs text-slate-500">in field / assigned</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Dispatched across repair teams</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Overdue Issues</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-red-700">{stats.overdue_complaints}</span>
            <span className="text-xs text-red-600 font-medium">SLA breach</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Exceeded 7-day default or custom SLA</p>
        </div>
      </div>

      {/* Row 1: Categories & Status Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <span>Complaints by Issue Category</span>
            <span className="text-xs font-normal text-slate-400">Total: {stats.total_complaints}</span>
          </h2>

          <div className="space-y-3">
            {stats.category_distribution.length > 0 ? (
              stats.category_distribution.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                    <span className="font-mono text-slate-500">{cat.count} ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: `${cat.percentage}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No category distribution data recorded.</p>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <span>Workflow Status Breakdown</span>
          </h2>

          <div className="space-y-3">
            {stats.status_distribution.length > 0 ? (
              stats.status_distribution.map((s) => {
                const pct = stats.total_complaints > 0
                  ? Math.round((s.count / stats.total_complaints) * 100)
                  : 0;
                return (
                  <div key={s.status} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold font-mono text-slate-800">{s.status}</span>
                      <span className="font-mono text-slate-500">{s.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No status data recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Department Workload Performance */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center space-x-2">
          <Building className="w-4 h-4 text-slate-600" />
          <span>Department Performance &amp; Caseload</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold uppercase">
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-center">Code</th>
                <th className="py-2.5 px-3 text-center">Active Workload</th>
                <th className="py-2.5 px-3 text-center">Resolved Cases</th>
                <th className="py-2.5 px-3 text-center">Department Total</th>
                <th className="py-2.5 px-3 text-center">Resolution %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.department_workload.map((d) => {
                const rate = d.total_count > 0 ? Math.round((d.resolved_count / d.total_count) * 100) : 0;
                return (
                  <tr key={d.department_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{d.department_name}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">{d.department_code}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        {d.active_count}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-800 font-bold border border-green-200">
                        {d.resolved_count}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">{d.total_count}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-teal-800">{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Municipal Audit Trail Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center space-x-2">
          <History className="w-4 h-4 text-purple-600" />
          <span>Recent Auditable Municipal Actions (Live Audit Trail)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold uppercase">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor / Officer</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {log.actor_name || 'System'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">{log.entity_type}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                      {log.entity_id || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No auditable events logged yet.
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
