import { useState } from 'react';
import { Check, Crown, Megaphone, Plus, Wifi } from 'lucide-react';
import { t } from '../i18n';
import {
  AdCampaign,
  AppLanguage,
  SessionCommission,
  SubscriptionTier,
} from '../types';

interface MonetizeViewProps {
  currentUserId: string | null;
  userTier: SubscriptionTier;
  onSelectTier: (tier: SubscriptionTier) => Promise<void>;
  adCampaigns: AdCampaign[];
  onCreateAdCampaign: (campaign: {
    brandName: string;
    headline: string;
    description: string;
    ctaLabel: string;
    targetRegion: string;
    cpmUsd: number;
    cpcUsd: number;
  }) => Promise<void>;
  onToggleAdStatus: (ad: AdCampaign) => Promise<void>;
  sessionCommissions: SessionCommission[];
  language: AppLanguage;
  onRequireAuth: () => void;
}

const TIERS: {
  id: SubscriptionTier;
  name: string;
  priceMonthly: number;
  summary: string;
  perks: string[];
}[] = [
  {
    id: 'free',
    name: 'Free Global',
    priceMonthly: 0,
    summary: 'Core global discovery, Smash & Pass, and instant Inbox.',
    perks: [
      'Unlimited Smash & Pass discovery',
      'Private Inbox messaging on Smash',
      'Multi-language profiles & filters',
      'Ad-supported feed',
    ],
  },
  {
    id: 'gold',
    name: 'SMASH Gold',
    priceMonthly: 14.99,
    summary: 'Ad-free international matchmaking and priority profile boosts.',
    perks: [
      '100% ad-free discovery feed',
      'Priority ranking in global queues',
      '6 HD profile gallery slots',
      'Read receipts in Inbox',
    ],
  },
  {
    id: 'platinum',
    name: 'SMASH Platinum',
    priceMonthly: 29.99,
    summary: 'Full global creator & VIP matchmaking suite.',
    perks: [
      'All SMASH Gold benefits included',
      'Global Passport across all 5 regions',
      '2x Creator revenue share on live gifts',
      'Verified Platinum profile badge',
    ],
  },
];

