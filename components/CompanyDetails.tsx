import React from 'react';
import { NodeData, HealthStatus } from '../types';

interface CompanyDetailsProps {
  node: NodeData | null;
  onKill: (nodeId: string) => void;
  isSimulating: boolean;
}

const CompanyDetails: React.FC<CompanyDetailsProps> = ({ node, onKill, isSimulating }) => {
  if (!node) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 italic p-6 text-center border-l border-slate-800 bg-slate-900/50">
        Sélectionnez une entreprise pour voir les détails ou simuler une faillite.
      </div>
    );
  }

  const isDead = node.status === HealthStatus.BANKRUPT;

  return (
    <div className="h-full flex flex-col p-6 bg-slate-900 border-l border-slate-800 text-slate-200 overflow-y-auto w-80 shrink-0">
      <div className="mb-6">
        <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${
          node.type === "Infrastructure" ? "bg-purple-900 text-purple-200" :
          node.type === "Model Lab" ? "bg-indigo-900 text-indigo-200" :
          "bg-slate-700 text-slate-200"
        }`}>
          {node.type}
        </span>
        <h2 className="text-2xl font-bold text-white mb-1">{node.name}</h2>
        <div className={`text-sm font-mono ${
          node.status === HealthStatus.HEALTHY ? "text-emerald-400" :
          node.status === HealthStatus.STRESSED ? "text-amber-400" : "text-red-500 font-bold"
        }`}>
          Statut: {node.status === HealthStatus.BANKRUPT ? "FAILLITE" : node.status}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider">Valorisation</label>
          <div className="text-lg font-mono">${node.valuation} Mrd</div>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider">Réserve Cash (Est.)</label>
          <div className="text-lg font-mono text-cyan-400">${node.cashReserve} Mrd</div>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider">Santé Financière</label>
          <div className="w-full bg-slate-700 h-2 rounded-full mt-1">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                 node.currentHealth > 60 ? 'bg-emerald-500' : node.currentHealth > 20 ? 'bg-amber-500' : 'bg-red-600'
              }`}
              style={{ width: `${node.currentHealth}%` }}
            ></div>
          </div>
          <div className="text-right text-xs mt-1 text-slate-400">{Math.round(node.currentHealth)}%</div>
        </div>
        <div>
           <label className="text-xs text-slate-500 uppercase tracking-wider">Description</label>
           <p className="text-sm text-slate-300 mt-1 leading-relaxed">{node.description}</p>
        </div>
      </div>

      <div className="mt-auto">
        <button
          onClick={() => onKill(node.id)}
          disabled={isDead || isSimulating}
          className={`w-full py-3 px-4 rounded font-bold uppercase tracking-wide transition-all shadow-lg ${
            isDead 
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : "bg-red-600 hover:bg-red-500 text-white shadow-red-900/20 active:scale-95"
          }`}
        >
          {isDead ? "Déjà en faillite" : "Déclencher Faillite"}
        </button>
        <p className="text-xs text-slate-500 mt-3 text-center">
          Attention: Cette action simulera une réaction en chaîne dans tout le réseau.
        </p>
      </div>
    </div>
  );
};

export default CompanyDetails;