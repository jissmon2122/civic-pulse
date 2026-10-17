import React, { useState } from 'react';
import {
  Palette,
  Type,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityChip } from '../components/common/PriorityChip';
import { StatusTimeline } from '../components/common/StatusTimeline';
import { PulseLogo } from '../components/illustrations/PulseLogo';
import {
  CitySkyline,
  RoadIllustration,
  StreetlightIllustration,
  WaterTapIllustration,
  BinIllustration,
  EmptyIllustration,
} from '../components/illustrations/DaylightIllustrations';
import { ReportStatus, PriorityLevel } from '../types';

export const DevStyleguidePage: React.FC = () => {
  const [testInput, setTestInput] = useState('');
  const [selectedDemoStatus, setSelectedDemoStatus] = useState<ReportStatus>('IN_PROGRESS');

  const colorTokens = [
    { name: 'Background', hex: '#FAFAF7', desc: 'Warm off-white base layer' },
    { name: 'Surface / Card', hex: '#FFFFFF', desc: 'Card containers and popups' },
    { name: 'Subtle Surface', hex: '#F3F1EA', desc: 'Secondary panels & inputs' },
    { name: 'Border', hex: '#E8E6DF', desc: '1px clean container dividers' },
    { name: 'Text Primary', hex: '#1F2933', desc: 'High contrast readable copy' },
    { name: 'Text Secondary', hex: '#52606D', desc: 'Subheadings and metadata' },
    { name: 'Primary (Sky Teal)', hex: '#0E7C86', desc: 'Main interactive brand color' },
    { name: 'Primary Tint', hex: '#E3F4F5', desc: 'Soft badge background variant' },
    { name: 'Sunrise Accent', hex: '#F5A524', desc: 'Pulse highlights & urgent CTAs' },
    { name: 'Success (Resolved)', hex: '#2E8B57', desc: 'Verified public fixes' },
    { name: 'Info (In Progress)', hex: '#2F6FDE', desc: 'Under review / in progress' },
    { name: 'Warning (Review)', hex: '#D98E04', desc: 'Triage / needs clarification' },
    { name: 'Danger (Critical)', hex: '#D64545', desc: 'Life safety hazards' },
    { name: 'Neutral (Closed)', hex: '#7B8794', desc: 'Formally closed / declined' },
  ];

  const allStatuses: ReportStatus[] = [
    'SUBMITTED',
    'UNDER_REVIEW',
    'ASSIGNED',
    'IN_PROGRESS',
    'NEEDS_INFORMATION',
    'RESOLVED',
    'CLOSED',
    'REOPENED',
    'REJECTED',
  ];

  const allPriorities: PriorityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-12">
      {/* Styleguide Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-tint text-primary text-xs font-bold uppercase mb-2">
          <Palette size={13} />
          <span>Design System Reference</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-text-primary">
          "Daylight Civic" Design Tokens
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Single bright day theme specifications, typography scale, shared UI components, and WCAG AA contrast rules.
        </p>
      </div>

      {/* 1. Color Palette Tokens */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
          <Palette size={18} className="text-primary" />
          <span>1. Color Tokens & Palette</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {colorTokens.map((c) => (
            <Card key={c.name} className="p-3 space-y-2">
              <div
                className="w-full h-12 rounded-xl border border-border/80 shadow-subtle"
                style={{ backgroundColor: c.hex }}
              />
              <div>
                <p className="font-bold text-xs text-text-primary truncate">{c.name}</p>
                <p className="font-mono text-[11px] text-text-secondary">{c.hex}</p>
                <p className="text-[10px] text-text-secondary/80 mt-1 line-clamp-2">{c.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Brand Identity & The Pulse Motif */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <span>2. Brand Identity & "The Pulse"</span>
        </h2>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-2">
              <p className="text-xs font-bold text-text-secondary uppercase">Full Wordmark</p>
              <PulseLogo size={36} showText={true} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-text-secondary uppercase">Icon Only</p>
              <PulseLogo size={36} showText={false} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-text-secondary uppercase">Pulse Ripple Button</p>
              <Button variant="primary" withPulse leftIcon={<PlusCircle size={16} />}>
                Live Ripple Button
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Status Badges & Priority Chips */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
          <CheckCircle2 size={18} className="text-primary" />
          <span>3. Status Badges & Explainable Priority Chips</span>
        </h2>
        <Card className="p-6 space-y-6">
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase mb-3">
              All 9 State Machine Badges (Icon + Label + WCAG AA Contrast)
            </p>
            <div className="flex flex-wrap gap-2.5">
              {allStatuses.map((st) => (
                <StatusBadge key={st} status={st} />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs font-bold text-text-secondary uppercase mb-3">
              Explainable Priority Chips (Click to test factor popover)
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              {allPriorities.map((pr) => (
                <PriorityChip
                  key={pr}
                  level={pr}
                  score={pr === 'CRITICAL' ? 88 : pr === 'HIGH' ? 68 : pr === 'MEDIUM' ? 44 : 20}
                  explanation="High reported infrastructure damage | Unresolved for > 48 hrs | School zone"
                />
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Buttons & Interactive States */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
          <Layers size={18} className="text-primary" />
          <span>4. Buttons & Controls</span>
        </h2>
        <Card className="p-6">
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Tint</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="accent">Sunrise Accent</Button>
            <Button variant="danger">Critical Danger</Button>
            <Button variant="ghost">Ghost Link</Button>
            <Button variant="primary" isLoading>
              Loading
            </Button>
          </div>
        </Card>
      </section>

      {/* 5. Package-Tracking Journey Stepper */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          <span>5. Package-Tracking Status Journey</span>
        </h2>
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-text-secondary">Simulate Status:</span>
            <select
              value={selectedDemoStatus}
              onChange={(e) => setSelectedDemoStatus(e.target.value as ReportStatus)}
              className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-text-primary"
            >
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REOPENED">Reopened</option>
            </select>
          </div>
          <StatusTimeline
            currentStatus={selectedDemoStatus}
            createdAt={new Date().toISOString()}
            updatedAt={new Date().toISOString()}
          />
        </Card>
      </section>

      {/* 6. Hand-Drawn SVG Illustrations */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <span>6. Hand-Drawn SVG Repository Assets</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <Card className="p-4 flex flex-col items-center text-center space-y-2">
            <RoadIllustration className="w-16 h-16" />
            <span className="text-xs font-bold text-text-primary">Roads & Potholes</span>
          </Card>
          <Card className="p-4 flex flex-col items-center text-center space-y-2">
            <StreetlightIllustration className="w-16 h-16" />
            <span className="text-xs font-bold text-text-primary">Streetlights</span>
          </Card>
          <Card className="p-4 flex flex-col items-center text-center space-y-2">
            <WaterTapIllustration className="w-16 h-16" />
            <span className="text-xs font-bold text-text-primary">Water & Leakage</span>
          </Card>
          <Card className="p-4 flex flex-col items-center text-center space-y-2">
            <BinIllustration className="w-16 h-16" />
            <span className="text-xs font-bold text-text-primary">Garbage & Waste</span>
          </Card>
          <Card className="p-4 flex flex-col items-center text-center space-y-2 col-span-2 sm:col-span-1">
            <EmptyIllustration className="w-20 h-20" message="Empty state" />
          </Card>
        </div>
      </section>
    </div>
  );
};
