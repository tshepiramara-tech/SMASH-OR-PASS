import { useEffect, useRef, useState } from 'react';
import {
  Film,
  Heart,
  Lock,
  Radio,
  Send,
  Unlock,
  Upload,
  Users,
  Video,
  X,
} from 'lucide-react';
import { t } from '../i18n';
import {
  AppLanguage,
  LiveComment,
  LiveStream,
  ProfileVideo,
  UserProfile,
} from '../types';

interface LiveVideoViewProps {
  currentProfile: UserProfile | null;
  currentUserId: string | null;
  isAdmin: boolean;
  liveStreams: LiveStream[];
  videos: ProfileVideo[];
  activeStreamId: string | null;
  streamComments: LiveComment[];
  onSelectStream: (streamId: string | null) => void;
  onStartLiveStream: (title: string, streamLanguage: string) => Promise<void>;
  onEndLiveStream: (streamId: string) => Promise<void>;
  onPostLiveComment: (streamId: string, text: string) => Promise<void>;
  onPublishVideo: (title: string, videoDataUrl: string, durationSec: number) => Promise<void>;
  onLikeVideo: (video: ProfileVideo) => Promise<void>;
  language: AppLanguage;
  onRequireAuth: () => void;
}

export function LiveVideoView({
  currentProfile,
  currentUserId,
  isAdmin,
  liveStreams,
  videos,
  activeStreamId,
  streamComments,
  onSelectStream,
  onStartLiveStream,
  onEndLiveStream,
  onPostLiveComment,
  onPublishVideo,
  onLikeVideo,
  language,
  onRequireAuth,
}: LiveVideoViewProps) {
  const [liveTitle, setLiveTitle] = useState('');
  const [liveLang, setLiveLang] = useState('English');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDataUrl, setVideoDataUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(15);
  const [commentDraft, setCommentDraft] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const followersCount = currentProfile?.followersCount ?? 0;
  const isUnlocked = followersCount >= 1000 || isAdmin;
  const remainingFollowers = Math.max(0, 1000 - followersCount);
  const activeStream = liveStreams.find((s) => s.id === activeStreamId) ?? null;

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCameraPreview = async () => {
    setMediaError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setMediaError('Camera/microphone permission denied or unavailable on this device.');
    }
  };

  const stopCameraPreview = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleGoLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      onRequireAuth();
      return;
    }
    if (!isUnlocked) return;
    if (!liveTitle.trim()) return;
    setPublishing(true);
    setStatusMessage(null);
    try {
      await startCameraPreview();
      await onStartLiveStream(liveTitle.trim(), liveLang);
      setLiveTitle('');
      setStatusMessage('You are live now.');
    } finally {
      setPublishing(false);
    }
  };

  const handleVideoFileChange = (file: File | null) => {
    if (!file) return;
    setMediaError(null);
    if (file.size > 480000) {
      setMediaError('Please choose a short clip under 480KB for instant profile streaming.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setVideoDataUrl(String(reader.result));
      setVideoDuration(18);
    };
    reader.readAsDataURL(file);
  };

  const handlePostVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      onRequireAuth();
      return;
    }
    if (!isUnlocked || !videoTitle.trim() || !videoDataUrl) return;
    setPublishing(true);
    setStatusMessage(null);
    try {
      await onPublishVideo(videoTitle.trim(), videoDataUrl, videoDuration);
      setVideoTitle('');
      setVideoDataUrl('');
      setStatusMessage('Video published to your profile.');
    } finally {
      setPublishing(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStream || !commentDraft.trim()) return;
    if (!currentUserId) {
      onRequireAuth();
      return;
    }
    const text = commentDraft.trim();
    setCommentDraft('');
    await onPostLiveComment(activeStream.id, text);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-12 space-y-8">
      {/* Header & 1,000-Follower Gate Banner */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900">
            Global Live Streams & Creator Videos
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Watch verified creators worldwide or unlock your own broadcast studio at 1,000+ followers.
          </p>
        </div>

        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 min-w-[260px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
              {isUnlocked ? (
                <Unlock className="w-4 h-4 text-emerald-600" />
              ) : (
                <Lock className="w-4 h-4 text-zinc-500" />
              )}
              <span>
                {isUnlocked ? 'Creator Studio Unlocked' : t(language, 'unlock_live_title')}
              </span>
            </span>
            <span className="font-mono text-xs text-zinc-600 tabular-nums">
              {followersCount.toLocaleString()} / 1,000
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isUnlocked ? 'bg-emerald-600' : 'bg-zinc-900'
              }`}
              style={{ width: `${Math.min(100, (followersCount / 1000) * 100)}%` }}
            />
          </div>
          {!isUnlocked && (
            <p className="mt-2 text-xs text-zinc-500">
              {remainingFollowers.toLocaleString()} more followers needed to post videos & go live.
            </p>
          )}
        </div>
      </div>

      {/* Active Live Stream Viewer Modal / Spotlight */}
      {activeStream && (
        <section className="bg-white border border-zinc-200 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 relative bg-zinc-950 min-h-[340px] flex flex-col justify-between p-6 text-white">
            <img
              src={activeStream.hostPhoto}
              alt={activeStream.hostName}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-55"
            />
            {cameraActive && activeStream.hostId === currentUserId && (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-lg text-xs font-semibold">
                <Radio className="w-3.5 h-3.5" />
                <span>LIVE</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{activeStream.viewerCount} watching</span>
              </div>
              <button
                type="button"
                aria-label="Close live room"
                onClick={() => {
                  stopCameraPreview();
                  onSelectStream(null);
                }}
                className="p-2 bg-black/50 hover:bg-black/75 rounded-lg text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative z-10 pt-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent -mx-6 -mb-6 p-6">
              <h2 className="font-display text-xl font-bold">{activeStream.title}</h2>
              <p className="text-xs text-zinc-200 mt-1">
                Hosted by {activeStream.hostName} · {activeStream.language}
              </p>
              {activeStream.hostId === currentUserId && (
                <button
                  type="button"
                  onClick={() => {
                    stopCameraPreview();
                    onEndLiveStream(activeStream.id);
                  }}
                  className="mt-3 px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                >
                  End Broadcast
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col border-t lg:border-t-0 lg:border-l border-zinc-200">
            <div className="p-4 border-b border-zinc-100 font-display text-sm font-bold text-zinc-900">
              Live Room Chat
            </div>
            <div className="flex-1 p-4 space-y-2.5 max-h-[260px] overflow-y-auto bg-zinc-50/50">
              {streamComments.length === 0 ? (
                <p className="text-xs text-zinc-500 py-8 text-center">
                  Be the first to greet {activeStream.hostName} in the live chat.
                </p>
              ) : (
                streamComments.map((c) => (
                  <div key={c.id} className="text-xs">
                    <span className="font-semibold text-zinc-900 mr-1.5">{c.authorName}:</span>
                    <span className="text-zinc-700">{c.text}</span>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendComment} className="p-3 border-t border-zinc-100 flex gap-2">
              <input
                type="text"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Say something live..."
                maxLength={300}
                className="flex-1 h-10 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <button
                type="submit"
                className="px-3.5 h-10 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg flex items-center justify-center cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Grid: Live Now + Creator Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Live Broadcasts & Creator Videos Feed */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h2 className="font-display text-xl font-bold text-zinc-900 mb-4">
              Live Right Now
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {liveStreams.filter((s) => s.status === 'live').map((stream) => (
                <button
                  key={stream.id}
                  type="button"
                  onClick={() => onSelectStream(stream.id)}
                  className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden text-left hover:border-zinc-400 transition-colors cursor-pointer group"
                >
                  <div className="relative aspect-[4/3] bg-zinc-100">
                    <img
                      src={stream.hostPhoto}
                      alt={stream.hostName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-red-600 text-white text-[11px] font-semibold rounded-md flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      <span>LIVE</span>
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/65 text-white text-[11px] font-mono rounded-md flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{stream.viewerCount}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-zinc-900 group-hover:underline truncate">
                      {stream.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {stream.hostName} · {stream.language}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-zinc-900 mb-4">
              Creator Profile Videos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videos.map((vid) => (
                <article
                  key={vid.id}
                  className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden"
                >
                  <div className="relative aspect-[4/3] bg-zinc-900">
                    {vid.videoUrl ? (
                      <video
                        src={vid.videoUrl}
                        controls
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={vid.posterUrl || vid.creatorPhoto}
                        alt={vid.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-85"
                      />
                    )}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/65 text-white font-mono text-[11px] rounded-md">
                      0:{String(vid.durationSec).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {vid.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">
                        {vid.creatorName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onLikeVideo(vid)}
                      className="px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 text-red-600" />
                      <span className="font-mono tabular-nums">{vid.likesCount}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Creator Studio Panel (Locked below 1,000 Followers) */}
        <aside className="lg:col-span-5 space-y-6">
          {/* Go Live Form */}
          <form
            onSubmit={handleGoLive}
            className="bg-white border border-zinc-200/80 rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-red-600" />
                <span>{t(language, 'go_live')}</span>
              </h3>
              <span className="text-xs font-mono text-zinc-500">1,000+ followers</span>
            </div>

            {!isUnlocked && (
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                {t(language, 'unlock_live_desc')}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Broadcast Title
              </label>
              <input
                type="text"
                disabled={!isUnlocked}
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.target.value)}
                placeholder="e.g. Evening Q&A from Cape Town"
                maxLength={100}
                className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-xl disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Stream Language
              </label>
              <input
                type="text"
                disabled={!isUnlocked}
                value={liveLang}
                onChange={(e) => setLiveLang(e.target.value)}
                maxLength={30}
                className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-xl disabled:opacity-50"
              />
            </div>

            {mediaError && <p className="text-xs text-red-600">{mediaError}</p>}
            {statusMessage && <p className="text-xs text-emerald-700 font-medium">{statusMessage}</p>}

            <button
              type="submit"
              disabled={!isUnlocked || !liveTitle.trim() || publishing}
              className="w-full h-11 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-45 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>{t(language, 'go_live')}</span>
            </button>
          </form>

          {/* Post Profile Video Form */}
          <form
            onSubmit={handlePostVideo}
            className="bg-white border border-zinc-200/80 rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Film className="w-5 h-5 text-zinc-900" />
                <span>{t(language, 'post_video')}</span>
              </h3>
              <span className="text-xs font-mono text-zinc-500">1,000+ followers</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Video Title
              </label>
              <input
                type="text"
                disabled={!isUnlocked}
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Share a quick clip on your profile..."
                maxLength={100}
                className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-xl disabled:opacity-50"
              />
            </div>

            <label
              className={`block border-2 border-dashed rounded-xl p-4 text-center text-xs ${
                isUnlocked
                  ? 'border-zinc-300 hover:border-zinc-900 cursor-pointer text-zinc-700'
                  : 'border-zinc-200 text-zinc-400 opacity-50 cursor-not-allowed'
              }`}
            >
              <Upload className="w-5 h-5 mx-auto mb-1.5" />
              <span>{videoDataUrl ? 'Video clip ready to publish' : 'Select short video file (< 480KB)'}</span>
              <input
                type="file"
                accept="video/*"
                disabled={!isUnlocked}
                onChange={(e) => handleVideoFileChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={!isUnlocked || !videoTitle.trim() || !videoDataUrl || publishing}
              className="w-full h-11 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-45 rounded-xl transition-colors cursor-pointer"
            >
              {t(language, 'post_video')}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