export function MonetizeView({
  currentUserId,
  userTier,
  onSelectTier,
  adCampaigns,
  onCreateAdCampaign,
  onToggleAdStatus,
  sessionCommissions,
  language,
  onRequireAuth,
}: MonetizeViewProps) {
  const [brandName, setBrandName] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Learn More');
  const [targetRegion, setTargetRegion] = useState('Global');
  const [cpmUsd, setCpmUsd] = useState(14);
  const [cpcUsd, setCpcUsd] = useState(1.5);
  const [creatingAd, setCreatingAd] = useState(false);
  const [tierSaving, setTierSaving] = useState<SubscriptionTier | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const totalAdRevenue = adCampaigns.reduce((sum, a) => sum + a.revenueEarnedUsd, 0);
  const totalSessionCommission = sessionCommissions.reduce((sum, s) => sum + s.commissionUsd, 0);
  const tierMonthlyRevenue = userTier === 'platinum' ? 29.99 : userTier === 'gold' ? 14.99 : 0;
  const totalCombinedRevenue = totalAdRevenue + totalSessionCommission + tierMonthlyRevenue;

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      onRequireAuth();
      return;
    }
    if (!brandName.trim() || !headline.trim() || !description.trim()) return;
    setCreatingAd(true);
    setFeedback(null);
    try {
      await onCreateAdCampaign({
        brandName: brandName.trim(),
        headline: headline.trim(),
        description: description.trim(),
        ctaLabel: ctaLabel.trim() || 'Visit Partner',
        targetRegion,
        cpmUsd,
        cpcUsd,
      });
      setBrandName('');
      setHeadline('');
      setDescription('');
      setFeedback('Advert campaign launched into global discovery.');
    } finally {
      setCreatingAd(false);
    }
  };

  const handleChooseTier = async (tier: SubscriptionTier) => {
    if (!currentUserId) {
      onRequireAuth();
      return;
    }
    setTierSaving(tier);
    setFeedback(null);
    try {
      await onSelectTier(tier);
      setFeedback(`Active subscription updated to ${tier.toUpperCase()}.`);
    } finally {
      setTierSaving(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-12 space-y-8">
      {/* Header & Top Revenue KPI Row */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900">
          {t(language, 'monetize_title')}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Earn from sponsored advert campaigns, premium subscription tiers, and every active internet data session.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5">
            <p className="text-xs font-medium text-zinc-500">Total Platform Revenue</p>
            <p className="mt-2 font-mono text-2xl font-bold text-zinc-900 tabular-nums">
              ${totalCombinedRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5">
            <p className="text-xs font-medium text-zinc-500">Advert Campaign Earnings</p>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              ${totalAdRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5">
            <p className="text-xs font-medium text-zinc-500">Data Session Commissions</p>
            <p className="mt-2 font-mono text-2xl font-bold text-zinc-900 tabular-nums">
              ${totalSessionCommission.toFixed(3)}
            </p>
          </div>
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5">
            <p className="text-xs font-medium text-zinc-500">Active Subscription Tier</p>
            <p className="mt-2 font-mono text-2xl font-bold text-zinc-900 capitalize">
              {userTier} (${tierMonthlyRevenue.toFixed(2)}/mo)
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-medium flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Premium Subscription Tiers */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-zinc-900" />
          <h2 className="font-display text-xl font-bold text-zinc-900">
            Premium Subscription Tiers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((tier) => {
            const isCurrent = userTier === tier.id;
            return (
              <div
                key={tier.id}
                className={`bg-white rounded-3xl p-6 flex flex-col justify-between border ${
                  isCurrent ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-zinc-900">
                      {tier.name}
                    </h3>
                    {isCurrent && (
                      <span className="text-xs font-semibold text-emerald-700">Active</span>
                    )}
                  </div>
                  <p className="mt-2 font-mono text-2xl font-bold text-zinc-900 tabular-nums">
                    ${tier.priceMonthly.toFixed(2)}
                    <span className="text-xs font-sans font-normal text-zinc-500"> / month</span>
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">{tier.summary}</p>
                  <ul className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-xs text-zinc-700">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isCurrent || tierSaving === tier.id}
                  onClick={() => handleChooseTier(tier.id)}
                  className={`mt-6 w-full h-11 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-zinc-100 text-zinc-500 cursor-default'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }`}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : tierSaving === tier.id
                    ? 'Updating...'
                    : `Select ${tier.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Advert Campaigns + Active Internet Data Session Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Advert Campaigns Manager */}
        <section className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-zinc-900" />
              <span>Advert Campaigns</span>
            </h2>
            <span className="font-mono text-xs text-zinc-500">
              {adCampaigns.length} campaigns
            </span>
          </div>

          <div className="divide-y divide-zinc-100">
            {adCampaigns.map((ad) => (
              <div key={ad.id} className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-semibold text-zinc-900">{ad.brandName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ad.targetRegion}</span>
                    <span aria-hidden="true">·</span>
                    <span className={ad.status === 'active' ? 'text-emerald-700 font-medium' : 'text-zinc-500'}>
                      {ad.status === 'active' ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 mt-1 truncate">
                    {ad.headline}
                  </p>
                  <p className="text-xs font-mono text-zinc-500 mt-1 tabular-nums">
                    {ad.impressions.toLocaleString()} impressions · {ad.clicks.toLocaleString()} clicks · Earned ${ad.revenueEarnedUsd.toFixed(2)}
                  </p>
                </div>

                {ad.ownerId !== 'platform' && (
                  <button
                    type="button"
                    onClick={() => onToggleAdStatus(ad)}
                    className="px-3.5 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg shrink-0 cursor-pointer"
                  >
                    {ad.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Launch New Advert Campaign */}
          <form onSubmit={handleLaunchCampaign} className="pt-4 border-t border-zinc-100 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Launch New Sponsored Advert</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                maxLength={60}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Brand Name"
                className="h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-xl"
              />
              <select
                value={targetRegion}
                onChange={(e) => setTargetRegion(e.target.value)}
                className="h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-xl"
              >
                <option value="Global">Global</option>
                <option value="Africa">Africa</option>
                <option value="Europe">Europe</option>
                <option value="Americas">Americas</option>
                <option value="Asia-Pacific">Asia-Pacific</option>
              </select>
            </div>
            <input
              type="text"
              required
              minLength={4}
              maxLength={120}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Campaign Headline"
              className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-xl"
            />
            <textarea
              required
              minLength={10}
              maxLength={240}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short advert description shown in discovery..."
              className="w-full p-3 text-sm bg-zinc-50 border border-zinc-200 rounded-xl"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                maxLength={30}
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="CTA Label"
                className="h-10 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl"
              />
              <input
                type="number"
                min={0.5}
                max={500}
                step={0.5}
                value={cpmUsd}
                onChange={(e) => setCpmUsd(Number(e.target.value))}
                placeholder="CPM ($)"
                className="h-10 px-3 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-xl"
              />
              <input
                type="number"
                min={0.05}
                max={50}
                step={0.05}
                value={cpcUsd}
                onChange={(e) => setCpcUsd(Number(e.target.value))}
                placeholder="CPC ($)"
                className="h-10 px-3 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-xl"
              />
            </div>
            <button
              type="submit"
              disabled={creatingAd}
              className="px-5 h-10 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-xl cursor-pointer"
            >
              {creatingAd ? 'Launching...' : 'Publish Advert Campaign'}
            </button>
          </form>
        </section>

        {/* Active Internet Data Session Commissions */}
        <section className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-emerald-600" />
              <span>Internet Session Commissions</span>
            </h2>
            <span className="font-mono text-xs text-zinc-500 tabular-nums">
              {sessionCommissions.length} sessions
            </span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Every authenticated login over an active internet data connection automatically records a verified session commission ($0.005 for cellular data, $0.002 for broadband/Wi-Fi).
          </p>

          {sessionCommissions.length === 0 ? (
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 text-center text-xs text-zinc-500">
              Sign in to log your active internet connection commission in real time.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-[380px] overflow-y-auto">
              {sessionCommissions.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-zinc-900 uppercase">
                      {s.connectionType} · {s.effectiveType}
                    </p>
                    <p className="text-zinc-500 mt-0.5">{s.country}</p>
                  </div>
                  <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                    +${s.commissionUsd.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
