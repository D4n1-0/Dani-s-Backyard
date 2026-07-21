export interface ScenarioMeta {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  accentRgb: string;
  cardImage?: string;
  mermaid?: string;
}

export const scenarios: Record<string, ScenarioMeta> = {
  genesis: {
    slug: 'genesis',
    title: 'Genesis',
    subtitle: 'The Anomaly Reconnects',
    description: 'Follow the dual timeline where 1914 Trench Crusade and 2026 Modern Earth collide.',
    accent: '#ff4d4d',
    accentRgb: '255, 77, 77',
    cardImage: '/images/card-genesis.png',
  },
  titan: {
    slug: 'titan',
    title: 'Titan',
    subtitle: 'The Gate of the Yellow Sea',
    description: 'Follow the clash of modern East Asian geopolitics and the dark fantasy of the Attack on Titan world.',
    accent: '#50b3e6',
    accentRgb: '80, 179, 230',
    cardImage: '/images/card-titan.jpg',
  },
  disco: {
    slug: 'disco',
    title: 'Disco',
    subtitle: 'The Reclamation of Martinaise',
    description: 'A Wild Pines engineer arrives to build a security apparatus in the wake of the Tribunal.',
    accent: '#c9a227',
    accentRgb: '201, 162, 39',
    cardImage: '/images/card-disco.jpg',
  },
  'the-sundered-world': {
    slug: 'the-sundered-world',
    title: 'The Sundered World',
    subtitle: 'A Dieselpunk Convergence',
    description: 'Childhood friends separated by census and transmigration policy find each other again at the edge of a border dispute.',
    accent: '#8b5cf6',
    accentRgb: '139, 92, 246',
    cardImage: '/images/card-the-sundered-world.jpg',
  },
};

export const scenarioList = Object.values(scenarios);

export function getScenario(slug: string): ScenarioMeta | undefined {
  return scenarios[slug.toLowerCase()];
}

export function getScenarioFromPath(pathname: string): ScenarioMeta | undefined {
  const lower = pathname.toLowerCase();
  for (const s of scenarioList) {
    if (lower.includes(`/${s.slug}`)) return s;
  }
  return undefined;
}
