const RULES: { match: RegExp; titles: string[] }[] = [
  { match: /(solidity|web3|blockchain|protocol|crypto|zk|evm)/i, titles: ["Protocol Architect", "Chain Whisperer", "Code Pirate"] },
  { match: /(ai|ml|llm|data|python|pytorch|agent)/i, titles: ["AI Tinkerer", "Model Wrangler", "Neural Nomad"] },
  { match: /(full[- ]?stack|next|react.*node|mern)/i, titles: ["Full-Stack Alchemist", "Ship-It Generalist", "Duct-Tape Wizard"] },
  { match: /(backend|node|go|rust|java|django|api|server)/i, titles: ["Backend Beast", "Systems Builder", "Latency Slayer"] },
  { match: /(frontend|react|vue|css|ui|tailwind|svelte)/i, titles: ["Pixel Mechanic", "Interface Gremlin", "Frontend Sorcerer"] },
  { match: /(design|figma|ux|product)/i, titles: ["Product Hacker", "Vibe Architect", "Taste Engineer"] },
  { match: /(devops|cloud|infra|kubernetes|aws|sre)/i, titles: ["Infra Goblin", "Uptime Guardian", "Systems Builder"] },
  { match: /(mobile|flutter|swift|android|ios)/i, titles: ["Pocket-Sized Builder", "App Smith", "Touch Alchemist"] },
];

const FALLBACK = ["Certified Builder", "Chaos Engineer", "Serial Shipper", "Late-Night Hacker", "Goa Deploy Machine"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function generateBuilderTitle(stack: string, seed = "") {
  const pool: string[] = RULES.find((r) => r.match.test(stack))?.titles ?? FALLBACK;
  return pool[hash(stack + seed) % pool.length] ?? "Certified Builder";
}

/** Playful pool used by the "spin a title" button on the form. */
const RANDOM_TITLES = [
  // Blockchain / web3
  "Protocol Architect",
  "Chain Whisperer",
  "Smart Contract Smith",
  "Solidity Shipper",
  "ZK Alchemist",
  "EVM Explorer",
  "Onchain Operator",
  "Gas Golf Champion",
  "Rollup Ranger",
  "DeFi Deployer",
  "Consensus Cowboy",
  "Wallet Wrangler",
  // AI / ML
  "AI Tinkerer",
  "Prompt Whisperer",
  "Model Wrangler",
  "Neural Nomad",
  "Agent Architect",
  "LLM Sherpa",
  "Embedding Explorer",
  "Fine-Tune Fanatic",
  "Inference Engineer",
  "RAG Ringleader",
  "Diffusion Dreamer",
  "Token Budget Boss",
  // Frontend
  "Pixel Mechanic",
  "Interface Gremlin",
  "Frontend Sorcerer",
  "Component Composer",
  "Hydration Hero",
  "CSS Cartographer",
  "Motion Designer-Dev",
  "Design System Steward",
  "Render Loop Runner",
  "Accessibility Advocate",
  "Tailwind Tactician",
  "Edge-Rendered Rebel",
];

/** Random builder title, never repeating the current one. */
export function randomBuilderTitle(current = "") {
  const pool = RANDOM_TITLES.filter((t) => t.toLowerCase() !== current.trim().toLowerCase());
  return pool[Math.floor(Math.random() * pool.length)] ?? RANDOM_TITLES[0]!;
}

/**
 * Draws titles without repeats until the whole pool is used, then reshuffles.
 * Returns the next title plus the remaining queue.
 */
export function nextBuilderTitle(queue: string[], current = "") {
  let rest = queue.filter((t) => t.toLowerCase() !== current.trim().toLowerCase());
  if (rest.length === 0) {
    rest = RANDOM_TITLES.filter((t) => t.toLowerCase() !== current.trim().toLowerCase());
    // Fisher-Yates so each cycle feels fresh
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j]!, rest[i]!];
    }
  }
  const title = rest[0] ?? "Certified Builder";
  return { title, queue: rest.slice(1) };
}
