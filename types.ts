export enum Category {
  ANIMALS = 'Animals',
  FRUITS = 'Fruits',
}

export interface ColoringPageItem {
  id: string;
  name: string;
  emoji: string;
}

export interface GeneratedImage {
  id: string;
  imageUrl: string; // Base64 data URL
  prompt: string;
  timestamp: number;
}

export type AppStep = 'HOME' | 'CATEGORY' | 'ITEM' | 'QUANTITY' | 'GENERATING' | 'RESULTS' | 'ONLINE_COLORING';