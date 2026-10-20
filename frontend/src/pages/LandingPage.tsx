import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Map,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Trash2,
  Droplets,
  Lightbulb,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { CitySkyline } from '../components/illustrations/DaylightIllustrations';
import { reportsApi, adminApi } from '../api';
import { Category, Report } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityChip } from '../components/common/PriorityChip';

export const LandingPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.listCategories()
      .then((data) => {
        setCategories(data);
        setCategoriesError(null);
      })
      .catch(() => {
        setCategoriesError('Unable to load complaint categories. Please try again.');
      });

    reportsApi.listPublicReports({ page: 1, page_size: 4 })
      .then((data) => {
        setRecentReports(data);
        setReportsError(null);
      })
      .catch(() => {
        setReportsError('Unable to load reports. Please retry shortly.');
      });
  }, []);

  const categoryIcons: Record<string, React.ReactNode> = {
    'Potholes and damaged roads': <AlertTriangle className="text-[#D98E04]" size={24} />,
    'Garbage and waste management': <Trash2 className="text-[#0E7C86]" size={24} />,
    'Drainage and sewage': <Droplets className="text-[#2F6FDE]" size={24} />,
    'Water supply and leakage': <Droplets className="text-[#0E7C86]" size={24} />,
    'Broken streetlights': <Lightbulb className="text-[#F5A524]" size={24} />,
    'Damaged public infrastructure': <Building2 className="text-[#7B8794]" size={24} />,
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF9F5] to-background pt-12 pb-6 border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-tint border border-primary/20 text-xs font-bold text-primary select-none">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>AI-Powered Municipal Intelligence Platform</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-text-primary tracking-tight leading-tight max-w-3xl mx-auto">
            A cleaner, safer city starts with a single{' '}
            <span className="text-primary underline decoration-accent/60 decoration-wavy decoration-2">
              Civic Pulse.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto font-normal leading-relaxed">
            Spotted a pothole, broken streetlight, or burst water line? Tell your city in 60 seconds.
            Transparent AI classification, duplicate detection, and live resolution tracking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/report">
              <Button size="lg" variant="primary" withPulse leftIcon={<PlusCircle size={18} />}>
                Report an Issue
              </Button>
            </Link>
            <Link to="/explorer">
              <Button size="lg" variant="outline" leftIcon={<Map size={18} />}>
                Explore the Map
              </Button>
            </Link>
          </div>

          {/* City Skyline Illustration */}
          <div className="pt-8 max-w-4xl mx-auto">
            <CitySkyline className="w-full h-auto text-primary" />
          </div>
        </div>
      </section>

      {/* How It Works (3 Clear Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="font-heading font-bold text-2xl text-text-primary">How Civic Pulse Works</h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            From your smartphone camera directly to verified municipal action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 relative text-left space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-tint text-primary font-heading font-bold text-lg flex items-center justify-center">
              1
            </div>
            <h3 className="font-heading font-bold text-base text-text-primary">
              1. Snap, Pin & Report in 60s
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Upload a photograph, tap to pin the exact spot on OpenStreetMap, and describe what is
              broken. Camera EXIF tracking data is stripped automatically for citizen privacy.
            </p>
          </Card>

          <Card className="p-6 relative text-left space-y-3 border-primary/40 bg-surface">
            <div className="w-12 h-12 rounded-2xl bg-accent-tint text-accent font-heading font-bold text-lg flex items-center justify-center">
              2
            </div>
            <h3 className="font-heading font-bold text-base text-text-primary">
              2. AI Triage & Deduplication
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Our TF-IDF model categorizes issues instantly and identifies duplicate complaints within
              150m. Multi-factor priority scoring escalates urgent safety hazards.
            </p>
          </Card>

          <Card className="p-6 relative text-left space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-status-resolved-tint text-status-resolved font-heading font-bold text-lg flex items-center justify-center">
              3
            </div>
            <h3 className="font-heading font-bold text-base text-text-primary">
              3. Package-Tracking Journey
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Watch your complaint move through Submitted &rarr; Reviewed &rarr; Assigned &rarr; In
              Progress &rarr; Resolved. If an issue is closed without proper repair, citizens can flag it
              unresolved.
            </p>
          </Card>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading font-bold text-xl text-text-primary">Civic Categories</h2>
            <p className="text-xs text-text-secondary">
              Directing reports to the correct municipal engineering units
            </p>
          </div>
          <Link to="/explorer" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            Browse all &rarr;
          </Link>
        </div>

        {categoriesError ? (
          <div className="p-4 rounded-xl bg-status-critical-tint border border-status-critical/20 text-xs text-status-critical font-medium text-center">
            {categoriesError}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/explorer?category_id=${cat.id}`}
                className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/50 hover:shadow-card transition-all duration-150 flex flex-col items-start gap-2.5 group"
              >
                <div className="p-2.5 rounded-xl bg-surface-subtle group-hover:scale-105 transition-transform">
                  {categoryIcons[cat.name] || <AlertTriangle className="text-primary" size={24} />}
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-text-primary group-hover:text-primary transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">
                    {cat.description || 'Public issue reports and maintenance'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Live Public Reports Preview */}
      {reportsError ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-4 rounded-xl bg-status-critical-tint border border-status-critical/20 text-xs text-status-critical font-medium text-center">
            {reportsError}
          </div>
        </section>
      ) : recentReports.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-bold text-xl text-text-primary">
                Recently Reported Issues
              </h2>
              <p className="text-xs text-text-secondary">
                Real complaints active on the public decision-support ledger
              </p>
            </div>
            <Link to="/explorer" className="text-xs font-semibold text-primary hover:underline">
              View on Map &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentReports.map((report) => (
              <Link key={report.id} to={`/reports/${report.id}`}>
                <Card variant="interactive" className="h-full flex flex-col justify-between p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-text-secondary">
                        #{report.public_reference}
                      </span>
                      <StatusBadge status={report.status} size="sm" />
                    </div>
                    <h4 className="font-heading font-bold text-xs text-text-primary line-clamp-2">
                      {report.title}
                    </h4>
                    <p className="text-[11px] text-text-secondary line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between mt-3">
                    <PriorityChip level={report.priority_level} score={report.priority_score} />
                    <span className="text-[10px] text-text-secondary font-medium">
                      {report.ward_or_area || 'Ward 42'}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Transparency and Decision Support Notice */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="p-6 bg-surface-subtle border border-border rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-primary-tint text-primary flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-text-primary">
              Civic Transparency & Academic Project Integrity
            </h4>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              CIVIC PULSE is an independent decision-support platform designed for public issue
              transparency and workflow intelligence. All metrics, predictions, and status milestones
              are derived strictly from authorized database records.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
