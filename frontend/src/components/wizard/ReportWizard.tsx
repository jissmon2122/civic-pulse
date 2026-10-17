import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  MapPin,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';
import { MapPicker } from '../map/MapPicker';
import { reportsApi, aiApi, adminApi } from '../../api';
import { Category, ClassifyResult, DuplicateCandidate } from '../../types';

export const ReportWizard: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Step (1: Photo, 2: Location, 3: Details)
  const [step, setStep] = useState<number>(1);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);

  // Form State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number>(12.9716);
  const [longitude, setLongitude] = useState<number>(77.5946);
  const [locationDescription, setLocationDescription] = useState<string>('');
  const [ward, setWard] = useState<string>('Ward 42 - Central');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);

  // AI Classification & Duplicate Signals
  const [aiSuggestion, setAiSuggestion] = useState<ClassifyResult | null>(null);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .listCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setSelectedCategoryId(cats[0].id);
      })
      .catch(() => {});
  }, []);

  // Debounced AI classification when title or description changes
  useEffect(() => {
    if (title.length < 5 && description.length < 10) return;

    const timer = setTimeout(async () => {
      setIsClassifying(true);
      try {
        const result = await aiApi.classify(title, description);
        setAiSuggestion(result);
        // Find matching category ID
        const matched = categories.find(
          (c) => c.name.toLowerCase() === result.suggested_category.toLowerCase()
        );
        if (matched) {
          setSelectedCategoryId(matched.id);
        }
      } catch {
        // Fallback silently if offline
      } finally {
        setIsClassifying(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description, categories]);

  // Check for duplicate issues near this coordinate
  useEffect(() => {
    if (!latitude || !longitude || description.length < 5) return;

    const timer = setTimeout(async () => {
      setIsCheckingDuplicates(true);
      try {
        const dupRes = await aiApi.checkDuplicates({
          title,
          description,
          latitude,
          longitude,
          category_id: selectedCategoryId,
          radius_meters: 150,
        });
        setDuplicateCandidates(dupRes.duplicate_matches);
      } catch {
        // Fallback silently
      } finally {
        setIsCheckingDuplicates(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [latitude, longitude, title, description, selectedCategoryId]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Photo exceeds maximum allowed limit of 5MB.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setSubmitError('Please provide both a title and description of the issue.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await reportsApi.createReport({
        title: title.trim(),
        description: description.trim(),
        category_id: selectedCategoryId,
        latitude,
        longitude,
        location_description: locationDescription.trim() || undefined,
        ward_or_area: ward || undefined,
        ai_suggested_category: aiSuggestion?.suggested_category,
        ai_confidence: aiSuggestion?.confidence,
      });

      // Upload photo if present
      if (photoFile) {
        try {
          await reportsApi.uploadImage(created.id, photoFile);
        } catch {
          // Report is still created even if photo upload hits an issue
        }
      }

      navigate(`/reports/${created.id}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Wizard Header with Progress Indicator */}
      <div className="mb-6 text-center">
        <h1 className="font-heading font-extrabold text-2xl text-text-primary tracking-tight">
          Report a Civic Issue
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Spotted something that needs fixing? Tell your city in 60 seconds.
        </p>

        {/* 3 Step Pill Indicator */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold select-none transition-colors ${
              step >= 1 ? 'bg-primary text-white' : 'bg-surface-subtle text-text-secondary'
            }`}
          >
            <Camera size={14} />
            <span>1. Photo</span>
          </div>
          <div className="w-4 h-0.5 bg-border" />
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold select-none transition-colors ${
              step >= 2 ? 'bg-primary text-white' : 'bg-surface-subtle text-text-secondary'
            }`}
          >
            <MapPin size={14} />
            <span>2. Location</span>
          </div>
          <div className="w-4 h-0.5 bg-border" />
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold select-none transition-colors ${
              step >= 3 ? 'bg-primary text-white' : 'bg-surface-subtle text-text-secondary'
            }`}
          >
            <FileText size={14} />
            <span>3. Details</span>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {submitError && (
            <div className="mb-4 p-3 bg-status-critical-tint border border-status-critical/20 rounded-xl flex items-center gap-2 text-xs text-status-critical font-medium">
              <AlertTriangle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 1: PHOTO UPLOAD */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <h3 className="font-heading font-bold text-base text-text-primary">
                  Upload an on-site photo
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Clear photos help municipal field inspectors evaluate damage immediately.
                </p>
              </div>

              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-border shadow-subtle group">
                  <img
                    src={photoPreview}
                    alt="Uploaded civic issue"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-[#1F2933]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-text-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-surface-subtle">
                      Change Photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border hover:border-primary/50 bg-[#FAFAF8] hover:bg-primary-tint/20 rounded-2xl cursor-pointer transition-colors text-center group">
                  <div className="w-14 h-14 rounded-full bg-primary-tint flex items-center justify-center text-primary group-hover:scale-105 transition-transform mb-3">
                    <Upload size={24} />
                  </div>
                  <span className="font-semibold text-sm text-text-primary">
                    Tap or drag photo here
                  </span>
                  <span className="text-xs text-text-secondary mt-1">
                    Supports JPEG, PNG, or WEBP up to 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}

              {/* Privacy protection notice */}
              <div className="p-3 bg-surface-subtle border border-border/80 rounded-xl flex items-start gap-2.5 text-xs text-text-secondary">
                <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy Notice:</strong> All uploaded photos are automatically stripped of
                  camera EXIF and GPS tracking metadata before public display.
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-medium text-text-secondary hover:text-text-primary"
                >
                  Skip photo for now &rarr;
                </button>
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Next: Pin Location
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: MAP LOCATION */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading font-bold text-base text-text-primary">
                  Pin the location on the map
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Click or tap anywhere on the map to place the issue pin accurately.
                </p>
              </div>

              <MapPicker
                latitude={latitude}
                longitude={longitude}
                onChange={(lat, lon) => {
                  setLatitude(lat);
                  setLongitude(lon);
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Input
                  label="Location Landmark / Street (Optional)"
                  placeholder="e.g. Near Metro Exit 2, opposite library"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Municipal Ward / Zone
                  </label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary min-h-[44px] focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="Ward 41 - North Bazaar">Ward 41 - North Bazaar</option>
                    <option value="Ward 42 - Central">Ward 42 - Central</option>
                    <option value="Ward 43 - Tech Corridor">Ward 43 - Tech Corridor</option>
                    <option value="Ward 44 - South Market">Ward 44 - South Market</option>
                    <option value="Ward 45 - West Residential">Ward 45 - West Residential</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft size={16} />}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Next: Describe Issue
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS & AI CLASSIFICATION */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="font-heading font-bold text-base text-text-primary">
                  Describe what needs attention
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  AI will analyze your description to auto-suggest the responsible department.
                </p>
              </div>

              <Input
                label="Issue Title"
                placeholder="e.g. Severe pothole damaging vehicle tyres"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                label="Detailed Description"
                placeholder="Describe what happened, how long it has been there, and any safety hazards..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />

              {/* Live AI Category Suggestion Pill */}
              <div className="p-3.5 bg-primary-tint/60 border border-primary/20 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <Sparkles size={14} className="text-primary animate-pulse" />
                    <span>AI Assistant Classification</span>
                  </div>
                  {isClassifying && (
                    <span className="text-[11px] text-text-secondary animate-pulse">
                      Analyzing text...
                    </span>
                  )}
                  {aiSuggestion && !isClassifying && (
                    <span className="font-mono text-[11px] font-semibold text-primary bg-white px-2 py-0.5 rounded-full border border-primary/30">
                      {Math.round(aiSuggestion.confidence * 100)}% match
                    </span>
                  )}
                </div>

                {aiSuggestion && (
                  <p className="text-xs text-text-secondary leading-snug">
                    {aiSuggestion.explanation}
                  </p>
                )}

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-text-secondary mb-1">
                    Confirmed Category (You can change if AI was incorrect)
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary min-h-[44px] focus:ring-2 focus:ring-primary"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duplicate Report Awareness Signal */}
              {duplicateCandidates.length > 0 && (
                <div className="p-3.5 bg-accent-tint border border-accent/30 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-accent">
                    <AlertTriangle size={15} />
                    <span>Similar Nearby Complaints Found</span>
                  </div>
                  <p className="text-text-secondary text-[11px]">
                    {duplicateCandidates.length} fellow citizen(s) recently reported a similar issue
                    within 150m (e.g. #{duplicateCandidates[0].candidate_public_reference}). Your report will
                    amplify this issue's priority for faster municipal dispatch!
                  </p>
                </div>
              )}

              {/* Emergency Advisory Notice */}
              <div className="p-3 bg-surface-subtle border border-border/80 rounded-xl flex items-start gap-2.5 text-xs text-text-secondary">
                <ShieldAlert size={16} className="text-status-critical flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Emergency Guidance:</strong> If this situation involves active electrical sparking,
                  gas leaks, or immediate life danger, please dial local emergency services (112 / 911)
                  immediately.
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  leftIcon={<ArrowLeft size={16} />}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  withPulse
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 size={16} />}
                >
                  Submit Civic Report
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
