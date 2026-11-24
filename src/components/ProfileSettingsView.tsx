import { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { Camera, Check, ImagePlus, Lock, Trash2, Unlock, Upload } from 'lucide-react';
import { t } from '../i18n';
import {
  AppLanguage,
  Gender,
  InterestedIn,
  ProfilePhoto,
  UserProfile,
  WorldRegion,
} from '../types';
import { compressImageFile } from '../utils/imageCompression';

interface ProfileSettingsViewProps {
  user: User | null;
  profile: UserProfile | null;
  photos: ProfilePhoto[];
  language: AppLanguage;
  onSignIn: () => void;
  onSaveProfile: (data: {
    displayName: string;
    age: number;
    gender: Gender;
    interestedIn: InterestedIn;
    city: string;
    country: string;
    region: WorldRegion;
    languages: string[];
    interests: string[];
    bio: string;
    primaryPhoto: string;
    photoCount: number;
  }) => Promise<void>;
  onAddPhotos: (dataUrls: string[]) => Promise<void>;
  onDeletePhoto: (photoId: string) => Promise<void>;
  onSetPrimaryPhoto: (url: string) => Promise<void>;
  onOpenLiveTab: () => void;
}

const DEFAULT_FALLBACK_PHOTO = '/src/assets/images/profile_woman_paris_1795527354583.jpg';

const AVAILABLE_LANGUAGES = [
  'English',
  'French',
  'Spanish',
  'Portuguese',
  'German',
  'Japanese',
  'Zulu',
  'Arabic',
  'Italian',
];

const SUGGESTED_INTERESTS = [
  'Travel',
  'Coffee',
  'Music',
  'Photography',
  'Fitness',
  'Cooking',
  'Cinema',
  'Art Galleries',
  'Surfing',
  'Hiking',
  'Tech',
  'Nightlife',
];

export function ProfileSettingsView({
  user,
  profile,
  photos,
  language,
  onSignIn,
  onSaveProfile,
  onAddPhotos,
  onDeletePhoto,
  onSetPrimaryPhoto,
  onOpenLiveTab,
}: ProfileSettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const [age, setAge] = useState<number>(profile?.age ?? 25);
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'Female');
  const [interestedIn, setInterestedIn] = useState<InterestedIn>(profile?.interestedIn ?? 'Everyone');
  const [city, setCity] = useState(profile?.city ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [region, setRegion] = useState<WorldRegion>(profile?.region ?? 'Europe');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    profile?.languages ?? ['English']
  );
  const [interestsInput, setInterestsInput] = useState<string[]>(
    profile?.interests ?? ['Travel', 'Coffee', 'Music']
  );
  const [customInterest, setCustomInterest] = useState('');
  const [bio, setBio] = useState(
    profile?.bio ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setAge(profile.age);
    setGender(profile.gender);
    setInterestedIn(profile.interestedIn);
    setCity(profile.city);
    setCountry(profile.country);
    setRegion(profile.region);
    setSelectedLanguages(profile.languages);
    setInterestsInput(profile.interests);
    setBio(profile.bio);
  }, [profile]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white border border-zinc-200 rounded-3xl p-10">
          <Camera className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h2 className="font-display text-2xl font-bold text-zinc-900">
            Create Your SMASH OR PASS Profile
          </h2>
          <p className="mt-2 text-sm text-zinc-600 max-w-md mx-auto">
            Sign in with your Google account to build your international dating profile, upload multiple high-quality photos, and unlock private messaging.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="mt-6 px-6 py-2.5 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            {t(language, 'sign_in')}
          </button>
        </div>
      </div>
    );
  }

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(lang)) {
        return prev.length > 1 ? prev.filter((l) => l !== lang) : prev;
      }
      if (prev.length >= 6) return prev;
      return [...prev, lang];
    });
  };

  const toggleInterest = (item: string) => {
    setInterestsInput((prev) => {
      if (prev.includes(item)) {
        return prev.length > 1 ? prev.filter((i) => i !== item) : prev;
      }
      if (prev.length >= 8) return prev;
      return [...prev, item];
    });
  };

  const handleAddCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed || interestsInput.includes(trimmed) || interestsInput.length >= 8) return;
    setInterestsInput((prev) => [...prev, trimmed.slice(0, 32)]);
    setCustomInterest('');
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setUploading(true);
    try {
      const remainingSlots = Math.max(0, 6 - photos.length);
      if (remainingSlots === 0) {
        setErrorMsg('Maximum 6 photos per profile. Delete one to upload another.');
        return;
      }
      const chosen = Array.from(files).slice(0, remainingSlots);
      const compressed = await Promise.all(chosen.map((f) => compressImageFile(f)));
      await onAddPhotos(compressed);
      setFeedback(`Uploaded ${compressed.length} high-quality photo${compressed.length > 1 ? 's' : ''}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to process selected photos.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFeedback(null);

    if (displayName.trim().length < 2) {
      setErrorMsg('Display name must be at least 2 characters.');
      return;
    }
    if (age < 18 || age > 99) {
      setErrorMsg('Age must be between 18 and 99.');
      return;
    }
    if (city.trim().length < 1 || country.trim().length < 1) {
      setErrorMsg('Please enter both your city and country.');
      return;
    }
    if (bio.trim().length < 10) {
      setErrorMsg('Bio must be at least 10 characters for meaningful connections.');
      return;
    }

    setSaving(true);
    try {
      const primary =
        photos[0]?.url || profile?.primaryPhoto || user.photoURL || DEFAULT_FALLBACK_PHOTO;
      await onSaveProfile({
        displayName: displayName.trim().slice(0, 40),
        age,
        gender,
        interestedIn,
        city: city.trim().slice(0, 60),
        country: country.trim().slice(0, 60),
        region,
        languages: selectedLanguages,
        interests: interestsInput,
        bio: bio.trim().slice(0, 400),
        primaryPhoto: primary,
        photoCount: Math.max(1, photos.length),
      });
      setFeedback('Profile saved and live in global discovery.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const followersCount = profile?.followersCount ?? 0;
  const followerProgress = Math.min(100, Math.round((followersCount / 1000) * 100));
  const creatorUnlocked = followersCount >= 1000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900">
            {t(language, 'profile_settings')}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Complete your international profile and upload up to 6 high-quality photos.
          </p>
        </div>

        {/* 1,000-Follower Creator Status */}
        <div className="bg-white border border-zinc-200 rounded-2xl px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            {creatorUnlocked ? (
              <Unlock className="w-4 h-4 text-emerald-600" />
            ) : (
              <Lock className="w-4 h-4 text-zinc-500" />
            )}
            <div>
              <p className="text-xs font-semibold text-zinc-900">
                Video & Live Access
              </p>
              <p className="text-xs text-zinc-500 font-mono tabular-nums">
                {followersCount.toLocaleString()} / 1,000 followers ({followerProgress}%)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenLiveTab}
            className="px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg cursor-pointer"
          >
            Open Studio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Profile Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={40}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full h-11 px-3.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Age (18+)
              </label>
              <input
                type="number"
                required
                min={18}
                max={99}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full h-11 px-3.5 text-sm font-mono bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full h-11 px-3.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Interested In
              </label>
              <select
                value={interestedIn}
                onChange={(e) => setInterestedIn(e.target.value as InterestedIn)}
                className="w-full h-11 px-3.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="Everyone">Everyone</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                City
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Johannesburg"
                className="w-full h-11 px-3.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Country
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. South Africa"
                className="w-full h-11 px-3.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Global Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as WorldRegion)}
                className="w-full h-11 px-3.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="Africa">Africa</option>
                <option value="Europe">Europe</option>
                <option value="Americas">Americas</option>
                <option value="Asia-Pacific">Asia-Pacific</option>
                <option value="Middle East">Middle East</option>
              </select>
            </div>
          </div>

          {/* Languages Spoken */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">
              Spoken Languages (1–6)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LANGUAGES.map((lang) => {
                const active = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">
              Interests (1–8)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTED_INTERESTS.map((item) => {
                const active = interestsInput.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="Add custom interest..."
                maxLength={32}
                className="flex-1 h-10 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                className="px-4 h-10 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Short Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                Short Bio (for meaningful connections)
              </label>
              <span className="text-[11px] font-mono text-zinc-400">
                {bio.length} / 400
              </span>
            </div>
            <textarea
              required
              minLength={10}
              maxLength={400}
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share what makes your life exciting, what you love exploring, and who you hope to meet..."
              className="w-full p-3.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
          )}
          {feedback && (
            <p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              {feedback}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 h-11 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
          >
            {saving ? 'Saving Profile...' : profile ? 'Update Profile' : 'Create Profile'}
          </button>
        </form>

        {/* Right: Multi-Photo Upload Tool */}
        <section className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-zinc-900">
                Multi-Photo Gallery
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Upload up to 6 high-resolution photos ({photos.length} / 6 used)
              </p>
            </div>
            <button
              type="button"
              disabled={uploading || !profile}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Optimizing...' : 'Upload Photos'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
          </div>

          {!profile && (
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
              Save your profile details on the left first to enable multi-photo gallery uploads.
            </div>
          )}

          {/* Drag-and-drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (profile) handleFilesSelected(e.dataTransfer.files);
            }}
            onClick={() => profile && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
              profile
                ? 'border-zinc-300 hover:border-zinc-900 cursor-pointer bg-zinc-50/50'
                : 'border-zinc-200 opacity-50 cursor-not-allowed'
            }`}
          >
            <ImagePlus className="w-7 h-7 text-zinc-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-800">
              Drop photos here or click to select multiple files
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Automatically compressed to sharp HD JPEG for fast global loading.
            </p>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo) => {
              const isPrimary = profile?.primaryPhoto === photo.url;
              return (
                <div
                  key={photo.id}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 group"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Profile photo'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => onSetPrimaryPhoto(photo.url)}
                      className={`px-2 py-1 text-[10px] font-semibold rounded cursor-pointer ${
                        isPrimary
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/90 text-zinc-900 hover:bg-white'
                      }`}
                    >
                      {isPrimary ? 'Primary' : 'Set Main'}
                    </button>
                    <button
                      type="button"
                      aria-label="Delete photo"
                      onClick={() => onDeletePhoto(photo.id)}
                      className="p-1.5 rounded bg-red-600/90 hover:bg-red-600 text-white cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
