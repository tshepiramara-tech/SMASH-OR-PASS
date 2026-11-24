import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, PanInfo } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Heart,
  MapPin,
  Radio,
  Sparkles,
  UserPlus,
  UserCheck,
  Wifi,
  X,
  ArrowUp,
} from 'lucide-react';
import { LANGUAGE_OPTIONS, t } from '../i18n';
import { AdCampaign, AppLanguage, Gender, SubscriptionTier, UserProfile, WorldRegion } from '../types';

interface DiscoverViewProps {
  profiles: UserProfile[];
  currentUserId: string | null;
  followedIds: Set<string>;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  onSmash: (profile: UserProfile) => void;
  onPass: (profile: UserProfile) => void;
  onToggleFollow: (profile: UserProfile) => void;
  onOpenLive: (hostId: string) => void;
  activeAds: AdCampaign[];
  onAdImpression: (ad: AdCampaign) => void;
  onAdClick: (ad: AdCampaign) => void;
  userTier: SubscriptionTier;
  connectionSummary: { connectionType: string; effectiveType: string; commissionUsd: number } | null;
  onRequireAuth: () => void;
}

export function DiscoverView({
  profiles,
  currentUserId,
  followedIds,
  language,
  onChangeLanguage,
  onSmash,
  onPass,
  onToggleFollow,
  onOpenLive,
  activeAds,
  onAdImpression,
  onAdClick,
  userTier,
  connectionSummary,
  onRequireAuth,
}: DiscoverViewProps) {
  const [genderFilter, setGenderFilter] = useState<'All' | Gender>('All');
  const [regionFilter, setRegionFilter] = useState<'All' | WorldRegion>('All');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'up' | 'left' | 'right'>('up');
  const [dragOffset, setDragOffset] = useState(0);
  const wheelLockRef = useRef(0);
  const impressedAdsRef = useRef<Set<string>>(new Set());

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (p.uid === currentUserId) return false;
      if (genderFilter !== 'All' && p.gender !== genderFilter) return false;
      if (regionFilter !== 'All' && p.region !== regionFilter) return false;
      if (languageFilter !== 'All' && !p.languages.includes(languageFilter)) return false;
      return true;
    });
  }, [profiles, currentUserId, genderFilter, regionFilter, languageFilter]);

  const safeIndex = filteredProfiles.length > 0 ? currentIndex % filteredProfiles.length : 0;
  const activeProfile = filteredProfiles[safeIndex] ?? null;

  const upcomingProfiles = useMemo(() => {
    if (filteredProfiles.length <= 1) return [];
    const next: UserProfile[] = [];
    for (let i = 1; i <= Math.min(4, filteredProfiles.length - 1); i++) {
      next.push(filteredProfiles[(safeIndex + i) % filteredProfiles.length]);
    }
    return next;
  }, [filteredProfiles, safeIndex]);

  const currentAd = useMemo(() => {
    const liveAds = activeAds.filter((a) => a.status === 'active');
    if (liveAds.length === 0) return null;
    return liveAds[safeIndex % liveAds.length];
  }, [activeAds, safeIndex]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [activeProfile?.uid]);

  useEffect(() => {
    if (currentAd && userTier === 'free' && !impressedAdsRef.current.has(currentAd.id)) {
      impressedAdsRef.current.add(currentAd.id);
      onAdImpression(currentAd);
    }
  }, [currentAd, userTier, onAdImpression]);

  const triggerPass = (profile: UserProfile, dir: 'up' | 'left' = 'up') => {
    setExitDirection(dir);
    onPass(profile);
    setCurrentIndex((prev) => prev + 1);
  };

  const triggerSmash = (profile: UserProfile) => {
    if (!currentUserId) {
      onRequireAuth();
      return;
    }
    setExitDirection('right');
    onSmash(profile);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!activeProfile) return;
    const now = Date.now();
    if (now - wheelLockRef.current < 550) return;
    if (Math.abs(e.deltaY) > 35) {
      wheelLockRef.current = now;
      if (e.deltaY < 0) {
        // Scrolling up pops up the next profile
        triggerPass(activeProfile, 'up');
      } else {
        // Scrolling down also advances cleanly to the next profile
        triggerPass(activeProfile, 'up');
      }
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragOffset(0);
    if (!activeProfile) return;
    if (info.offset.x > 110 || info.velocity.x > 500) {
      triggerSmash(activeProfile);
    } else if (info.offset.x < -110 || info.velocity.x < -500 || info.offset.y < -110) {
      triggerPass(activeProfile, info.offset.y < -110 ? 'up' : 'left');
    }
  };

  const photos = useMemo(() => {
    if (!activeProfile) return [];
    const list =
      activeProfile.galleryPhotos && activeProfile.galleryPhotos.length > 0
        ? activeProfile.galleryPhotos
        : [activeProfile.primaryPhoto];
    return list;
  }, [activeProfile]);

  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => p.languages.forEach((l) => set.add(l)));
    return Array.from(set).sort();
  }, [profiles]);

  const localizedBio = activeProfile
    ? activeProfile.localizedBios?.[language] ?? activeProfile.bio
    : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-12">
      {/* Global Filter & Multi-Language Toolbar */}
      <section
        aria-label="Global matchmaking filters"
        className="bg-white border border-zinc-200/80 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 mr-1">
            <Globe className="w-4 h-4 text-zinc-600" />
            <span>{t(language, 'global_filter')}</span>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
            {(['All', 'Female', 'Male', 'Non-binary'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGenderFilter(g);
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  genderFilter === g
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {g === 'All' ? t(language, 'all_genders') : g}
              </button>
            ))}
          </div>

          {/* Region Select */}
          <select
            aria-label="Region filter"
            value={regionFilter}
            onChange={(e) => {
              setRegionFilter(e.target.value as 'All' | WorldRegion);
              setCurrentIndex(0);
            }}
            className="h-9 px-3 text-xs font-medium text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="All">{t(language, 'all_regions')}</option>
            <option value="Europe">Europe</option>
            <option value="Americas">Americas</option>
            <option value="Africa">Africa</option>
            <option value="Asia-Pacific">Asia-Pacific</option>
            <option value="Middle East">Middle East</option>
          </select>

          {/* Profile Language Filter */}
          <select
            aria-label="Profile language filter"
            value={languageFilter}
            onChange={(e) => {
              setLanguageFilter(e.target.value);
              setCurrentIndex(0);
            }}
            className="h-9 px-3 text-xs font-medium text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="All">{t(language, 'all_languages')}</option>
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* App Interface Language Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 whitespace-nowrap">UI Language</span>
          <select
            aria-label="Interface language"
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value as AppLanguage)}
            className="h-9 px-3 text-xs font-medium text-zinc-900 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.native} ({opt.label})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Main 2-Column Discovery Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Primary Column: Scroll-up & Swipe Discovery Card */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-lg mb-3 flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <ArrowUp className="w-3.5 h-3.5" />
              {t(language, 'scroll_hint')}
            </span>
            <span className="font-mono tabular-nums">
              {filteredProfiles.length > 0 ? `${safeIndex + 1} / ${filteredProfiles.length}` : '0 / 0'}
            </span>
          </div>

          {activeProfile ? (
            <div
              onWheel={handleWheel}
              className="w-full max-w-lg"
            >
              <AnimatePresence mode="wait">
                <motion.article
                  key={activeProfile.uid}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.45}
                  onDrag={(_, info) => setDragOffset(info.offset.x)}
                  onDragEnd={handleDragEnd}
                  initial={{ y: 90, opacity: 0, scale: 0.97 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={
                    exitDirection === 'right'
                      ? { x: 420, opacity: 0, rotate: 8, transition: { duration: 0.22 } }
                      : exitDirection === 'left'
                      ? { x: -420, opacity: 0, rotate: -8, transition: { duration: 0.22 } }
                      : { y: -420, opacity: 0, scale: 0.95, transition: { duration: 0.24 } }
                  }
                  transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm select-none touch-pan-y"
                >
                  {/* Photo Viewport */}
                  <div className="relative aspect-[3/4] max-h-[540px] w-full bg-zinc-100 overflow-hidden">
                    {photos[photoIndex] ? (
                      <img
                        src={photos[photoIndex]}
                        alt={`${activeProfile.displayName}, ${activeProfile.age}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-zinc-500">
                        <Sparkles className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">{activeProfile.displayName}</span>
                      </div>
                    )}

                    {/* Multi-Photo Top Progress Bars */}
                    {photos.length > 1 && (
                      <div className="absolute top-3 left-3 right-3 flex gap-1.5 z-10">
                        {photos.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            aria-label={`Photo ${idx + 1}`}
                            onClick={() => setPhotoIndex(idx)}
                            className={`h-1 flex-1 rounded-full transition-colors cursor-pointer ${
                              idx === photoIndex ? 'bg-white' : 'bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Photo Left/Right Tap Zones */}
                    {photos.length > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Previous photo"
                          onClick={() =>
                            setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
                          }
                          className="absolute inset-y-0 left-0 w-1/3 flex items-center justify-start pl-3 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <span className="w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-sm">
                            <ChevronLeft className="w-4 h-4" />
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label="Next photo"
                          onClick={() => setPhotoIndex((prev) => (prev + 1) % photos.length)}
                          className="absolute inset-y-0 right-0 w-1/3 flex items-center justify-end pr-3 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <span className="w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-sm">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </button>
                      </>
                    )}

                    {/* Swipe Direction Overlay Indicator */}
                    {dragOffset > 45 && (
                      <div className="absolute top-8 left-6 px-4 py-1.5 bg-emerald-600 text-white font-display text-xl font-bold rounded-lg -rotate-12 shadow-md">
                        SMASH
                      </div>
                    )}
                    {dragOffset < -45 && (
                      <div className="absolute top-8 right-6 px-4 py-1.5 bg-red-600 text-white font-display text-xl font-bold rounded-lg rotate-12 shadow-md">
                        PASS
                      </div>
                    )}

                    {/* Live Broadcast Button if Host is Live */}
                    {activeProfile.isLive && (
                      <button
                        type="button"
                        onClick={() => onOpenLive(activeProfile.uid)}
                        className="absolute top-6 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>LIVE NOW</span>
                      </button>
                    )}

                    {/* Contrast Scrim & Primary Identity Overlay */}
                    <div className="absolute inset-x-0 bottom-0 pt-20 pb-5 px-6 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                            {activeProfile.displayName}, {activeProfile.age}
                          </h2>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-zinc-200">
                            <span>{activeProfile.gender}</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {activeProfile.city}, {activeProfile.country}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!currentUserId) {
                              onRequireAuth();
                              return;
                            }
                            onToggleFollow(activeProfile);
                          }}
                          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            followedIds.has(activeProfile.uid)
                              ? 'bg-white text-zinc-900'
                              : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                          }`}
                        >
                          {followedIds.has(activeProfile.uid) ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{t(language, 'following')}</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{t(language, 'follow')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Profile Details Section (Zero-pill clean editorial typography) */}
                  <div className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 border-b border-zinc-100 pb-3">
                      <div>
                        <span className="font-medium text-zinc-700">{t(language, 'languages')}: </span>
                        <span>{activeProfile.languages.join(' · ')}</span>
                      </div>
                      <div className="font-mono tabular-nums text-zinc-600">
                        {activeProfile.followersCount.toLocaleString()} {t(language, 'followers')}
                      </div>
                    </div>

                    <p className="text-[15px] leading-relaxed text-zinc-800">
                      {localizedBio}
                    </p>

                    <div className="text-xs text-zinc-500">
                      <span className="font-medium text-zinc-700">{t(language, 'interests')}: </span>
                      <span>{activeProfile.interests.join(' · ')}</span>
                    </div>

                    {/* Two Clear Buttons Directly Under Profile: Red PASS & Green SMASH */}
                    <div className="pt-2 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => triggerPass(activeProfile, 'up')}
                        className="min-h-[48px] px-6 py-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-display font-bold text-base tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <X className="w-5 h-5" />
                        <span>{t(language, 'pass')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerSmash(activeProfile)}
                        className="min-h-[48px] px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-display font-bold text-base tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <Heart className="w-5 h-5 fill-current" />
                        <span>{t(language, 'smash')}</span>
                      </button>
                    </div>
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>
          ) : (
            <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-3xl p-10 text-center">
              <h3 className="font-display text-xl font-semibold text-zinc-900">
                No profiles match those filters
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Try switching back to All Genders or Global regions to discover more matches.
              </p>
              <button
                type="button"
                onClick={() => {
                  setGenderFilter('All');
                  setRegionFilter('All');
                  setLanguageFilter('All');
                  setCurrentIndex(0);
                }}
                className="mt-5 px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Reset Global Filters
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Global Queue, Native Advert Campaign, & Session Connection */}
        <aside className="lg:col-span-5 space-y-6">
          {/* Up Next Queue */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-semibold text-zinc-900">
                Global Discovery Queue
              </h3>
              <span className="text-xs text-zinc-500 font-mono tabular-nums">
                {filteredProfiles.length} active
              </span>
            </div>

            {upcomingProfiles.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {upcomingProfiles.map((prof) => {
                  const targetIdx = filteredProfiles.findIndex((p) => p.uid === prof.uid);
                  return (
                    <div
                      key={prof.uid}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => targetIdx >= 0 && setCurrentIndex(targetIdx)}
                        className="flex items-center gap-3 text-left min-w-0 flex-1 group cursor-pointer"
                      >
                        <img
                          src={prof.primaryPhoto}
                          alt={prof.displayName}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover shrink-0 bg-zinc-100"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 group-hover:underline truncate">
                            {prof.displayName}, {prof.age}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {prof.gender} · {prof.city}, {prof.country}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          aria-label={`Pass ${prof.displayName}`}
                          onClick={() => triggerPass(prof, 'up')}
                          className="px-2.5 py-1.5 text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                        >
                          PASS
                        </button>
                        <button
                          type="button"
                          aria-label={`Smash ${prof.displayName}`}
                          onClick={() => triggerSmash(prof)}
                          className="px-2.5 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                        >
                          SMASH
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Scroll or swipe through the active profile to refresh your global queue.
              </p>
            )}
          </div>

          {/* Native Sponsored Ad Slot (shown on Free tier) */}
          {userTier === 'free' && currentAd && (
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                <span>Sponsored Partner · {currentAd.brandName}</span>
                <span>{currentAd.targetRegion}</span>
              </div>
              <h4 className="font-display text-base font-semibold text-zinc-900">
                {currentAd.headline}
              </h4>
              <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
                {currentAd.description}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onAdClick(currentAd)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  {currentAd.ctaLabel}
                </button>
                <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                  CPM ${currentAd.cpmUsd.toFixed(2)} · CPC ${currentAd.cpcUsd.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Active Internet Data Session Commission Card */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Wifi className="w-4 h-4 text-zinc-600" />
                <span>Active Data Session</span>
              </div>
              <span className="font-mono text-xs font-medium text-emerald-700">
                +${(connectionSummary?.commissionUsd ?? 0.005).toFixed(3)} / session
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
              {connectionSummary
                ? `Connected via ${connectionSummary.connectionType.toUpperCase()} (${connectionSummary.effectiveType}). Every active internet session logs a micro-commission in the Monetize ledger.`
                : 'Sign in with an active internet data connection to log verified session commissions.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
