import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import {
  DEFAULT_AD_CAMPAIGNS,
  DEFAULT_CREATOR_VIDEOS,
  DEFAULT_LIVE_STREAMS,
  GLOBAL_SEED_PROFILES,
} from './data/seedData';
import {
  AdCampaign,
  AppLanguage,
  ChatMessage,
  Conversation,
  Gender,
  InterestedIn,
  LiveComment,
  LiveStream,
  NavTab,
  PrivateAccount,
  ProfilePhoto,
  ProfileVideo,
  SessionCommission,
  SubscriptionTier,
  UserProfile,
  WorldRegion,
} from './types';
import { TopNav } from './components/TopNav';
import { DiscoverView } from './components/DiscoverView';
import { InboxView } from './components/InboxView';
import { LiveVideoView } from './components/LiveVideoView';
import { MonetizeView } from './components/MonetizeView';
import { ProfileSettingsView } from './components/ProfileSettingsView';

const ADMIN_EMAIL = 'tshepiramara@gmail.com';
const FALLBACK_AVATAR = '/src/assets/images/profile_man_london_1795527357341.jpg';

function detectConnectionInfo(): {
  connectionType: 'cellular' | 'wifi' | 'ethernet' | 'unknown';
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'wifi' | 'unknown';
  commissionUsd: number;
} {
  const nav = navigator as Navigator & {
    connection?: { type?: string; effectiveType?: string };
  };
  const rawType = nav.connection?.type || '';
  const rawEff = nav.connection?.effectiveType || '';

  const connectionType: 'cellular' | 'wifi' | 'ethernet' | 'unknown' =
    rawType === 'cellular'
      ? 'cellular'
      : rawType === 'wifi'
      ? 'wifi'
      : rawType === 'ethernet'
      ? 'ethernet'
      : navigator.onLine
      ? 'wifi'
      : 'unknown';

  const effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'wifi' | 'unknown' =
    rawEff === '4g' || rawEff === '3g' || rawEff === '2g' || rawEff === 'slow-2g'
      ? rawEff
      : connectionType === 'wifi'
      ? 'wifi'
      : 'unknown';

  const commissionUsd = connectionType === 'cellular' ? 0.005 : 0.002;
  return { connectionType, effectiveType, commissionUsd };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [authToast, setAuthToast] = useState<string | null>(null);

  // Firestore synced state
  const [firestoreProfiles, setFirestoreProfiles] = useState<UserProfile[]>([]);
  const [myPhotos, setMyPhotos] = useState<ProfilePhoto[]>([]);
  const [privateAccount, setPrivateAccount] = useState<PrivateAccount | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [seedFollowerDeltas, setSeedFollowerDeltas] = useState<Record<string, number>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [firestoreAds, setFirestoreAds] = useState<AdCampaign[]>([]);
  const [localSeedAds, setLocalSeedAds] = useState<AdCampaign[]>(DEFAULT_AD_CAMPAIGNS);
  const [sessionCommissions, setSessionCommissions] = useState<SessionCommission[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>(DEFAULT_LIVE_STREAMS);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [streamComments, setStreamComments] = useState<LiveComment[]>([]);
  const [videos, setVideos] = useState<ProfileVideo[]>(DEFAULT_CREATOR_VIDEOS);
  const [connectionSummary, setConnectionSummary] = useState<{
    connectionType: string;
    effectiveType: string;
    commissionUsd: number;
  } | null>(null);

  const loggedSessionUidRef = useRef<string | null>(null);

  const isAdmin = Boolean(
    user && user.email === ADMIN_EMAIL && user.emailVerified
  );

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) {
        loggedSessionUidRef.current = null;
        setMyPhotos([]);
        setPrivateAccount(null);
        setFollowedIds(new Set());
        setConversations([]);
        setMessages([]);
        setSessionCommissions([]);
      }
    });
    return () => unsub();
  }, []);

  // Log active internet data session commission once per login
  useEffect(() => {
    if (!authReady || !user) return;
    if (loggedSessionUidRef.current === user.uid) return;
    loggedSessionUidRef.current = user.uid;

    const info = detectConnectionInfo();
    setConnectionSummary(info);

    const recordSession = async () => {
      const sessionId = `sess_${user.uid.slice(0, 12)}_${Date.now()}`;
      try {
        await setDoc(doc(db, 'sessionCommissions', sessionId), {
          userId: user.uid,
          connectionType: info.connectionType,
          effectiveType: info.effectiveType,
          country: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Global',
          commissionUsd: info.commissionUsd,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `sessionCommissions/${sessionId}`);
      }

      // Ensure private account record exists
      const acctRef = doc(db, 'users', user.uid, 'private', 'account');
      try {
        const snap = await getDoc(acctRef);
        if (!snap.exists()) {
          await setDoc(acctRef, {
            uid: user.uid,
            email: (user.email || '').slice(0, 120),
            premiumTier: 'free',
            subscriptionStatus: 'inactive',
            monthlySpendUsd: 0,
            creatorEarningsUsd: 0,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/private/account`);
      }
    };

    recordSession();
  }, [authReady, user]);

  // Real-time Firestore subscriptions when authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    const unsubProfiles = onSnapshot(
      query(collection(db, 'profiles'), where('age', '>=', 18)),
      (snap) => {
        const items = snap.docs.map((d) => ({ ...(d.data() as UserProfile), uid: d.id }));
        setFirestoreProfiles(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'profiles')
    );

    const unsubPhotos = onSnapshot(
      query(collection(db, 'profiles', user.uid, 'photos'), orderBy('order', 'asc')),
      (snap) => {
        setMyPhotos(snap.docs.map((d) => ({ ...(d.data() as ProfilePhoto), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `profiles/${user.uid}/photos`)
    );

    const unsubPrivate = onSnapshot(
      doc(db, 'users', user.uid, 'private', 'account'),
      (snap) => {
        if (snap.exists()) {
          setPrivateAccount(snap.data() as PrivateAccount);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/private/account`)
    );

    const unsubFollows = onSnapshot(
      query(collection(db, 'follows'), where('followerUid', '==', user.uid)),
      (snap) => {
        const ids = new Set<string>();
        snap.docs.forEach((d) => {
          const data = d.data() as { targetUid?: string };
          if (data.targetUid) ids.add(data.targetUid);
        });
        setFollowedIds(ids);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'follows')
    );

    const unsubConvs = onSnapshot(
      query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as Conversation), id: d.id }));
        setConversations(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'conversations')
    );

    const unsubAds = onSnapshot(
      query(collection(db, 'adCampaigns'), where('status', 'in', ['active', 'paused'])),
      (snap) => {
        setFirestoreAds(snap.docs.map((d) => ({ ...(d.data() as AdCampaign), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'adCampaigns')
    );

    const sessionQuery = isAdmin
      ? collection(db, 'sessionCommissions')
      : query(collection(db, 'sessionCommissions'), where('userId', '==', user.uid));

    const unsubSessions = onSnapshot(
      sessionQuery,
      (snap) => {
        setSessionCommissions(
          snap.docs.map((d) => ({ ...(d.data() as SessionCommission), id: d.id }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'sessionCommissions')
    );

    const unsubLives = onSnapshot(
      query(collection(db, 'liveStreams'), where('status', 'in', ['live', 'ended'])),
      (snap) => {
        const liveDocs = snap.docs.map((d) => ({ ...(d.data() as LiveStream), id: d.id }));
        setLiveStreams([...liveDocs, ...DEFAULT_LIVE_STREAMS]);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'liveStreams')
    );

    const unsubVideos = onSnapshot(
      query(collection(db, 'videos'), where('durationSec', '>=', 1)),
      (snap) => {
        const vidDocs = snap.docs.map((d) => ({ ...(d.data() as ProfileVideo), id: d.id }));
        setVideos([...vidDocs, ...DEFAULT_CREATOR_VIDEOS]);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'videos')
    );

    return () => {
      unsubProfiles();
      unsubPhotos();
      unsubPrivate();
      unsubFollows();
      unsubConvs();
      unsubAds();
      unsubSessions();
      unsubLives();
      unsubVideos();
    };
  }, [authReady, user, isAdmin]);

  // Active conversation messages listener
  useEffect(() => {
    if (!authReady || !user || !activeConversationId) {
      setMessages([]);
      return;
    }
    const path = `conversations/${activeConversationId}/messages`;
    const unsub = onSnapshot(
      query(collection(db, path), orderBy('createdAt', 'asc')),
      (snap) => {
        setMessages(snap.docs.map((d) => ({ ...(d.data() as ChatMessage), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, path)
    );
    return () => unsub();
  }, [authReady, user, activeConversationId]);

  // Active live stream comments listener
  useEffect(() => {
    if (!authReady || !user || !activeStreamId) {
      setStreamComments([]);
      return;
    }
    // Seed live streams don't live in Firestore unless created; guard comments listener safely
    if (activeStreamId.startsWith('live_')) {
      setStreamComments([]);
      return;
    }
    const path = `liveStreams/${activeStreamId}/comments`;
    const unsub = onSnapshot(
      query(collection(db, path), orderBy('createdAt', 'asc')),
      (snap) => {
        setStreamComments(snap.docs.map((d) => ({ ...(d.data() as LiveComment), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, path)
    );
    return () => unsub();
  }, [authReady, user, activeStreamId]);

  const mergedProfiles = useMemo(() => {
    const map = new Map<string, UserProfile>();
    GLOBAL_SEED_PROFILES.forEach((p) => {
      const delta = seedFollowerDeltas[p.uid] ?? 0;
      map.set(p.uid, { ...p, followersCount: p.followersCount + delta });
    });
    firestoreProfiles.forEach((p) => {
      map.set(p.uid, p);
    });
    return Array.from(map.values());
  }, [firestoreProfiles, seedFollowerDeltas]);

  const currentProfile = useMemo(() => {
    if (!user) return null;
    return firestoreProfiles.find((p) => p.uid === user.uid) ?? null;
  }, [firestoreProfiles, user]);

  const allAdCampaigns = useMemo(() => {
    return [...firestoreAds, ...localSeedAds];
  }, [firestoreAds, localSeedAds]);

  const handleSignIn = async () => {
    setAuthToast(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthToast(err instanceof Error ? err.message : 'Sign-in cancelled.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveTab('discover');
  };

  // SMASH -> Save swipe + open/create private conversation + direct straight to Inbox!
  const handleSmash = async (target: UserProfile) => {
    if (!user) {
      handleSignIn();
      return;
    }
    const swipeId = `${user.uid}_${target.uid}`;
    try {
      await setDoc(doc(db, 'swipes', swipeId), {
        fromUid: user.uid,
        toUid: target.uid,
        decision: 'smash',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `swipes/${swipeId}`);
    }

    const sorted = [user.uid, target.uid].sort();
    const convId = `${sorted[0]}__${sorted[1]}`;
    const convRef = doc(db, 'conversations', convId);

    try {
      const existingConv = await getDoc(convRef);
      if (!existingConv.exists()) {
        const myName = (currentProfile?.displayName || user.displayName || 'Explorer').slice(0, 60);
        const myPhoto = (currentProfile?.primaryPhoto || user.photoURL || FALLBACK_AVATAR).slice(0, 350000);
        const targetName = target.displayName.slice(0, 60);
        const targetPhoto = target.primaryPhoto.slice(0, 350000);

        const isMeFirst = sorted[0] === user.uid;
        await setDoc(convRef, {
          participants: sorted,
          userA: sorted[0],
          userB: sorted[1],
          userAName: isMeFirst ? myName : targetName,
          userBName: isMeFirst ? targetName : myName,
          userAPhoto: isMeFirst ? myPhoto : targetPhoto,
          userBPhoto: isMeFirst ? targetPhoto : myPhoto,
          lastMessage: `Smashed ${target.displayName}! Say hello.`,
          lastSenderId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setActiveConversationId(convId);
      setActiveTab('inbox');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `conversations/${convId}`);
    }
  };

  const handlePass = async (target: UserProfile) => {
    if (!user) return;
    const swipeId = `${user.uid}_${target.uid}`;
    try {
      await setDoc(doc(db, 'swipes', swipeId), {
        fromUid: user.uid,
        toUid: target.uid,
        decision: 'pass',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `swipes/${swipeId}`);
    }
  };

  const handleToggleFollow = async (target: UserProfile) => {
    if (!user) return;
    const followId = `${user.uid}_${target.uid}`;
    const followRef = doc(db, 'follows', followId);
    const alreadyFollowing = followedIds.has(target.uid);

    if (target.isSeed) {
      try {
        if (alreadyFollowing) {
          await deleteDoc(followRef);
          setSeedFollowerDeltas((prev) => ({
            ...prev,
            [target.uid]: (prev[target.uid] ?? 0) - 1,
          }));
        } else {
          await setDoc(followRef, {
            followerUid: user.uid,
            targetUid: target.uid,
            createdAt: serverTimestamp(),
          });
          setSeedFollowerDeltas((prev) => ({
            ...prev,
            [target.uid]: (prev[target.uid] ?? 0) + 1,
          }));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `follows/${followId}`);
      }
      return;
    }

    const batch = writeBatch(db);
    const targetRef = doc(db, 'profiles', target.uid);
    if (alreadyFollowing) {
      batch.delete(followRef);
      batch.update(targetRef, {
        followersCount: Math.max(0, target.followersCount - 1),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(followRef, {
        followerUid: user.uid,
        targetUid: target.uid,
        createdAt: serverTimestamp(),
      });
      batch.update(targetRef, {
        followersCount: target.followersCount + 1,
        updatedAt: serverTimestamp(),
      });
    }
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `follows/${followId}`);
    }
  };

  const handleSendMessage = async (convId: string, text: string) => {
    if (!user) return;
    const msgPath = `conversations/${convId}/messages`;
    try {
      await addDoc(collection(db, msgPath), {
        senderId: user.uid,
        text: text.slice(0, 1000),
        language,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'conversations', convId), {
        lastMessage: text.slice(0, 500),
        lastSenderId: user.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, msgPath);
    }
  };

  const handleSaveProfile = async (data: {
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
  }) => {
    if (!user) return;
    const ref = doc(db, 'profiles', user.uid);
    try {
      if (currentProfile) {
        await updateDoc(ref, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          uid: user.uid,
          ...data,
          followersCount: 0,
          followingCount: 0,
          isLive: false,
          premiumTier: privateAccount?.premiumTier ?? 'free',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `profiles/${user.uid}`);
    }
  };

  const handleAddPhotos = async (dataUrls: string[]) => {
    if (!user || !currentProfile) return;
    const photosPath = `profiles/${user.uid}/photos`;
    try {
      const startOrder = myPhotos.length;
      for (let i = 0; i < dataUrls.length; i++) {
        await addDoc(collection(db, photosPath), {
          ownerId: user.uid,
          url: dataUrls[i],
          caption: '',
          order: startOrder + i,
          createdAt: serverTimestamp(),
        });
      }
      await updateDoc(doc(db, 'profiles', user.uid), {
        photoCount: Math.min(6, startOrder + dataUrls.length),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, photosPath);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!user || !currentProfile) return;
    const path = `profiles/${user.uid}/photos/${photoId}`;
    try {
      await deleteDoc(doc(db, 'profiles', user.uid, 'photos', photoId));
      await updateDoc(doc(db, 'profiles', user.uid), {
        photoCount: Math.max(1, myPhotos.length - 1),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleSetPrimaryPhoto = async (url: string) => {
    if (!user || !currentProfile) return;
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        primaryPhoto: url,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  const handleStartLiveStream = async (title: string, streamLanguage: string) => {
    if (!user) return;
    const streamId = `stream_${user.uid.slice(0, 10)}_${Date.now()}`;
    try {
      await setDoc(doc(db, 'liveStreams', streamId), {
        hostId: user.uid,
        hostName: (currentProfile?.displayName || user.displayName || 'Creator').slice(0, 40),
        hostPhoto: (currentProfile?.primaryPhoto || user.photoURL || FALLBACK_AVATAR).slice(0, 350000),
        title: title.slice(0, 100),
        language: streamLanguage.slice(0, 30),
        status: 'live',
        viewerCount: 1,
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActiveStreamId(streamId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `liveStreams/${streamId}`);
    }
  };

  const handleEndLiveStream = async (streamId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'liveStreams', streamId), {
        status: 'ended',
        updatedAt: serverTimestamp(),
      });
      setActiveStreamId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `liveStreams/${streamId}`);
    }
  };

  const handlePostLiveComment = async (streamId: string, text: string) => {
    if (!user) return;
    if (streamId.startsWith('live_')) {
      setStreamComments((prev) => [
        ...prev,
        {
          id: `c_${Date.now()}`,
          authorId: user.uid,
          authorName: currentProfile?.displayName || user.displayName || 'Viewer',
          text,
        },
      ]);
      return;
    }
    const path = `liveStreams/${streamId}/comments`;
    try {
      await addDoc(collection(db, path), {
        authorId: user.uid,
        authorName: (currentProfile?.displayName || user.displayName || 'Viewer').slice(0, 40),
        text: text.slice(0, 300),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handlePublishVideo = async (
    title: string,
    videoDataUrl: string,
    durationSec: number
  ) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'videos'), {
        creatorId: user.uid,
        creatorName: (currentProfile?.displayName || user.displayName || 'Creator').slice(0, 40),
        creatorPhoto: (currentProfile?.primaryPhoto || user.photoURL || FALLBACK_AVATAR).slice(0, 350000),
        title: title.slice(0, 100),
        videoUrl: videoDataUrl,
        durationSec,
        likesCount: 0,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'videos');
    }
  };

  const handleLikeVideo = async (vid: ProfileVideo) => {
    if (!user) {
      handleSignIn();
      return;
    }
    if (vid.id.startsWith('vid_')) {
      setVideos((prev) =>
        prev.map((v) => (v.id === vid.id ? { ...v, likesCount: v.likesCount + 1 } : v))
      );
      return;
    }
    try {
      await updateDoc(doc(db, 'videos', vid.id), {
        likesCount: vid.likesCount + 1,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `videos/${vid.id}`);
    }
  };

  const handleAdImpression = useCallback(
    async (ad: AdCampaign) => {
      if (ad.ownerId === 'platform') {
        setLocalSeedAds((prev) =>
          prev.map((item) =>
            item.id === ad.id
              ? {
                  ...item,
                  impressions: item.impressions + 1,
                  revenueEarnedUsd: Number((item.revenueEarnedUsd + item.cpmUsd / 1000).toFixed(4)),
                }
              : item
          )
        );
        return;
      }
      if (!user) return;
      try {
        await updateDoc(doc(db, 'adCampaigns', ad.id), {
          impressions: ad.impressions + 1,
          revenueEarnedUsd: Number((ad.revenueEarnedUsd + ad.cpmUsd / 1000).toFixed(4)),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `adCampaigns/${ad.id}`);
      }
    },
    [user]
  );

  const handleAdClick = async (ad: AdCampaign) => {
    if (ad.ownerId === 'platform') {
      setLocalSeedAds((prev) =>
        prev.map((item) =>
          item.id === ad.id
            ? {
                ...item,
                clicks: item.clicks + 1,
                revenueEarnedUsd: Number((item.revenueEarnedUsd + item.cpcUsd).toFixed(2)),
              }
            : item
        )
      );
      return;
    }
    if (!user) return;
    try {
      await updateDoc(doc(db, 'adCampaigns', ad.id), {
        clicks: ad.clicks + 1,
        revenueEarnedUsd: Number((ad.revenueEarnedUsd + ad.cpcUsd).toFixed(2)),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `adCampaigns/${ad.id}`);
    }
  };

  const handleCreateAdCampaign = async (campaign: {
    brandName: string;
    headline: string;
    description: string;
    ctaLabel: string;
    targetRegion: string;
    cpmUsd: number;
    cpcUsd: number;
  }) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'adCampaigns'), {
        ownerId: user.uid,
        ...campaign,
        impressions: 0,
        clicks: 0,
        revenueEarnedUsd: 0,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'adCampaigns');
    }
  };

  const handleToggleAdStatus = async (ad: AdCampaign) => {
    if (!user || ad.ownerId === 'platform') return;
    try {
      await updateDoc(doc(db, 'adCampaigns', ad.id), {
        status: ad.status === 'active' ? 'paused' : 'active',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `adCampaigns/${ad.id}`);
    }
  };

  const handleSelectTier = async (tier: SubscriptionTier) => {
    if (!user) return;
    const spend = tier === 'platinum' ? 29.99 : tier === 'gold' ? 14.99 : 0;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'private', 'account'), {
        premiumTier: tier,
        subscriptionStatus: tier === 'free' ? 'inactive' : 'active',
        monthlySpendUsd: spend,
        updatedAt: serverTimestamp(),
      });
      if (currentProfile) {
        await updateDoc(doc(db, 'profiles', user.uid), {
          premiumTier: tier,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/private/account`);
    }
  };

  const userTier: SubscriptionTier = privateAccount?.premiumTier ?? currentProfile?.premiumTier ?? 'free';

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900">
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        language={language}
        unreadCount={conversations.length}
      />

      {authToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3">
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {authToast}
          </div>
        </div>
      )}

      {/* Prompt newly signed-in users without a profile to complete onboarding */}
      {user && !currentProfile && activeTab === 'discover' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-zinc-700">
              Welcome, <span className="font-semibold text-zinc-900">{user.displayName || 'New Member'}</span>. Finish your SMASH OR PASS profile (age, gender, location, interests, bio, and photos) so global matches can discover you.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg cursor-pointer shrink-0"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}

      <main>
        {activeTab === 'discover' && (
          <DiscoverView
            profiles={mergedProfiles}
            currentUserId={user?.uid ?? null}
            followedIds={followedIds}
            language={language}
            onChangeLanguage={setLanguage}
            onSmash={handleSmash}
            onPass={handlePass}
            onToggleFollow={handleToggleFollow}
            onOpenLive={(hostId) => {
              const stream = liveStreams.find((s) => s.hostId === hostId && s.status === 'live');
              if (stream) setActiveStreamId(stream.id);
              setActiveTab('live');
            }}
            activeAds={allAdCampaigns}
            onAdImpression={handleAdImpression}
            onAdClick={handleAdClick}
            userTier={userTier}
            connectionSummary={connectionSummary}
            onRequireAuth={handleSignIn}
          />
        )}

        {activeTab === 'inbox' && (
          <InboxView
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => setActiveConversationId(id || null)}
            messages={messages}
            currentUserId={user?.uid ?? null}
            onSendMessage={handleSendMessage}
            language={language}
            onGoDiscover={() => setActiveTab('discover')}
            onRequireAuth={handleSignIn}
          />
        )}

        {activeTab === 'live' && (
          <LiveVideoView
            currentProfile={currentProfile}
            currentUserId={user?.uid ?? null}
            isAdmin={isAdmin}
            liveStreams={liveStreams}
            videos={videos}
            activeStreamId={activeStreamId}
            streamComments={streamComments}
            onSelectStream={setActiveStreamId}
            onStartLiveStream={handleStartLiveStream}
            onEndLiveStream={handleEndLiveStream}
            onPostLiveComment={handlePostLiveComment}
            onPublishVideo={handlePublishVideo}
            onLikeVideo={handleLikeVideo}
            language={language}
            onRequireAuth={handleSignIn}
          />
        )}

        {activeTab === 'monetize' && (
          <MonetizeView
            currentUserId={user?.uid ?? null}
            userTier={userTier}
            onSelectTier={handleSelectTier}
            adCampaigns={allAdCampaigns}
            onCreateAdCampaign={handleCreateAdCampaign}
            onToggleAdStatus={handleToggleAdStatus}
            sessionCommissions={sessionCommissions}
            language={language}
            onRequireAuth={handleSignIn}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileSettingsView
            user={user}
            profile={currentProfile}
            photos={myPhotos}
            language={language}
            onSignIn={handleSignIn}
            onSaveProfile={handleSaveProfile}
            onAddPhotos={handleAddPhotos}
            onDeletePhoto={handleDeletePhoto}
            onSetPrimaryPhoto={handleSetPrimaryPhoto}
            onOpenLiveTab={() => setActiveTab('live')}
          />
        )}
      </main>
    </div>
  );
}
