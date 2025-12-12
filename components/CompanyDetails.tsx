import React, { useState, useEffect } from 'react';
import { NodeData, HealthStatus, CompanyType } from '../types';
import { Edit2, Save, X, Trash2 } from 'lucide-react';

interface CompanyDetailsProps {
  node: NodeData | null;
  onKill: (nodeId: string) => void;
  onUpdate: (updatedNode: NodeData) => void;
  isSimulating: boolean;
}

const CompanyDetails: React.FC<CompanyDetailsProps> = ({ node, onKill, onUpdate, isSimulating }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<NodeData>>({});

  // Reset edit state when node changes
  useEffect(() => {
    setIsEditing(false);
    if (node) {
      setEditForm({ ...node });
    }
  }, [node]);

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 italic p-6 text-center border-l border-slate-800 bg-slate-900/50">
        Sélectionnez une entreprise pour voir les détails ou simuler une faillite.
      </div>
    );
  }

  const isDead = node.status === HealthStatus.BANKRUPT;

  const handleSave = () => {
    if (editForm.name && editForm.valuation !== undefined) {
       onUpdate({
           ...node,
           ...editForm as NodeData
       });
       setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({ ...node });
  };

  return (
    <div className="h-full flex flex-col p-6 bg-slate-900 border-l border-slate-800 text-slate-200 overflow-y-auto w-80 shrink-0">
      
      {/* Header / Toolbar */}
      <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
             {isEditing ? (
                 <select 
                    value={editForm.type}
                    onChange={(e) => setEditForm({...editForm, type: e.target.value as CompanyType})}
                    className="bg-slate-800 text-xs border border-slate-700 rounded px-2 py-1 mb-2 outline-none w-full"
                 >
                     {Object.values(CompanyType).map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
             ) : (
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${
                    node.type === "Infrastructure" ? "bg-purple-900 text-purple-200" :
                    node.type === "Model Lab" ? "bg-indigo-900 text-indigo-200" :
                    "bg-slate-700 text-slate-200"
                }`}>
                    {node.type}
                </span>
             )}
          </div>
          
          <div className="flex gap-2">
            {!isEditing && !isSimulating && (
                <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded hover:bg-slate-700 transition-colors">
                    <Edit2 size={14} />
                </button>
            )}
            {isEditing && (
                <>
                    <button onClick={handleSave} className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-slate-800 rounded hover:bg-slate-700 transition-colors">
                        <Save size={14} />
                    </button>
                    <button onClick={handleCancel} className="p-1.5 text-red-400 hover:text-red-300 bg-slate-800 rounded hover:bg-slate-700 transition-colors">
                        <X size={14} />
                    </button>
                </>
            )}
          </div>
      </div>

      {/* Title */}
      <div className="mb-6">
        {isEditing ? (
            <input 
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xl font-bold text-white mb-2 outline-none"
            />
        ) : (
            <h2 className="text-2xl font-bold text-white mb-1">{node.name}</h2>
        )}
        
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
          {isEditing ? (
              <div className="flex items-center gap-2">
                  <span className="text-slate-500">$</span>
                  <input 
                    type="number"
                    value={editForm.valuation}
                    onChange={(e) => setEditForm({...editForm, valuation: parseFloat(e.target.value)})}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 outline-none font-mono"
                  />
                  <span className="text-slate-500">Mrd</span>
              </div>
          ) : (
              <div className="text-lg font-mono">${node.valuation} Mrd</div>
          )}
        </div>
        
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider">Réserve Cash (Est.)</label>
          {isEditing ? (
              <div className="flex items-center gap-2">
                  <span className="text-slate-500">$</span>
                  <input 
                    type="number"
                    value={editForm.cashReserve}
                    onChange={(e) => setEditForm({...editForm, cashReserve: parseFloat(e.target.value)})}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 outline-none font-mono text-cyan-400"
                  />
                  <span className="text-slate-500">Mrd</span>
              </div>
          ) : (
             <div className="text-lg font-mono text-cyan-400">${node.cashReserve} Mrd</div>
          )}
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
           {isEditing ? (
               <textarea 
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 outline-none text-sm h-24 mt-1"
               />
           ) : (
               <p className="text-sm text-slate-300 mt-1 leading-relaxed">{node.description}</p>
           )}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800">
        <button
          onClick={() => onKill(node.id)}
          disabled={isDead || isSimulating || isEditing}
          className={`w-full py-3 px-4 rounded font-bold uppercase tracking-wide transition-all shadow-lg ${
            isDead 
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : isEditing 
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 text-white shadow-red-900/20 active:scale-95"
          }`}
        >
          {isDead ? "Déjà en faillite" : "Déclencher Faillite"}
        </button>
        {!isEditing && (
            <p className="text-xs text-slate-500 mt-3 text-center">
            Attention: Cette action simulera une réaction en chaîne dans tout le réseau.
            </p>
        )}
      </div>
    </div>
  );
};

export default CompanyDetails;