import { AppLanguage } from './types';

export const LANGUAGE_OPTIONS: { code: AppLanguage; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
];

type TranslationKey =
  | 'nav_discover'
  | 'nav_inbox'
  | 'nav_live'
  | 'nav_monetize'
  | 'nav_profile'
  | 'sign_in'
  | 'sign_out'
  | 'smash'
  | 'pass'
  | 'scroll_hint'
  | 'followers'
  | 'follow'
  | 'following'
  | 'interests'
  | 'languages'
  | 'global_filter'
  | 'all_genders'
  | 'all_regions'
  | 'all_languages'
  | 'inbox_title'
  | 'inbox_empty'
  | 'type_message'
  | 'send'
  | 'unlock_live_title'
  | 'unlock_live_desc'
  | 'go_live'
  | 'post_video'
  | 'monetize_title'
  | 'profile_settings';

const DICTIONARY: Record<AppLanguage, Record<TranslationKey, string>> = {
  en: {
    nav_discover: 'Discover',
    nav_inbox: 'Inbox',
    nav_live: 'Live & Video',
    nav_monetize: 'Monetize',
    nav_profile: 'Profile',
    sign_in: 'Sign In',
    sign_out: 'Sign Out',
    smash: 'SMASH',
    pass: 'PASS',
    scroll_hint: 'Scroll up or swipe left to pass · Swipe right or click SMASH to message',
    followers: 'followers',
    follow: 'Follow',
    following: 'Following',
    interests: 'Interests',
    languages: 'Languages',
    global_filter: 'Global Matchmaking',
    all_genders: 'All Genders',
    all_regions: 'Global',
    all_languages: 'All Languages',
    inbox_title: 'Private Conversations',
    inbox_empty: 'Click SMASH on any profile to start a private conversation.',
    type_message: 'Write a private message...',
    send: 'Send',
    unlock_live_title: '1,000 Followers Required',
    unlock_live_desc: 'Reach 1,000 followers to unlock posting videos and live broadcasting on your profile.',
    go_live: 'Go Live',
    post_video: 'Post Video',
    monetize_title: 'Monetization & Revenue',
    profile_settings: 'Profile & Photos',
  },
  fr: {
    nav_discover: 'Découvrir',
    nav_inbox: 'Messages',
    nav_live: 'Direct & Vidéo',
    nav_monetize: 'Revenus',
    nav_profile: 'Profil',
    sign_in: 'Connexion',
    sign_out: 'Déconnexion',
    smash: 'SMASH',
    pass: 'PASS',
    scroll_hint: 'Faites défiler vers le haut pour passer · Cliquez sur SMASH pour discuter',
    followers: 'abonnés',
    follow: 'Suivre',
    following: 'Abonné',
    interests: 'Centres d’intérêt',
    languages: 'Langues',
    global_filter: 'Rencontres Mondiales',
    all_genders: 'Tous genres',
    all_regions: 'Monde',
    all_languages: 'Toutes langues',
    inbox_title: 'Messages Privés',
    inbox_empty: 'Cliquez sur SMASH sur un profil pour démarrer une conversation.',
    type_message: 'Écrire un message privé...',
    send: 'Envoyer',
    unlock_live_title: '1 000 abonnés requis',
    unlock_live_desc: 'Atteignez 1 000 abonnés pour publier des vidéos et lancer un direct.',
    go_live: 'Lancer un direct',
    post_video: 'Publier une vidéo',
    monetize_title: 'Monétisation & Revenus',
    profile_settings: 'Profil & Photos',
  },
  es: {
    nav_discover: 'Descubrir',
    nav_inbox: 'Bandeja',
    nav_live: 'En Vivo',
    nav_monetize: 'Monetizar',
    nav_profile: 'Perfil',
    sign_in: 'Iniciar sesión',
    sign_out: 'Salir',
    smash: 'SMASH',
    pass: 'PASS',
    scroll_hint: 'Desliza hacia arriba para pasar · Pulsa SMASH para chatear en privado',
    followers: 'seguidores',
    follow: 'Seguir',
    following: 'Siguiendo',
    interests: 'Intereses',
    languages: 'Idiomas',
    global_filter: 'Conexión Global',
    all_genders: 'Todos',
    all_regions: 'Global',
    all_languages: 'Todos los idiomas',
    inbox_title: 'Mensajes Privados',
    inbox_empty: 'Pulsa SMASH en un perfil para abrir una conversación privada.',
    type_message: 'Escribe un mensaje privado...',
    send: 'Enviar',
    unlock_live_title: '1,000 seguidores requeridos',
    unlock_live_desc: 'Alcanza 1,000 seguidores para publicar videos y transmitir en vivo.',
    go_live: 'Transmitir en vivo',
    post_video: 'Publicar video',
    monetize_title: 'Monetización e Ingresos',
    profile_settings: 'Perfil y Fotos',
  },
  pt: {
    nav_discover: 'Descobrir',
    nav_inbox: 'Mensagens',
    nav_live: 'Ao Vivo',
    nav_monetize: 'Monetizar',
    nav_profile: 'Perfil',
    sign_in: 'Entrar',
    sign_out: 'Sair',
    smash: 'SMASH',
    pass: 'PASS',
    scroll_hint: 'Role para cima para passar · Clique em SMASH para conversar',
    followers: 'seguidores',
    follow: 'Seguir',
    following: 'Seguindo',
    interests: 'Interesses',
    languages: 'Idiomas',
    global_filter: 'Conexão Global',
    all_genders: 'Todos',
    all_regions: 'Global',
    all_languages: 'Todos idiomas',
    inbox_title: 'Conversas Privadas',
    inbox_empty: 'Clique em SMASH em qualquer perfil para iniciar uma conversa.',
    type_message: 'Escreva uma mensagem privada...',
    send: 'Enviar',
    unlock_live_title: '1.000 seguidores necessários',
    unlock_live_desc: 'Alcance 1.000 seguidores para postar vídeos e transmitir ao vivo.',
    go_live: 'Entrar ao vivo',
    post_video: 'Postar vídeo',
    monetize_title: 'Monetização e Receita',
    profile_settings: 'Perfil e Fotos',
  },
  de: {
    nav_discover: 'Entdecken',
    nav_inbox: 'Postfach',
    nav_live: 'Live & Video',
    nav_monetize: 'Einnahmen',
    nav_profile: 'Profil',
    sign_in: 'Anmelden',
    sign_out: 'Abmelden',
    smash: 'SMASH',
    pass: 'PASS',
    scroll_hint: 'Nach oben scrollen zum Überspringen · SMASH für privaten Chat',
    followers: 'Follower',
    follow: 'Folgen',
    following: 'Gefolgt',
    interests: 'Interessen',
    languages: 'Sprachen',
    global_filter: 'Globale Suche',
    all_genders: 'Alle',
    all_regions: 'Global',
    all_languages: 'Alle Sprachen',
    inbox_title: 'Private Nachrichten',
    inbox_empty: 'Klicke bei einem Profil auf SMASH, um einen Chat zu starten.',
    type_message: 'Private Nachricht schreiben...',
    send: 'Senden',
    unlock_live_title: '1.000 Follower erforderlich',
    unlock_live_desc: 'Erreiche 1.000 Follower, um Videos zu posten und live zu gehen.',
    go_live: 'Live gehen',
    post_video: 'Video posten',
    monetize_title: 'Monetarisierung & Umsatz',
    profile_settings: 'Profil & Fotos',
  },
  ja: {
    nav_discover: '探す',
    nav_inbox: 'メッセージ',
    nav_live: 'ライブ・動画',
    nav_monetize: '収益化',
    nav_profile: 'プロフィール',
    sign_in: 'ログイン',
    sign_out: 'ログアウト',
    smash: 'SMASH',
    pass: 'PASS',
    scroll_hint: '上にスクロールでパス · SMASHを押すとメッセージ画面へ進みます',
    followers: 'フォロワー',
    follow: 'フォロー',
    following: 'フォロー中',
    interests: '興味・関心',
    languages: '対応言語',
    global_filter: 'グローバル検索',
    all_genders: 'すべて',
    all_regions: '全世界',
    all_languages: 'すべての言語',
    inbox_title: 'プライベートメッセージ',
    inbox_empty: '気になる相手をSMASHするとチャットが始まります。',
    type_message: 'メッセージを入力...',
    send: '送信',
    unlock_live_title: 'フォロワー1,000人以上で解放',
    unlock_live_desc: 'フォロワー1,000人を達成すると動画投稿とライブ配信が利用できます。',
    go_live: 'ライブ配信を開始',
    post_video: '動画を投稿',
    monetize_title: '収益ダッシュボード',
    profile_settings: 'プロフィール・写真',
  },
};

export function t(lang: AppLanguage, key: TranslationKey): string {
  return DICTIONARY[lang]?.[key] ?? DICTIONARY.en[key];
}
