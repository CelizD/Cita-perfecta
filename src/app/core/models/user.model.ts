export type UserId = number | string;

export interface User {
  id: UserId;
  name: string;
  email: string;
  password?: string;
  birthDate: string;
  age: number;
  city?: string;
  bio?: string;
  interests: string[];
  communicationStyle?: string;
  loveLanguage?: string;
  dealbreakers?: string[];
  photoProfile?: string;
  pactAccepted: boolean;
  profileComplete: boolean;
  testComplete: boolean;
  pauseMode: boolean;
  premium: boolean;
}

export interface PublicProfile {
  id: number;
  name: string;
  age: number;
  city: string;
  bio: string;
  interests: string[];
  traits: string[];
  communicationStyle?: string;
  loveLanguage?: string;
  dealbreakers?: string[];
  prompt?: string;
  answers: number[];
  compatibility?: number;
  photoProfile?: string;
}
