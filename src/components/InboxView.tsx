import { useState } from 'react';
import { ArrowLeft, Globe, MessageCircle, Send } from 'lucide-react';
import { t } from '../i18n';
import { AppLanguage, ChatMessage, Conversation } from '../types';

interface InboxViewProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (convId: string) => void;
  messages: ChatMessage[];
  currentUserId: string | null;
  onSendMessage: (convId: string, text: string) => Promise<void>;
  language: AppLanguage;
  onGoDiscover: () => void;
  onRequireAuth: () => void;
}

export function InboxView({
  conversations,
  activeConversationId,
  onSelectConversation,
  messages,
  currentUserId,
  onSendMessage,
  language,
  onGoDiscover,
  onRequireAuth,
}: InboxViewProps) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showLanguageTag, setShowLanguageTag] = useState(true);

  const activeConv = conversations.find((c) => c.id === activeConversationId) ?? null;

  const getPartner = (conv: Conversation) => {
    const isUserA = conv.userA === currentUserId;
    return {
      name: isUserA ? conv.userBName : conv.userAName,
      photo: isUserA ? conv.userBPhoto : conv.userAPhoto,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !draft.trim() || sending) return;
    const text = draft.trim();
    setDraft('');
    setSending(true);
    try {
      await onSendMessage(activeConv.id, text);
    } finally {
      setSending(false);
    }
  };

  if (!currentUserId) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white border border-zinc-200 rounded-3xl p-10">
          <MessageCircle className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h2 className="font-display text-2xl font-bold text-zinc-900">
            {t(language, 'inbox_title')}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Sign in to view your private SMASH conversations and message global matches in real time.
          </p>
          <button
            type="button"
            onClick={onRequireAuth}
            className="mt-6 px-6 py-2.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            {t(language, 'sign_in')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-10">
      <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
        {/* Conversations List */}
        <aside
          className={`md:col-span-4 border-r border-zinc-200/80 flex flex-col ${
            activeConv ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-zinc-900">
              {t(language, 'inbox_title')}
            </h2>
            <span className="font-mono text-xs text-zinc-500 tabular-nums">
              {conversations.length}
            </span>
          </div>

          {conversations.length === 0 ? (
            <div className="p-8 text-center my-auto">
              <p className="text-sm text-zinc-600">{t(language, 'inbox_empty')}</p>
              <button
                type="button"
                onClick={onGoDiscover}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                {t(language, 'nav_discover')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 overflow-y-auto flex-1">
              {conversations.map((conv) => {
                const partner = getPartner(conv);
                const selected = conv.id === activeConv?.id;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full p-4 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                      selected ? 'bg-zinc-100/80' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <img
                      src={partner.photo}
                      alt={partner.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover shrink-0 bg-zinc-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {partner.name}
                      </p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {conv.lastMessage || 'New SMASH connection'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Active Conversation Thread */}
        <section
          className={`md:col-span-8 flex flex-col ${
            activeConv ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeConv ? (
            <>
              <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    aria-label="Back to conversations"
                    onClick={() => onSelectConversation('')}
                    className="md:hidden p-2 -ml-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img
                    src={getPartner(activeConv).photo}
                    alt={getPartner(activeConv).name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover shrink-0 bg-zinc-100"
                  />
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-zinc-900 truncate">
                      {getPartner(activeConv).name}
                    </h3>
                    <p className="text-xs text-emerald-700 font-medium">
                      Matched via SMASH · Private Chat
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLanguageTag((prev) => !prev)}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{showLanguageTag ? 'Lang Tags On' : 'Lang Tags Off'}</span>
                </button>
              </div>

              <div className="flex-1 p-4 sm:p-6 space-y-3 overflow-y-auto max-h-[460px] bg-zinc-50/40">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-sm text-zinc-500">
                    You smashed {getPartner(activeConv).name}! Say hello and break the ice.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                            isMine
                              ? 'bg-zinc-900 text-white'
                              : 'bg-white border border-zinc-200 text-zinc-900'
                          }`}
                        >
                          <p className="leading-relaxed break-words">{msg.text}</p>
                          {showLanguageTag && (
                            <p
                              className={`mt-1 text-[10px] ${
                                isMine ? 'text-zinc-400' : 'text-zinc-400'
                              }`}
                            >
                              {msg.language.toUpperCase()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-4 border-t border-zinc-100 bg-white flex items-center gap-3"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t(language, 'type_message')}
                  maxLength={1000}
                  className="flex-1 h-11 px-4 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="h-11 px-5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>{t(language, 'send')}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <MessageCircle className="w-10 h-10 text-zinc-300 mb-3" />
              <h3 className="font-display text-lg font-semibold text-zinc-900">
                Select a conversation
              </h3>
              <p className="mt-1 text-sm text-zinc-500 max-w-sm">
                Choose a match from the left panel or click SMASH on any profile in Discover to open a private chat immediately.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
