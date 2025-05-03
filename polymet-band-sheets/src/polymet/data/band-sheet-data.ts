export type SectionType =
  | "Verse"
  | "Chorus"
  | "Theme"
  | "Break"
  | "Bridge"
  | "Intro"
  | "Outro"
  | "Solo"
  | "Pre-Chorus";

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface Part {
  name: string;
  bars: number;
  lyrics?: string;
  notes?: string;
}

export interface Section {
  id: string;
  type: SectionType;
  color?: string;
  energyLevel?: EnergyLevel;
  parts: Part[];
}

export interface BandSheet {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

export interface Setlist {
  id: string;
  name: string;
  description?: string;
  sheets: BandSheet[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
}

export const MOCK_BAND_SHEETS: BandSheet[] = [
  {
    id: "sheet-1",
    title: "Come Together",
    artist: "The Beatles",
    bpm: 80,
    sections: [
      {
        id: "section-1",
        type: "Theme",
        color: "#f3f4f6",
        energyLevel: 2,
        parts: [
          {
            name: "A",
            bars: 4,
            lyrics: "(Shoot me) x 3",
            notes: "Band - no keys",
          },
        ],
      },
      {
        id: "section-2",
        type: "Verse",
        color: "#e5e7eb",
        energyLevel: 3,
        parts: [
          {
            name: "B",
            bars: 4,
            lyrics: "He wear no shoeshine, he got toe-jam football",
            notes: "Add notes here...",
          },
          {
            name: "C",
            bars: 2,
            lyrics: 'He say, "I know you, you know me"',
            notes: "Add notes here...",
          },
        ],
      },
      {
        id: "section-3",
        type: "Chorus",
        color: "#d1d5db",
        energyLevel: 4,
        parts: [
          {
            name: "E",
            bars: 4,
            lyrics: "Come together, right now, Over me",
            notes: "Band - no keys",
          },
        ],
      },
      {
        id: "section-4",
        type: "Theme",
        color: "#f3f4f6",
        energyLevel: 2,
        parts: [
          {
            name: "A",
            bars: 4,
            lyrics: "(Shoot me) x 3",
            notes: "Band - no keys",
          },
        ],
      },
      {
        id: "section-5",
        type: "Verse",
        color: "#e5e7eb",
        energyLevel: 3,
        parts: [
          {
            name: "B",
            bars: 4,
            lyrics: "He wear no shoeshine, he got toe-jam football",
            notes: "Add notes here...",
          },
          {
            name: "C",
            bars: 2,
            lyrics: 'He say, "I know you, you know me"',
            notes: "Add notes here...",
          },
        ],
      },
      {
        id: "section-6",
        type: "Chorus",
        color: "#d1d5db",
        energyLevel: 4,
        parts: [
          {
            name: "E",
            bars: 4,
            lyrics: "Come together, right now, Over me",
            notes: "Band - no keys",
          },
        ],
      },
      {
        id: "section-7",
        type: "Theme",
        color: "#f3f4f6",
        energyLevel: 2,
        parts: [
          {
            name: "A",
            bars: 4,
            lyrics: "(Shoot me) x 3",
            notes: "Band - no keys",
          },
        ],
      },
      {
        id: "section-8",
        type: "Verse",
        color: "#e5e7eb",
        energyLevel: 3,
        parts: [
          {
            name: "B",
            bars: 4,
            lyrics: "Here come old flat-top, he come groovin' up slowly",
            notes: "Add notes here...",
          },
          {
            name: "C",
            bars: 2,
            lyrics: "He got hair down to his knee",
            notes: "Add notes here...",
          },
        ],
      },
      {
        id: "section-9",
        type: "Break",
        color: "#9ca3af",
        energyLevel: 3,
        parts: [
          {
            name: "D",
            bars: 2,
            lyrics: "Got to be a joker, he just do what he please",
            notes: "Only Drums",
          },
        ],
      },
      {
        id: "section-10",
        type: "Theme",
        color: "#f3f4f6",
        energyLevel: 2,
        parts: [
          {
            name: "A",
            bars: 4,
            lyrics: "(Shoot me) x 3",
            notes: "Band - no keys",
          },
        ],
      },
    ],

    createdAt: "2023-05-01T12:00:00Z",
    updatedAt: "2023-05-02T14:30:00Z",
  },
  {
    id: "sheet-2",
    title: "Stuck in the Middle With You",
    artist: "Stealers Wheel",
    bpm: 125,
    sections: [
      {
        id: "section-1",
        type: "Intro",
        color: "#fee2e2",
        energyLevel: 3,
        parts: [
          {
            name: "A",
            bars: 4,
            lyrics: "",
            notes: "Guitar and drums only",
          },
        ],
      },
      {
        id: "section-2",
        type: "Verse",
        color: "#fecaca",
        energyLevel: 3,
        parts: [
          {
            name: "B",
            bars: 8,
            lyrics:
              "Well, I don't know why I came here tonight\nI got the feeling that something ain't right",
            notes: "Full band",
          },
        ],
      },
      {
        id: "section-3",
        type: "Chorus",
        color: "#fca5a5",
        energyLevel: 4,
        parts: [
          {
            name: "C",
            bars: 8,
            lyrics:
              "Clowns to the left of me, jokers to the right\nHere I am, stuck in the middle with you",
            notes: "Emphasize backing vocals",
          },
        ],
      },
    ],

    createdAt: "2023-05-03T10:15:00Z",
    updatedAt: "2023-05-03T16:45:00Z",
  },
  {
    id: "sheet-3",
    title: "Georgy Porgy",
    artist: "Toto",
    bpm: 98,
    sections: [
      {
        id: "section-1",
        type: "Intro",
        color: "#dbeafe",
        energyLevel: 2,
        parts: [
          {
            name: "A",
            bars: 4,
            lyrics: "",
            notes: "Keys intro",
          },
        ],
      },
      {
        id: "section-2",
        type: "Verse",
        color: "#bfdbfe",
        energyLevel: 3,
        parts: [
          {
            name: "B",
            bars: 8,
            lyrics:
              "Georgy Porgy, pudding pie\nKissed the girls and made them cry",
            notes: "Smooth groove",
          },
        ],
      },
    ],

    createdAt: "2023-05-04T09:30:00Z",
    updatedAt: "2023-05-04T11:20:00Z",
  },
  {
    id: "sheet-4",
    title: "I Will Survive",
    artist: "Scary Pockets",
    bpm: 108,
    sections: [
      {
        id: "section-1",
        type: "Intro",
        color: "#d1fae5",
        energyLevel: 1,
        parts: [
          {
            name: "A",
            bars: 4,
            lyrics: "",
            notes: "Piano solo",
          },
        ],
      },
      {
        id: "section-2",
        type: "Verse",
        color: "#a7f3d0",
        energyLevel: 2,
        parts: [
          {
            name: "B",
            bars: 8,
            lyrics:
              "At first I was afraid, I was petrified\nKept thinking I could never live without you by my side",
            notes: "Gradually build",
          },
        ],
      },
      {
        id: "section-3",
        type: "Chorus",
        color: "#6ee7b7",
        energyLevel: 4,
        parts: [
          {
            name: "C",
            bars: 8,
            lyrics:
              "Oh no, not I, I will survive\nOh, as long as I know how to love, I know I'll stay alive",
            notes: "Full energy",
          },
        ],
      },
    ],

    createdAt: "2023-05-05T14:20:00Z",
    updatedAt: "2023-05-05T18:10:00Z",
  },
  {
    id: "sheet-5",
    title: "Mine Damer og Herrer (Velkommen)",
    artist: "Dan Turell og Sølvstjernerne",
    bpm: 96,
    sections: [
      {
        id: "section-1",
        type: "Intro",
        color: "#fef3c7",
        energyLevel: 2,
        parts: [
          {
            name: "A",
            bars: 4,
            lyrics: "",
            notes: "Bass groove",
          },
        ],
      },
      {
        id: "section-2",
        type: "Verse",
        color: "#fde68a",
        energyLevel: 3,
        parts: [
          {
            name: "B",
            bars: 8,
            lyrics: "Mine damer og herrer\nVelkommen til dette show",
            notes: "Spoken word style",
          },
        ],
      },
    ],

    createdAt: "2023-05-06T11:00:00Z",
    updatedAt: "2023-05-06T13:45:00Z",
  },
];

export const MOCK_SETLISTS: Setlist[] = [
  {
    id: "setlist-1",
    name: "50th",
    description: "No description",
    sheets: [
      MOCK_BAND_SHEETS[4],
      MOCK_BAND_SHEETS[0],
      MOCK_BAND_SHEETS[1],
      MOCK_BAND_SHEETS[2],
      MOCK_BAND_SHEETS[3],
      MOCK_BAND_SHEETS[1],
    ],

    createdAt: "2023-05-10T09:00:00Z",
    updatedAt: "2023-05-10T15:30:00Z",
    isPublic: true,
  },
  {
    id: "setlist-2",
    name: "Jazz Night",
    description: "Smooth jazz standards",
    sheets: [MOCK_BAND_SHEETS[2], MOCK_BAND_SHEETS[3]],
    createdAt: "2023-05-11T14:20:00Z",
    updatedAt: "2023-05-11T16:45:00Z",
    isPublic: false,
  },
  {
    id: "setlist-3",
    name: "Rock Classics",
    description: "Classic rock hits",
    sheets: [MOCK_BAND_SHEETS[0], MOCK_BAND_SHEETS[1]],
    createdAt: "2023-05-12T10:30:00Z",
    updatedAt: "2023-05-12T12:15:00Z",
    isPublic: true,
  },
];
