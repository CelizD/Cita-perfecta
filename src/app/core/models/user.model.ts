export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  birthDate: string;
  age: number;
  city?: string;
  bio?: string;
  interests: string[];
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
  answers: number[];
  compatibility?: number;
  photoProfile?: string;
}
