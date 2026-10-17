import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  PlayCircle,
  Upload,
  ArrowRight,
  User,
  Filter,
  Loader2,
  ChevronRight,
  Building2
} from 'lucide-react';
import { municipalApi } from '../../api';
import { MunicipalAssignment, PriorityLevel } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const MunicipalAssignmentsPage: React.FC = () => {
  const { user, isFieldWorker } = useAuth();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<MunicipalAssignment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await municipalApi.listAssignments({
        status: statusFilter || undefined,
      });
      setAssignments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter]);

  const getPriorityBadge = (level: PriorityLevel) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Work Assignments &amp; Field Tasks</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isFieldWorker
              ? 'Your assigned field tasks, work queues, deadlines, and repair progress logs.'
              : 'Department-wide repair crew dispatches, active work orders, and assignment monitoring.'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              statusFilter === 'ACTIVE'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              statusFilter === ''
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Work History
          </button>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading field work tasks from database...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-8 shadow-sm text-center text-red-600 text-xs">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          {error}
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No active assignments</h3>
          <p className="text-xs text-slate-500 mt-1">
            {isFieldWorker
              ? 'You have completed all assigned field tasks. Check back when new complaints are dispatched.'
              : 'No work orders currently match the selected status filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((task) => (
            <div
              key={task.id}
              onClick={() => navigate(`/municipal/complaints/${task.report_id}`)}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#0B2545]">{task.report_reference}</span>
                    {getPriorityBadge(task.priority_level)}
                    {task.is_overdue && (
                      <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        OVERDUE
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    task.status === 'ACTIVE' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {task.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors mt-2 line-clamp-1">
                  {task.report_title}
                </h3>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Department</span>
                    <span className="font-semibold text-slate-800">{task.department_name || 'General Dept'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Assigned Worker</span>
                    <span className="font-semibold text-slate-800">{task.staff_name || 'Crew Member'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Ward / Area</span>
                    <span className="text-slate-700">{task.ward_or_area || 'General Ward'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Target SLA Due Date</span>
                    <span className={`font-medium ${task.is_overdue ? 'text-red-700 font-bold' : 'text-slate-700'}`}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None Specified'}
                    </span>
                  </div>
                </div>

                {task.instructions && (
                  <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                    <span className="font-semibold text-slate-500 block text-[10px] mb-0.5">Instructions:</span>
                    <p className="line-clamp-2">{task.instructions}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Assigned: {task.assigned_at ? new Date(task.assigned_at).toLocaleDateString() : 'N/A'}
                </span>
                <span className="font-semibold text-teal-700 group-hover:text-teal-900 inline-flex items-center space-x-1">
                  <span>Open Task Details</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
