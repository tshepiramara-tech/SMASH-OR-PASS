import { User } from 'firebase/auth';
import { Flame, MessageCircle, Radio, DollarSign, UserCheck } from 'lucide-react';
import { t } from '../i18n';
import { AppLanguage, NavTab } from '../types';

interface TopNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  language: AppLanguage;
  unreadCount: number;
}

export function TopNav({
  activeTab,
  onSelectTab,
  user,
  onSignIn,
  onSignOut,
  language,
  unreadCount,
}: TopNavProps) {
  const navItems: { id: NavTab; label: string }[] = [
    { id: 'discover', label: t(language, 'nav_discover') },
    { id: 'inbox', label: unreadCount > 0 ? `${t(language, 'nav_inbox')} (${unreadCount})` : t(language, 'nav_inbox') },
    { id: 'live', label: t(language, 'nav_live') },
    { id: 'monetize', label: t(language, 'nav_monetize') },
    { id: 'profile', label: t(language, 'nav_profile') },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('discover')}
            className="font-display text-lg sm:text-xl font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            SMASH OR PASS
          </button>

          {/* Zone 2: Navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    active
                      ? 'text-zinc-900 border-zinc-900'
                      : 'text-zinc-500 border-transparent hover:text-zinc-900 hover:border-zinc-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            {user ? (
              <button
                type="button"
                onClick={onSignOut}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t(language, 'sign_out')}
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t(language, 'sign_in')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab navigation (<= 15% mobile height combined with header) */}
      <nav
        aria-label="Primary mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 grid grid-cols-5 h-16"
      >
        <button
          type="button"
          onClick={() => onSelectTab('discover')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            activeTab === 'discover' ? 'text-zinc-900 font-semibold' : 'text-zinc-500'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px] mt-1 whitespace-nowrap">{t(language, 'nav_discover')}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('inbox')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            activeTab === 'inbox' ? 'text-zinc-900 font-semibold' : 'text-zinc-500'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] mt-1 whitespace-nowrap">{t(language, 'nav_inbox')}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('live')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            activeTab === 'live' ? 'text-zinc-900 font-semibold' : 'text-zinc-500'
          }`}
        >
          <Radio className="w-5 h-5" />
          <span className="text-[10px] mt-1 whitespace-nowrap">{t(language, 'nav_live')}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('monetize')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            activeTab === 'monetize' ? 'text-zinc-900 font-semibold' : 'text-zinc-500'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] mt-1 whitespace-nowrap">{t(language, 'nav_monetize')}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            activeTab === 'profile' ? 'text-zinc-900 font-semibold' : 'text-zinc-500'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] mt-1 whitespace-nowrap">{t(language, 'nav_profile')}</span>
        </button>
      </nav>
    </>
  );
}
