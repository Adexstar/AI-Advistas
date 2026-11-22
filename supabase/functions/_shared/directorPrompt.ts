// Director briefs. The Enhance function sends this structure to the text
// model. The same builder is used by AI Studio, the template generator,
// and the assistant, so the shape of a production prompt stays consistent.

export const DIRECTOR_CATEGORIES = [
  'fashion/sneakers',
  'beauty/perfume',
  'food & drink',
  'real estate',
  'tech/gadgets',
  'automotive',
  'fitness',
  'events',
  'generic',
] as const;

export type DirectorCategory = (typeof DIRECTOR_CATEGORIES)[number];

export const CAMERA_MOVES = [
  'macro glide',
  'slow-motion tracking',
  'orbit',
  'crane pull-back',
  'reveal',
] as const;

const CATEGORY_SETTING: Record<DirectorCategory, string> = {
  'fashion/sneakers': 'a clean studio floor with a single hard shadow and a soft paper sweep',
  'beauty/perfume': 'a marble vanity with one glass highlight and a quiet dark background',
  'food & drink': 'a short tabletop with one plate, one glass, and a linen fold',
  'real estate': 'the actual room, with the window light left where it is',
  'tech/gadgets': 'a matte desk, one product, and a thin reflection on the surface',
  automotive: 'an open concrete bay, the car in three-quarter view, no extra vehicles',
  fitness: 'a gym floor with one piece of equipment and even daylight',
  events: 'the venue as it is, with the crowd held out of the product frame',
  generic: 'a simple set that does not add products, people, or signage',
};

const CATEGORY_LIGHT: Record<DirectorCategory, string> = {
  'fashion/sneakers': 'soft key from the left, a small rim on the sole, no colour gel',
  'beauty/perfume': 'soft beauty light, a single specular on glass, no colour cast',
  'food & drink': 'warm practical light, steam only if the product already has it',
  'real estate': 'the existing window light, no new lamps and no sky replacement',
  'tech/gadgets': 'neutral daylight, a controlled reflection, no neon',
  automotive: 'long soft light down the body line, no coloured rim',
  fitness: 'even daylight, no dramatic smoke',
  events: 'the venue lighting, held steady',
  generic: 'neutral soft light, no gels, no fog',
};

const NEGATIVES = [
  'no colour shifts',
  'no extra products',
  'no warped or garbled text',
  'no extra limbs',
];

export interface DirectorInput {
  mode: 'image' | 'video';
  category: DirectorCategory;
  prompt: string;
  duration?: number;
  aspect?: string;
}

export interface ShotBeat {
  index: number;
  start: number;
  end: number;
  move: (typeof CAMERA_MOVES)[number];
}

export function shotPlan(durationSeconds: number): ShotBeat[] {
  const duration = Math.min(30, Math.max(4, Math.round(durationSeconds || 5)));
  const count = duration <= 5 ? 3 : duration <= 10 ? 4 : 5;
  const slice = duration / count;
  return CAMERA_MOVES.slice(0, count).map((move, index) => ({
    index: index + 1,
    start: Math.round(index * slice * 10) / 10,
    end: Math.round((index === count - 1 ? duration : (index + 1) * slice) * 10) / 10,
    move,
  }));
}

export function buildDirectorPrompt(input: DirectorInput): string {
  const category = DIRECTOR_CATEGORIES.includes(input.category) ? input.category : 'generic';
  const brief = (input.prompt || '').trim() || 'the product already in the reference';
  const aspect = input.aspect || '16:9';
  const preserve = [
    'Exact preservation: the logo, any text, the colours, the materials, and the proportions stay identical to the reference.',
    'Do not redraw the product and do not invent a second version of it.',
  ].join(' ');

  if (input.mode === 'image') {
    return [
      `Category: ${category}.`,
      `Subject: ${brief}.`,
      `Composition: one product, ${aspect}, with clear space for a headline. Setting: ${CATEGORY_SETTING[category]}.`,
      `Lighting: ${CATEGORY_LIGHT[category]}.`,
      preserve,
      `Negative: ${NEGATIVES.join(', ')}.`,
    ].join('\n');
  }

  const duration = Math.min(30, Math.max(4, Math.round(input.duration || 5)));
  const shots = shotPlan(duration)
    .map((shot) => `${shot.index}. ${shot.start}s–${shot.end}s ${shot.move} on the same product.`)
    .join('\n');
  return [
    `Category: ${category}. Duration ${duration}s. Frame ${aspect}.`,
    `Subject: ${brief}.`,
    preserve,
    `Setting and background: ${CATEGORY_SETTING[category]}.`,
    'Shots:',
    shots,
    `Lighting: ${CATEGORY_LIGHT[category]}.`,
    'Pacing: hold each shot, then cut. No whip pans and no speed ramps.',
    'Style: commercial, literal, product-first.',
    `Negative: ${NEGATIVES.join(', ')}.`,
  ].join('\n');
}

export const ENHANCE_SECRETS = [
  'GROQ_API_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_GEMINI_API_KEY',
  'ANTHROPIC_API_KEY',
  'LOVABLE_API_KEY',
] as const;
