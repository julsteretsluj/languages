import type { Language } from "./types";

export const LANGUAGES: Language[] = [
  {
    id: "asl",
    name: "American Sign Language",
    nativeName: "ASL",
    flag: "🤟",
    modality: "signed",
    accent: "#007AFF",
    description: "The primary signed language of Deaf communities in the US and parts of Canada.",
  },
  {
    id: "bsl",
    name: "British Sign Language",
    nativeName: "BSL",
    flag: "🙌",
    modality: "signed",
    accent: "#FF2D55",
    description: "The signed language of the British Deaf community — distinct from ASL.",
  },
  {
    id: "isl",
    name: "International Sign",
    nativeName: "IS",
    flag: "🌐",
    modality: "signed",
    accent: "#5856D6",
    description: "A contact signed system used at international Deaf gatherings and events.",
  },
  {
    id: "nzsl",
    name: "New Zealand Sign Language",
    nativeName: "NZSL",
    flag: "🇳🇿",
    modality: "signed",
    accent: "#000000",
    description: "An official language of Aotearoa New Zealand, related to BSL and Auslan.",
  },
  {
    id: "maori",
    name: "Māori",
    nativeName: "Te Reo Māori",
    flag: "🌿",
    modality: "spoken",
    accent: "#34C759",
    description: "The Indigenous language of the Māori people of Aotearoa New Zealand.",
  },
  {
    id: "mandarin",
    name: "Mandarin Chinese",
    nativeName: "普通话",
    flag: "🇨🇳",
    modality: "spoken",
    accent: "#FF3B30",
    description: "The most widely spoken Chinese variety, with tones and characters.",
  },
  {
    id: "latin",
    name: "Latin",
    nativeName: "Latina",
    flag: "🏛️",
    modality: "spoken",
    accent: "#AF52DE",
    description: "The classical language of Rome — foundation of Romance languages.",
  },
  {
    id: "dutch",
    name: "Dutch",
    nativeName: "Nederlands",
    flag: "🇳🇱",
    modality: "spoken",
    accent: "#FF9500",
    description: "A West Germanic language spoken in the Netherlands and Belgium.",
  },
  {
    id: "spanish",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    modality: "spoken",
    accent: "#FF6B00",
    description: "A global Romance language spoken across Spain and the Americas.",
  },
];

export function getLanguage(id: string): Language | undefined {
  return LANGUAGES.find((l) => l.id === id);
}
