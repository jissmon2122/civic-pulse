import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  Loader2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { municipalApi, categoriesApi } from '../../api';
import { MunicipalComplaint, Department, Category, ReportStatus, PriorityLevel } from '../../types';
import { TAMIL_NADU_DISTRICTS } from '../../utils/tamilNaduDistricts';

export const MunicipalComplaintsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<MunicipalComplaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states initialized from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category_id') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority_level') || '');
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('department_id') || '');
  const [districtFilter, setDistrictFilter] = useState(searchParams.get('district') || '');
  const [isOverdueFilter, setIsOverdueFilter] = useState(searchParams.get('is_overdue') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'priority');
  const [sortDir, setSortDir] = useState(searchParams.get('sort_dir') || 'desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Load auxiliary data (departments & categories)
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [depts, cats] = await Promise.all([
          municipalApi.listDepartments(),
          categoriesApi.list(),
        ]);
        setDepartments(depts);
        setCategories(cats);
      } catch (e) {
        console.error('Failed to load filter metadata', e);
      }
    };
    loadMetadata();
  }, []);

  // Sync state when URL search params change
  useEffect(() => {
    setStatusFilter(searchParams.get('status') || '');
    setPriorityFilter(searchParams.get('priority_level') || '');
    setDepartmentFilter(searchParams.get('department_id') || '');
    setDistrictFilter(searchParams.get('district') || '');
    setIsOverdueFilter(searchParams.get('is_overdue') === 'true');
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Load complaints
  const fetchComplaints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await municipalApi.listComplaints({
        search: searchTerm || undefined,
        status: (statusFilter as ReportStatus) || undefined,
        category_id: categoryFilter ? Number(categoryFilter) : undefined,
        priority_level: (priorityFilter as PriorityLevel) || undefined,
        department_id: departmentFilter ? Number(departmentFilter) : undefined,
        ward_or_area: districtFilter || undefined,
        is_overdue: isOverdueFilter ? true : undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        page: currentPage,
        page_size: pageSize,
      });
      setComplaints(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve municipal complaints');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter, priorityFilter, departmentFilter, districtFilter, isOverdueFilter, sortBy, sortDir, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchComplaints();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setPriorityFilter('');
    setDepartmentFilter('');
    setDistrictFilter('');
    setIsOverdueFilter(false);
    setSortBy('priority');
    setSortDir('desc');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleExportCsv = () => {
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category_id = categoryFilter;
    if (priorityFilter) params.priority_level = priorityFilter;
    if (departmentFilter) params.department_id = departmentFilter;
    if (districtFilter) params.ward_or_area = districtFilter;
    if (isOverdueFilter) params.is_overdue = 'true';
    if (searchTerm) params.search = searchTerm;

    const url = municipalApi.getExportCsvUrl(params);
    window.open(url, '_blank');
  };

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
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-medium">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-medium">Under Review</span>;
      case 'VERIFIED':
        return <span className="bg-teal-50 text-teal-800 border border-teal-200 text-xs px-2.5 py-0.5 rounded-full font-medium">Verified</span>;
      case 'ASSIGNED':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-medium">Assigned</span>;
      case 'IN_PROGRESS':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2.5 py-0.5 rounded-full font-medium">In Progress</span>;
      case 'RESOLUTION_SUBMITTED':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">Evidence Uploaded</span>;
      case 'RESOLVED':
        return <span className="bg-green-100 text-green-800 border border-green-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">Resolved</span>;
      case 'REJECTED':
        return <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-medium">Rejected</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-0.5 rounded-full font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Complaint Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, inspect, verify, assign, and track civic issues logged across all municipal jurisdictions.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-300 shadow-sm flex items-center space-x-2"
            title="Export filtered records to sanitized CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, keyword, description, or ward..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50 focus:bg-white text-slate-900"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#0B2545] text-white text-xs font-semibold rounded-lg hover:bg-[#134074] transition-colors"
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-2 border-t border-slate-100">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="VERIFIED">Verified</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLUTION_SUBMITTED">Evidence Uploaded</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* TN District Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">TN District</label>
            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All 38 Districts</option>
              {TAMIL_NADU_DISTRICTS.map((dist) => (
                <option key={dist.name} value={dist.name}>
                  {dist.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Sort By</label>
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [sb, sd] = e.target.value.split('-');
                setSortBy(sb);
                setSortDir(sd);
              }}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="priority-desc">Priority: High to Low</option>
              <option value="date-desc">Submission: Newest First</option>
              <option value="date-asc">Submission: Oldest First</option>
              <option value="due_date-asc">Target Due Date</option>
            </select>
          </div>

          {/* Overdue Checkbox & Reset */}
          <div className="flex flex-col justify-end">
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                id="isOverdue"
                checked={isOverdueFilter}
                onChange={(e) => {
                  setIsOverdueFilter(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <label htmlFor="isOverdue" className="text-xs font-semibold text-red-700 cursor-pointer">
                Overdue Only
              </label>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-medium flex items-center justify-center space-x-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-900">{complaints.length}</strong> complaints matching criteria
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-2" />
            <p className="text-xs text-slate-500">Loading complaints from database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            {error}
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No complaints have been submitted yet.</p>
            <p className="text-xs text-slate-500 mt-1">Live complaints submitted by citizens across Tamil Nadu will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Title &amp; Category</th>
                  <th className="py-3 px-4">Location / Ward</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Department &amp; Worker</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((comp) => (
                  <tr
                    key={comp.id}
                    onClick={() => navigate(`/municipal/complaints/${comp.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#0B2545] whitespace-nowrap">
                      {comp.public_reference}
                      {comp.is_overdue && (
                        <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-red-500" title="Overdue Issue" />
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900 truncate">{comp.title}</div>
                      <div className="text-[11px] text-slate-500">{comp.category_name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <div>{comp.ward_or_area || 'General Ward'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{comp.location_description || `${comp.latitude.toFixed(4)}, ${comp.longitude.toFixed(4)}`}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(comp.status)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getPriorityBadge(comp.priority_level)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{comp.department_name || 'Unassigned Dept'}</div>
                      <div className="text-[11px] text-slate-400">{comp.assignee_name || 'No crew assigned'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(comp.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/municipal/complaints/${comp.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-[#0B2545] hover:text-white text-slate-700 rounded text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
