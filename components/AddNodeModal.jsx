import React, { useState } from 'react';
import { CompanyType, HealthStatus} from '../types';
import { X } from 'lucide-react';



const AddNodeModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState(CompanyType.APPLICATION);
  const [valuation, setValuation] = useState('');
  const [cashReserve, setCashReserve] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !valuation || !cashReserve) return;

    const newNode = {
      id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name,
      type,
      valuation: parseFloat(valuation),
      cashReserve: parseFloat(cashReserve),
      currentHealth: 100,
      status: HealthStatus.HEALTHY,
      description: description || "Nouvelle entreprise ajoutée manuellement.",
    };

    onAdd(newNode);
    
    // Reset form
    setName('');
    setValuation('');
    setCashReserve('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6">Ajouter une entreprise</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-slate-500 mb-1">Nom</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:border-blue-500 outline-none"
              placeholder="Ex: StartUp AI"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-500 mb-1">Type</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value )}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:border-blue-500 outline-none"
            >
              {Object.values(CompanyType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-slate-500 mb-1">Valuation ($ Mrd)</label>
              <input 
                type="number" 
                required
                step="0.1"
                min="0"
                value={valuation}
                onChange={e => setValuation(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-500 mb-1">Cash ($ Mrd)</label>
              <input 
                type="number" 
                required
                step="0.1"
                min="0"
                value={cashReserve}
                onChange={e => setCashReserve(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-500 mb-1">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:border-blue-500 outline-none text-sm h-20"
              placeholder="Courte description de l'activité..."
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors mt-2"
          >
            Ajouter au graphe
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddNodeModal;