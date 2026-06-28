/** Capacidades de ferramenta que um Agente pode ter ligadas (ADR-0010, extensível). */
export type Capability = "web_search";

/**
 * Shape compartilhado por Blueprint (semente imutável no código) e Agente
 * (instância editável no localStorage). Ver glossário §2 + ADR-0010.
 */
export interface AgentConfig {
  slug: string;
  name: string;
  /** Texto livre (ex.: "SQL Analyst", "Copywriter") — só rótulo/badge. Substitui o antigo enum AgentClass. */
  role: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  /** Cor da sala/accent — aplicada por código (glow CSS), não pintada no render do casco. */
  accentColor: string;
  model: {
    /** Modelo Gemini usado no host do demo (Google AI Studio, free tier estável). */
    host: string;
    /** Modelo premium via OpenRouter, destravado por BYOK (opcional). */
    premium?: string;
    /** Preferência do agente; premium sem BYOK → cai pro host com aviso. */
    prefer?: "host" | "premium";
  };
  systemPrompt: string;
  inputPlaceholder: string;
  /** Capacidades de ferramenta ligadas. [] = puro-LLM; ["web_search"] = ex-ARIA. Substitui usesSearch. */
  capabilities: Capability[];
  /** XP base concedido por missão concluída. */
  xpReward: number;
}

/**
 * Instância viva de um agente na nave do ator (o "Agente" do glossário §2).
 * Semeada de um Blueprint (copy-on-write) e persistida no localStorage.
 */
export interface AgentInstance extends AgentConfig {
  /** De qual Blueprint foi semeado (null = criado do zero pelo ator). */
  blueprintSlug: string | null;
  /** Célula do casco que ocupa (0..7). */
  cell: number;
  /** Cosmético equipado no robô (ADR-0009). */
  equippedCosmetic: string | null;
}

/** Helper de capacidade (legível nos consumidores). */
export function hasCapability(agent: AgentConfig, cap: Capability): boolean {
  return agent.capabilities.includes(cap);
}
