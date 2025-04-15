'use client';

/**
 * Character data interface
 */
export interface CharacterData {
  id: string;
  name: string;
  title: string;
  sprite: string;
  primaryColor: string;
  textClass: string;
  bgClass: string;
  bio?: string;
}

/**
 * Character ID type for type safety
 */
export type CharacterId = 'kapoor' | 'jesse' | 'quinn' | 'garcia';

/**
 * Master character data repository
 */
export const CHARACTERS: Record<CharacterId, CharacterData> = {
  'kapoor': {
    id: 'kapoor',
    name: "Dr. Kapoor",
    title: "Chief Medical Physicist",
    sprite: "/characters/kapoor.png",
    primaryColor: "var(--clinical-color)",
    textClass: "text-clinical-light",
    bgClass: "bg-clinical",
    bio: "An experienced medical physicist who oversees radiation treatment planning."
  },
  'jesse': {
    id: 'jesse',
    name: "Technician Jesse",
    title: "Equipment Specialist",
    sprite: "/characters/jesse.png",
    primaryColor: "var(--qa-color)",
    textClass: "text-qa-light",
    bgClass: "bg-qa",
    bio: "A detail-oriented equipment specialist responsible for machine QA."
  },
  'quinn': {
    id: 'quinn',
    name: "Dr. Zephyr Quinn",
    title: "Experimental Researcher",
    sprite: "/characters/quinn.png",
    primaryColor: "var(--educational-color)",
    textClass: "text-educational-light",
    bgClass: "bg-educational",
    bio: "A brilliant researcher exploring novel approaches to radiation therapy."
  },
  'garcia': {
    id: 'garcia',
    name: "Dr. Garcia",
    title: "Radiation Oncologist",
    sprite: "/characters/garcia.png",
    primaryColor: "var(--clinical-alt-color)",
    textClass: "text-clinical-light",
    bgClass: "bg-clinical",
    bio: "A compassionate radiation oncologist focused on patient care."
  }
};

/**
 * Get character data by ID with fallback to Dr. Kapoor
 */
export const getCharacterData = (characterId: string): CharacterData => {
  return CHARACTERS[characterId as CharacterId] || CHARACTERS.kapoor;
}; 