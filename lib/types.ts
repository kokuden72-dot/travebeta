export type ThemeMode = 'light' | 'dark';
export type DisplayMode = 'desktop' | 'mobile';

export interface Settings {
  name: string;
  theme: ThemeMode;
  displayMode: DisplayMode;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface Idea {
  id: string;
  userId: string;
  userName: string;
  posName: string;
  mainTxt: string;
  tags: string[];
  createdAt: string;
  latitude: number;
  longitude: number;
  likes: number;
}

export interface IdeaComment {
  id: string;
  ideaId: string;
  userId: string;
  userName: string;
  comTxt: string;
  createdAt: string;
}

export interface ThreadItem {
  id: string;
  userId: string;
  userName: string;
  title: string;
  createdAt: string;
}

export interface ThreadComment {
  id: string;
  threadId: string;
  userId: string;
  userName: string;
  comTxt: string;
  likes: number;
  createdAt: string;
}
