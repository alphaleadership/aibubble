import React, { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph from './components/ForceGraph';
import CompanyDetails from './components/CompanyDetails';
import AddNodeModal from './components/AddNodeModal';
import { INITIAL_DATA } from './constants';
import { GraphData, NodeData, HealthStatus } from './types';

import { Loader2, RefreshCw, Send, AlertTriangle, Plus, Download, Upload, Filter, Banknote, Cpu, Network } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<GraphData>(INITIAL_DATA);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simAnalysis, setSimAnalysis] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Filter View State
  const [viewMode, setViewMode] = useState<'all' | 'financial' | 'tech'>('all');
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Generation States


  // Responsive dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const graphContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (graphContainerRef.current) {
        setDimensions({
          width: graphContainerRef.current.offsetWidth,
          height: graphContainerRef.current.offsetHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNodeClick = (node: NodeData) => {
    setSelectedNode(node);
  };

  const handleUpdateNode = (updatedNode: NodeData) => {
      setData(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
      }));
      setSelectedNode(updatedNode);
  };

  const handleAddNode = (newNode: NodeData) => {
      setData(prev => ({
          ...prev,
          nodes: [...prev.nodes, newNode]
      }));
      setSelectedNode(newNode);
  };

  const handleExportJSON = () => {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = "companies.json";
      link.click();
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileReader = new FileReader();
      if (event.target.files && event.target.files[0]) {
          fileReader.readAsText(event.target.files[0], "UTF-8");
          fileReader.onload = e => {
              if (e.target?.result) {
                  try {
                      const parsedData = JSON.parse(e.target.result as string);
                      // Simple check to ensure it looks like our data
                      if (parsedData.nodes && parsedData.links) {
                          setData(parsedData);
                          setSelectedNode(null);
                          setSimAnalysis(null);
                      } else {
                          alert("Fichier JSON invalide : Structure incorrecte.");
                      }
                  } catch (error) {
                      console.error("Invalid JSON", error);
                      alert("Erreur lors de la lecture du fichier JSON.");
                  }
              }
          };
      }
      // Reset input so same file can be selected again
      if (event.target) event.target.value = '';
  };

  const resetSimulation = () => {
    const resetNodes = data.nodes.map(n => ({
        ...n,
        currentHealth: 100,
        status: HealthStatus.HEALTHY
    }));
    setData({ ...data, nodes: resetNodes });
    setSimAnalysis(null);
    if (selectedNode) {
        setSelectedNode(resetNodes.find(n => n.id === selectedNode.id) || null);
    }
  };



  const runSimulation = useCallback(async (startNodeId: string) => {
    setIsSimulating(true);
    
    let currentNodes = [...data.nodes];
    let impactedNodeIds = new Set<string>();
    
    const findIdx = (id: string) => currentNodes.findIndex(n => n.id === id);

    const patientZeroIdx = findIdx(startNodeId);
    if (patientZeroIdx === -1) return;

    currentNodes[patientZeroIdx] = {
        ...currentNodes[patientZeroIdx],
        currentHealth: 0,
        status: HealthStatus.BANKRUPT
    };
    impactedNodeIds.add(currentNodes[patientZeroIdx].name);

    setData({ ...data, nodes: [...currentNodes] });
    if (selectedNode?.id === startNodeId) setSelectedNode(currentNodes[patientZeroIdx]);

    await new Promise(r => setTimeout(r, 800));

    let iteration = 0;
    let unstable = true;

    while (unstable && iteration < 3) {
        unstable = false;
        const newNodes = [...currentNodes];
        
        for (const link of data.links) {
            const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
            const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;

            const targetNode = newNodes.find(n => n.id === targetId);
            const sourceNode = newNodes.find(n => n.id === sourceId);

            if (!targetNode || !sourceNode) continue;

            if (link.type === 'investment' && targetNode.status === HealthStatus.BANKRUPT && sourceNode.status !== HealthStatus.BANKRUPT) {
                const damage = (link.value / sourceNode.cashReserve) * 100; 
                sourceNode.currentHealth -= damage;
                
                if (sourceNode.currentHealth <= 0) {
                    sourceNode.currentHealth = 0;
                    sourceNode.status = HealthStatus.BANKRUPT;
                    impactedNodeIds.add(sourceNode.name);
                    unstable = true;
                } else if (sourceNode.currentHealth < 50) {
                    sourceNode.status = HealthStatus.STRESSED;
                }
            }

            if (link.type === 'dependency' && targetNode.status === HealthStatus.BANKRUPT && sourceNode.status !== HealthStatus.BANKRUPT) {
                const damage = 40;
                sourceNode.currentHealth -= damage;

                 if (sourceNode.currentHealth <= 0) {
                    sourceNode.currentHealth = 0;
                    sourceNode.status = HealthStatus.BANKRUPT;
                    impactedNodeIds.add(sourceNode.name);
                    unstable = true;
                } else {
                    sourceNode.status = HealthStatus.STRESSED;
                }
            }
        }
        
        currentNodes = newNodes;
        setData({ ...data, nodes: [...currentNodes] });
        if (selectedNode) {
             const updatedSelected = currentNodes.find(n => n.id === selectedNode.id);
             if (updatedSelected) setSelectedNode(updatedSelected);
        }
        await new Promise(r => setTimeout(r, 800));
        iteration++;
    }

    const analysis = await analyzeConsequences(currentNodes[patientZeroIdx].name, Array.from(impactedNodeIds));
    setSimAnalysis(analysis);

    setIsSimulating(false);
  }, [data, selectedNode]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center px-6 bg-slate-900/80 backdrop-blur-md justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-900/50">
            AI
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 hidden md:block">Risk Nexus <span className="text-slate-500 font-normal">| Simulateur</span></h1>
        </div>
        
        {/* View Filters */}
        <div className="hidden md:flex bg-slate-800/50 p-1 rounded-lg border border-slate-700">
            <button 
                onClick={() => setViewMode('all')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all ${viewMode === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <Network size={14} /> Tout
            </button>
            <button 
                onClick={() => setViewMode('financial')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all ${viewMode === 'financial' ? 'bg-emerald-900/50 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-400 hover:text-emerald-300'}`}
            >
                <Banknote size={14} /> Finance
            </button>
            <button 
                onClick={() => setViewMode('tech')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all ${viewMode === 'tech' ? 'bg-violet-900/50 text-violet-400 shadow-sm border border-violet-500/20' : 'text-slate-400 hover:text-violet-300'}`}
            >
                <Cpu size={14} /> Tech
            </button>
        </div>
        
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm font-bold shadow-lg shadow-blue-900/20 transition-colors"
             >
                <Plus size={16} />
                <span className="hidden sm:inline">Ajouter</span>
             </button>
             
             <div className="h-6 w-px bg-slate-700 mx-1"></div>

             <input 
               type="file" 
               accept=".json" 
               ref={fileInputRef} 
               onChange={handleImportJSON} 
               className="hidden" 
             />
             
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-sm transition-colors text-slate-300 hover:text-white"
                title="Importer JSON"
             >
                <Upload size={14} />
             </button>

             <button 
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-sm transition-colors text-slate-300 hover:text-white"
                title="Exporter JSON"
             >
                <Download size={14} />
             </button>

             <div className="h-6 w-px bg-slate-700 mx-1"></div>
             
             <button 
                onClick={resetSimulation}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-sm transition-colors"
             >
                <RefreshCw size={14} />
                <span className="hidden sm:inline">Reset</span>
             </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Floating Input for GenAI */}
        
        
        {/* Mobile View Filters (visible only on small screens) */}
        <div className="absolute top-20 left-4 z-20 md:hidden flex flex-col gap-2">
            <button onClick={() => setViewMode(viewMode === 'financial' ? 'all' : 'financial')} className={`p-2 rounded-full shadow-lg ${viewMode === 'financial' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Banknote size={20} />
            </button>
            <button onClick={() => setViewMode(viewMode === 'tech' ? 'all' : 'tech')} className={`p-2 rounded-full shadow-lg ${viewMode === 'tech' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Cpu size={20} />
            </button>
        </div>

        {/* Graph Area */}
        <div className="flex-1 relative bg-slate-950" ref={graphContainerRef}>
           <ForceGraph 
             data={data} 
             width={dimensions.width} 
             height={dimensions.height} 
             onNodeClick={handleNodeClick}
             filterMode={viewMode}
           />
           
           {/* Simulation Analysis Toast */}
           {simAnalysis && (
               <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-auto md:w-96 bg-slate-900/95 border border-red-500/30 text-slate-200 p-4 rounded-lg shadow-2xl backdrop-blur animate-in slide-in-from-bottom-5 z-30">
                   <div className="flex items-start gap-3">
                       <AlertTriangle className="text-red-500 shrink-0 mt-1" size={20} />
                       <div>
                           <h4 className="font-bold text-red-400 text-sm uppercase tracking-wider mb-1">Rapport de Contagion</h4>
                           <p className="text-sm text-slate-300 leading-relaxed">{simAnalysis}</p>
                       </div>
                   </div>
               </div>
           )}
        </div>

        {/* Sidebar */}
        <CompanyDetails 
            node={selectedNode} 
            onKill={runSimulation}
            onUpdate={handleUpdateNode}
            isSimulating={isSimulating}
        />
      </div>

      {/* Modals */}
      <AddNodeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddNode} 
      />
    </div>
  );
};

export default App;
