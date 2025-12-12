import { GraphData } from "./types";
import companiesData from "./companies.json";

// Utilisation de l'import standard ES Module compatible Vite/Browser
// (Le module 'fs' n'est pas disponible côté navigateur)
export const INITIAL_DATA: GraphData = companiesData as unknown as GraphData;