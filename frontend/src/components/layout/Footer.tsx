import React from 'react';
import { Link } from 'react-router-dom';
import { PulseLogo } from '../illustrations/PulseLogo';
import { Shield, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-border mt-16 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand and Mission */}
          <div className="md:col-span-2 space-y-3">
            <PulseLogo size={28} />
            <p className="text-xs text-text-secondary leading-relaxed max-w-md">
              <strong>CIVIC PULSE</strong> is an AI-powered public-issue reporting, intelligence,
              prioritization, and resolution platform. Connecting citizens and municipal personnel
              through transparent, explainable decision-support systems.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-text-secondary pt-1">
              <Shield size={14} className="text-primary" />
              <span>Independent decision-support technology platform.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-text-primary">
              Civic Services
            </h4>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li>
                <Link to="/explorer" className="hover:text-primary transition-colors">
                  Public Issue Explorer
                </Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-primary transition-colors">
                  Submit a New Report
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-primary transition-colors">
                  Transparency & Analytics
                </Link>
              </li>
              <li>
                <Link to="/dev/styleguide" className="hover:text-primary transition-colors">
                  Design System Token Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology & Privacy */}
          <div className="space-y-2">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-text-primary">
              Technology & AI
            </h4>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-primary" />
                <span>TF-IDF NLP Classifier</span>
              </li>
              <li>Haversine Geodesic Clustering</li>
              <li>Explainable Multi-factor Scoring</li>
              <li>OpenStreetMap Leaflet Integration</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <p>&copy; {new Date().getFullYear()} CIVIC PULSE. Built for computer science & civic technology.</p>
          <p className="flex items-center gap-1 text-[11px]">
            Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline hover:text-primary">OpenStreetMap</a> contributors
          </p>
        </div>
      </div>
    </footer>
  );
};
