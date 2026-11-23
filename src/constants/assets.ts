import type { AppLanguage } from '../types';

export const APP_NAME = 'SkillBattle';
export const BRAND_LOGO = '/assets/aistudio/file_00000000c48c8210ad608697e3ea85c9_fe179899.png';
export const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/JbxJsCAqE5dD0qcf7SAGXd?s=cl&p=a&iam=2';
export const TELEGRAM_URL = 'https://t.me/skillbattleofficial';
export const SUPPORT_TELEGRAM_URL = 'https://t.me/+917854967349';
export const INSTAGRAM_URL = 'https://www.instagram.com/emotex_flow';
export const YOUTUBE_URL = 'https://www.youtube.com/@Skillbattle2';

export const IMAGES = {
  HERO_GUIDE: '/src/assets/images/hero_guide_banner_1795319702905.jpg',
  TOP_GAME: '/src/assets/images/top_game_card_1795319702926.jpg',
  WIN_TROPHY: '/src/assets/images/win_trophy_banner_1795319702593.jpg',
  BATTLE_ART: '/src/assets/images/tourney_battle_art_1795319703104.jpg',
  HEADSHOT_ART: '/src/assets/images/tourney_headshot_art_1795319702890.jpg',
  MORE_PROMO: '/src/assets/images/more_promo_art_1795319703088.jpg',
} as const;

export const COPY: Record<
  AppLanguage,
  {
    more: string;
    play: string;
    account: string;
    tournaments: string;
    contests: string;
    myMatches: string;
    noUpcoming: string;
    explore: string;
    topGames: string;
    skillsMeetRewards: string;
    myTournaments: string;
    playMoreWinMore: string;
    viewAll: string;
    joinCommunity: string;
    totalMatches: string;
    winRate: string;
    totalWinnings: string;
  }
> = {
  en: {
    more: 'More',
    play: 'Play',
    account: 'Account',
    tournaments: 'Tournaments',
    contests: 'Contests',
    myMatches: 'My Matches',
    noUpcoming: 'No upcoming matches. Join one!',
    explore: 'EXPLORE',
    topGames: 'TOP GAMES',
    skillsMeetRewards: 'Skills Meet Rewards',
    myTournaments: 'MY TOURNAMENTS',
    playMoreWinMore: 'Play More, Win More',
    viewAll: 'View All ›',
    joinCommunity: 'Join Our Community',
    totalMatches: 'Total Matches',
    winRate: 'Win Rate',
    totalWinnings: 'Total Winnings',
  },
  hi: {
    more: 'More',
    play: 'Play',
    account: 'Account',
    tournaments: 'Tournaments',
    contests: 'Contests',
    myMatches: 'Mere Matches',
    noUpcoming: 'Koi upcoming match nahi hai. Join karein!',
    explore: 'EXPLORE',
    topGames: 'TOP GAMES',
    skillsMeetRewards: 'Skills Meet Rewards',
    myTournaments: 'MERE TOURNAMENTS',
    playMoreWinMore: 'Khelo Zyada, Jeeto Zyada',
    viewAll: 'Sab Dekhein ›',
    joinCommunity: 'Community Join Karein',
    totalMatches: 'Total Matches',
    winRate: 'Win Rate',
    totalWinnings: 'Total Jeet',
  },
};
