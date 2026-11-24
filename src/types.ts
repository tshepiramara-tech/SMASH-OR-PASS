export type Gender = 'Female' | 'Male' | 'Non-binary';
export type InterestedIn = 'Everyone' | 'Female' | 'Male';
export type WorldRegion = 'Europe' | 'Americas' | 'Africa' | 'Asia-Pacific' | 'Middle East';
export type SubscriptionTier = 'free' | 'gold' | 'platinum';
export type AppLanguage = 'en' | 'fr' | 'es' | 'pt' | 'de' | 'ja';
export type NavTab = 'discover' | 'inbox' | 'live' | 'monetize' | 'profile';

export interface ProfilePhoto {
  id: string;
  ownerId: string;
  url: string;
  caption: string;
  order: number;
  createdAt?: unknown;
}

export interface UserProfile {
  uid: string;
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
  localizedBios?: Partial<Record<AppLanguage, string>>;
  primaryPhoto: string;
  galleryPhotos?: string[];
  photoCount: number;
  followersCount: number;
  followingCount: number;
  isLive: boolean;
  premiumTier: SubscriptionTier;
  isSeed?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PrivateAccount {
  uid: string;
  email: string;
  premiumTier: SubscriptionTier;
  subscriptionStatus: 'active' | 'inactive';
  monthlySpendUsd: number;
  creatorEarningsUsd: number;
  updatedAt?: unknown;
}

export interface Conversation {
  id: string;
  participants: string[];
  userA: string;
  userB: string;
  userAName: string;
  userBName: string;
  userAPhoto: string;
  userBPhoto: string;
  lastMessage: string;
  lastSenderId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  language: string;
  createdAt?: unknown;
}

export interface ProfileVideo {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorPhoto: string;
  title: string;
  videoUrl: string;
  posterUrl?: string;
  durationSec: number;
  likesCount: number;
  createdAt?: unknown;
}

export interface LiveStream {
  id: string;
  hostId: string;
  hostName: string;
  hostPhoto: string;
  title: string;
  language: string;
  status: 'live' | 'ended';
  viewerCount: number;
  startedAt?: unknown;
  updatedAt?: unknown;
}

export interface LiveComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt?: unknown;
}

export interface AdCampaign {
  id: string;
  ownerId: string;
  brandName: string;
  headline: string;
  description: string;
  ctaLabel: string;
  targetRegion: string;
  cpmUsd: number;
  cpcUsd: number;
  impressions: number;
  clicks: number;
  revenueEarnedUsd: number;
  status: 'active' | 'paused';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SessionCommission {
  id: string;
  userId: string;
  connectionType: 'cellular' | 'wifi' | 'ethernet' | 'unknown';
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'wifi' | 'unknown';
  country: string;
  commissionUsd: number;
  createdAt?: unknown;
}
