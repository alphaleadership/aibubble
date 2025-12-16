

import * as d3 from 'd3';
export enum CompanyType {
  INFRASTRUCTURE = "Infrastructure", // e.g., Nvidia, TSMC
  MODEL_LAB = "Model Lab", // e.g., OpenAI, Anthropic
  CLOUD_PROVIDER = "Cloud Provider", // e.g., Azure, AWS
  APPLICATION = "Application", // e.g., Jasper, Midjourney
  INVESTOR = "VC / Holding", // e.g., Softbank, Sequoia
}

export enum HealthStatus {
  HEALTHY = "Healthy",
  STRESSED = "Stressed",
  BANKRUPT = "Bankrupt",
}

export interface NodeData extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: CompanyType;
  valuation: number; // In Billions
  cashReserve: number; // Conceptual buffer before failure
  currentHealth: number; // 0-100
  status: HealthStatus;
  description?: string;
  index?: number;
}

export interface LinkData extends d3.SimulationLinkDatum<d3.SimulationNodeDatum> {
  id: string;
  name: string;
  source: string;
  target: string;
  value: number; // Investment amount / Exposure in Billions
  type: "investment" | "partnership" | "dependency";
  index?: number;
}

export interface GraphData {
  nodes: NodeData[];
  links: LinkData[];
}

export interface SimulationResult {
  triggeredNodeId: string;
  impactedNodes: string[];
  systemicDamage: number;
}