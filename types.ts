

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

export interface NodeData  {
  id: string;
  name: string;
  type: CompanyType;
  valuation: number; // In Billions
  cashReserve: number; // Conceptual buffer before failure
  currentHealth: number; // 0-100
  status: HealthStatus;
  description?: string;
  index?: number | undefined;
    /**
     * Node’s current x-position
     */
    x?: number | undefined;
    /**
     * Node’s current y-position
     */
    y?: number | undefined;
    /**
     * Node’s current x-velocity
     */
    vx?: number | undefined;
    /**
     * Node’s current y-velocity
     */
    vy?: number | undefined;
    /**
     * Node’s fixed x-position (if position was fixed)
     */
    fx?: number | null | undefined;
    /**
     * Node’s fixed y-position (if position was fixed)
     */
    fy?: number | null | undefined;
}

export interface LinkData extends d3.SimulationLinkDatum<NodeData extends d3.SimulationNodeDatum? NodeData : never> {
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