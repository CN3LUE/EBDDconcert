export type SkyTheme = 'day' | 'sunset' | 'night';
export type ViewMode = 'plaza' | 'arena';
export type AvatarAction = 'idle' | 'walk' | 'run' | 'wave' | 'cheer' | 'greet' | 'sit' | 'cry';
export type OutfitStyle = 'track_jacket' | 'white_tee' | 'navy_tee' | 'sky_tee';
export type CapStyle = 'official_cap' | 'navy_cap' | 'none';
export type HandItemType = 'fan' | 'lightstick' | 'slogan' | 'none';
export type HairStyle = 'long' | 'ponytail' | 'short';
export type ActiveModalType =
  | 'none'
  | 'advent'
  | 'memos'
  | 'room'
  | 'profile'
  | 'settings'
  | 'seatmap'
  | 'minigames';

export interface UserProfileState {
  name: string;
  seatZone: string;
  hoodieColor: string;
  lightstickColor: string;
  hairStyle: HairStyle;
  outfitStyle: OutfitStyle;
  capStyle: CapStyle;
  hasSloganTowel: boolean;
  hasWristband: boolean;
  leftHandItem: HandItemType;
  rightHandItem: HandItemType;
}

export interface FanPeer {
  id: string;
  name: string;
  seatZone: string;
  hoodieColor: string;
  lightstickColor: string;
  hairStyle?: HairStyle;
  outfitStyle?: OutfitStyle;
  capStyle?: CapStyle;
  hasSloganTowel?: boolean;
  hasWristband?: boolean;
  leftHandItem?: HandItemType;
  rightHandItem?: HandItemType;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  rotationY: number;
  action: AvatarAction;
  actionUntil?: number;
  speech?: string;
  speechUntil?: number;
  isNpc?: boolean;
  laneRadius?: number;
  trackAngle?: number;
}

export interface PlazaMemo {
  id: string;
  authorId?: string;
  author: string;
  seatZone: string;
  text: string;
  color: string;
  x: number;
  z: number;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface SeatSectionInfo {
  id: string;
  label: string;
  tier: 'FLOOR' | '1F' | '2F';
  badge?: '에' | '바' | '뛰';
  x: number;
  y: number;
  z: number;
  rotY: number;
  width: number;
  depth: number;
  color: number;
}

export interface AdventDailyItem {
  dateStr: string;
  monthKey: string;
  year: number;
  month: number;
  day: number;
  dow: number;
  dayNumber: number;
  dDay: number;
  title: string;
  question: string;
  rewardLabel: string;
  sampleAnswers: string[];
}

export interface DomeAlbumSpineInfo {
  slot: number;
  id: string;
  title: string;
  subtitle: string;
  comingSoon?: boolean;
}

export interface MiniGameAvatarLook {
  hoodieColor: string;
  lightstickColor: string;
  hairStyle: HairStyle;
  capStyle: CapStyle;
  leftHandItem: HandItemType;
  rightHandItem: HandItemType;
}

export interface PublicAdventAnswer {
  id: string;
  dateStr: string;
  text: string;
  createdAt: number;
}
