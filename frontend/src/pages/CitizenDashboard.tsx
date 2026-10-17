import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, Wrench, CheckCircle2, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityChip } from '../components/common/PriorityChip';
import { EmptyIllustration } from '../components/illustrations/DaylightIllustrations';
import { reportsApi } from '../api';
import { Report } from '../types';
import { useAuth } from '../context/AuthContext';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    reportsApi
      .getMyReports()
      .then((reports) => setMyReports(reports))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const totalCount = myReports.length;
  const inProgressCount = myReports.filter((r) =>
    ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(r.status)
  ).length;
  const resolvedCount = myReports.filter((r) => ['RESOLVED', 'CLOSED'].includes(r.status)).length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary">
            Citizen Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Welcome back, <span className="font-semibold text-text-primary">{user?.name}</span>. Here
            is your civic activity overview.
          </p>
        </div>
        <Link to="/report">
          <Button variant="primary" withPulse leftIcon={<PlusCircle size={16} />}>
            Report New Issue
          </Button>
        </Link>
      </div>

      {/* Friendly Dashboard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Total Reported
            </p>
            <p className="font-heading font-extrabold text-3xl text-text-primary mt-1">{totalCount}</p>
            <p className="text-[11px] text-text-secondary mt-1">Complaints filed by you</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-tint text-primary flex items-center justify-center">
            <Clock size={24} />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Active / In Progress
            </p>
            <p className="font-heading font-extrabold text-3xl text-status-in_progress mt-1">
              {inProgressCount}
            </p>
            <p className="text-[11px] text-text-secondary mt-1">Assigned or under repair</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-status-in_progress-tint text-status-in_progress flex items-center justify-center">
            <Wrench size={24} />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Resolved & Closed
            </p>
            <p className="font-heading font-extrabold text-3xl text-status-resolved mt-1">
              {resolvedCount}
            </p>
            <p className="text-[11px] text-text-secondary mt-1">Verified community fixes</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-status-resolved-tint text-status-resolved flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </Card>
      </div>

      {/* My Reports List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-text-primary">Your Submissions</h2>
          <span className="text-xs text-text-secondary">
            Showing {myReports.length} {myReports.length === 1 ? 'report' : 'reports'}
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
            <p className="text-xs text-text-secondary mt-3">Loading your reports...</p>
          </div>
        ) : myReports.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyIllustration message="You haven't reported any civic issues yet. Notice anything broken in your neighborhood?" />
              <div className="text-center mt-4">
                <Link to="/report">
                  <Button variant="primary" size="sm" leftIcon={<PlusCircle size={15} />}>
                    Submit Your First Report
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myReports.map((report) => (
              <Link key={report.id} to={`/reports/${report.id}`}>
                <Card variant="interactive" className="p-5 h-full flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-text-secondary">
                        #{report.public_reference}
                      </span>
                      <StatusBadge status={report.status} size="sm" />
                    </div>

                    <h3 className="font-heading font-bold text-sm text-text-primary line-clamp-1">
                      {report.title}
                    </h3>

                    <p className="text-xs text-text-secondary line-clamp-2">
                      {report.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <MapPin size={13} className="text-primary flex-shrink-0" />
                      <span className="truncate">
                        {report.location_description || report.ward_or_area || 'Geographic location pinned'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between mt-4">
                    <PriorityChip level={report.priority_level} score={report.priority_score} />
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      Details <ArrowRight size={13} />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
