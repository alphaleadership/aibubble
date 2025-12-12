import { CompanyType, GraphData, HealthStatus } from "./types";

export const INITIAL_DATA: GraphData = {
  nodes: [
    { id: "nvidia", name: "Nvidia", type: CompanyType.INFRASTRUCTURE, valuation: 2200, cashReserve: 500, currentHealth: 100, status: HealthStatus.HEALTHY, description: "Fournisseur mondial de GPU." },
    { id: "microsoft", name: "Microsoft", type: CompanyType.CLOUD_PROVIDER, valuation: 3000, cashReserve: 800, currentHealth: 100, status: HealthStatus.HEALTHY, description: "Géant du cloud et actionnaire majeur." },
    { id: "openai", name: "OpenAI", type: CompanyType.MODEL_LAB, valuation: 80, cashReserve: 10, currentHealth: 100, status: HealthStatus.HEALTHY, description: "Créateur de GPT-4." },
    { id: "anthropic", name: "Anthropic", type: CompanyType.MODEL_LAB, valuation: 18, cashReserve: 5, currentHealth: 100, status: HealthStatus.HEALTHY, description: "Sécurité de l'IA et Claude." },
    { id: "google", name: "Google", type: CompanyType.CLOUD_PROVIDER, valuation: 1700, cashReserve: 400, currentHealth: 100, status: HealthStatus.HEALTHY, description: "DeepMind et TPU infrastructure." },
    { id: "amazon", name: "Amazon", type: CompanyType.CLOUD_PROVIDER, valuation: 1800, cashReserve: 450, currentHealth: 100, status: HealthStatus.HEALTHY, description: "AWS et investisseur Anthropic." },
    { id: "meta", name: "Meta", type: CompanyType.APPLICATION, valuation: 1200, cashReserve: 300, currentHealth: 100, status: HealthStatus.HEALTHY, description: "Open Source Llama models." },
    { id: "tsmc", name: "TSMC", type: CompanyType.INFRASTRUCTURE, valuation: 600, cashReserve: 200, currentHealth: 100, status: HealthStatus.HEALTHY, description: "Fonderie de puces essentielle." },
    { id: "mistral", name: "Mistral AI", type: CompanyType.MODEL_LAB, valuation: 2, cashReserve: 0.5, currentHealth: 100, status: HealthStatus.HEALTHY, description: "Champion européen de l'open weight." },
    { id: "softbank", name: "Softbank", type: CompanyType.INVESTOR, valuation: 100, cashReserve: 30, currentHealth: 100, status: HealthStatus.HEALTHY, description: "Investisseur tech majeur." },
  ],
  links: [
    { source: "microsoft", target: "openai", value: 13, type: "investment" },
    { source: "openai", target: "nvidia", value: 5, type: "dependency" },
    { source: "openai", target: "microsoft", value: 4, type: "dependency" }, // Compute cost
    { source: "amazon", target: "anthropic", value: 4, type: "investment" },
    { source: "google", target: "anthropic", value: 2, type: "investment" },
    { source: "anthropic", target: "google", value: 1.5, type: "dependency" }, // TPU/Cloud usage
    { source: "nvidia", target: "tsmc", value: 20, type: "dependency" },
    { source: "microsoft", target: "nvidia", value: 15, type: "dependency" }, // Buying chips
    { source: "google", target: "nvidia", value: 10, type: "dependency" },
    { source: "meta", target: "nvidia", value: 12, type: "dependency" },
    { source: "softbank", target: "nvidia", value: 1, type: "investment" },
    { source: "microsoft", target: "mistral", value: 0.2, type: "investment" },
    { source: "nvidia", target: "mistral", value: 0.1, type: "partnership" },
  ]
};