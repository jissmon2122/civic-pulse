import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, MapPin, ArrowRight, Layers, X } from 'lucide-react';
import { CivicMap, MapReportPin } from '../components/map/CivicMap';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityChip } from '../components/common/PriorityChip';
import { reportsApi, adminApi } from '../api';
import { Report, Category, ReportStatus, PriorityLevel } from '../types';
import { TAMIL_NADU_DISTRICTS, TAMIL_NADU_CENTER, TAMIL_NADU_DEFAULT_ZOOM } from '../utils/tamilNaduDistricts';

export const PublicExplorerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(searchParams.get('district') || '');
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>(
    searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined
  );
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | undefined>(
    (searchParams.get('status') as ReportStatus) || undefined
  );
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | undefined>(
    (searchParams.get('priority') as PriorityLevel) || undefined
  );

  const fetchReports = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await reportsApi.listPublicReports({
        search: searchTerm || undefined,
        category_id: selectedCatId,
        status: selectedStatus,
        priority_level: selectedPriority,
        ward_or_area: selectedDistrict || undefined,
        page_size: 50,
      });
      setReports(data);
    } catch {
      setErrorMessage('Unable to load reports. Please retry shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    adminApi.listCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedCatId, selectedStatus, selectedPriority, selectedDistrict]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDistrict('');
    setSelectedCatId(undefined);
    setSelectedStatus(undefined);
    setSelectedPriority(undefined);
    setSearchParams({});
  };

  const activeDistrict = TAMIL_NADU_DISTRICTS.find((d) => d.name === selectedDistrict);
  const mapCenter = activeDistrict ? activeDistrict.center : TAMIL_NADU_CENTER;
  const mapZoom = activeDistrict ? 11 : TAMIL_NADU_DEFAULT_ZOOM;

  // Convert reports into pins for CivicMap
  const mapPins: MapReportPin[] = reports.map((r) => ({
    id: r.id,
    public_reference: r.public_reference,
    title: r.title,
    category_name: r.category_name,
    latitude: r.latitude,
    longitude: r.longitude,
    status: r.status,
    priority_level: r.priority_level,
  }));

  const selectedReport = reports.find((r) => r.id === selectedReportId);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Title & Search Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary">
            Civic Issue Explorer
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Real-time public ledger of infrastructure and sanitation reports.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <Input
            placeholder="Search keywords, street, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Button type="submit" variant="primary" size="md">
            <Search size={16} />
          </Button>
        </form>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-text-secondary font-semibold flex items-center gap-1">
          <Filter size={13} /> Filters:
        </span>

        {/* Tamil Nadu 38 Districts Dropdown */}
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="bg-surface border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-primary focus:ring-1 focus:ring-primary font-medium"
        >
          <option value="">All 38 Districts (Tamil Nadu)</option>
          {TAMIL_NADU_DISTRICTS.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name} ({d.tamilName})
            </option>
          ))}
        </select>

        {/* Category Dropdown */}
        <select
          value={selectedCatId || ''}
          onChange={(e) => setSelectedCatId(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-surface border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          value={selectedStatus || ''}
          onChange={(e) => setSelectedStatus((e.target.value as ReportStatus) || undefined)}
          className="bg-surface border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        {/* Priority Dropdown */}
        <select
          value={selectedPriority || ''}
          onChange={(e) => setSelectedPriority((e.target.value as PriorityLevel) || undefined)}
          className="bg-surface border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {(selectedDistrict || selectedCatId || selectedStatus || selectedPriority || searchTerm) && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-status-critical hover:bg-status-critical-tint font-medium"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Main Map + Side Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Side: Interactive Leaflet Map (7 cols) */}
        <div className="lg:col-span-7 h-[420px] lg:h-[650px] sticky top-20">
          <CivicMap
            reports={mapPins}
            selectedReportId={selectedReportId}
            onSelectReport={(id) => setSelectedReportId(id)}
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
          />
        </div>

        {/* Right Side: Synchronized List Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-3 h-[650px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between pb-1 text-xs text-text-secondary">
            <span>{reports.length} Genuine Reports Found</span>
            <span>Sorted by Recent Submission</span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-status-critical-tint border border-status-critical/20 text-xs text-status-critical font-medium text-center">
              {errorMessage}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
              <p className="text-xs text-text-secondary mt-2">Loading civic complaints from database...</p>
            </div>
          ) : reports.length === 0 ? (
            <Card className="p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-text-primary">
                {selectedDistrict
                  ? `No complaints have been submitted yet in ${selectedDistrict}.`
                  : 'No complaints have been submitted yet.'}
              </p>
              <p className="text-xs text-text-secondary">
                Genuine citizen-submitted issues across Tamil Nadu will appear here in real time.
              </p>
              {(selectedDistrict || selectedCatId || selectedStatus || selectedPriority || searchTerm) && (
                <Button size="sm" variant="outline" onClick={handleClearFilters} className="mt-2">
                  Reset Filters
                </Button>
              )}
            </Card>
          ) : (
            reports.map((report) => {
              const isSelected = report.id === selectedReportId;
              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-primary-tint/30 border-primary ring-2 ring-primary/30 shadow-card'
                      : 'bg-surface border-border hover:border-primary/40 hover:shadow-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-text-secondary">
                      #{report.public_reference}
                    </span>
                    <StatusBadge status={report.status} size="sm" />
                  </div>

                  <h3 className="font-heading font-bold text-sm text-text-primary line-clamp-1">
                    {report.title}
                  </h3>

                  <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                    {report.description}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-text-secondary mt-2">
                    <MapPin size={12} className="text-primary flex-shrink-0" />
                    <span className="truncate">
                      {report.location_description || report.ward_or_area || 'Geographic coordinate'}
                    </span>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-border/50 flex items-center justify-between">
                    <PriorityChip level={report.priority_level} score={report.priority_score} />
                    <Link
                      to={`/reports/${report.id}`}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      View Journey <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
