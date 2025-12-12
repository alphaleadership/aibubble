import React, { useState, useEffect, useCallback } from 'react';
import ForceGraph from './components/ForceGraph';
import CompanyDetails from './components/CompanyDetails';
import { INITIAL_DATA } from './constants';
import { GraphData, NodeData, HealthStatus } from './types';
import { generateScenarioData, analyzeConsequences } from './services/geminiService';
import { Loader2, RefreshCw, Send, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<GraphData>(INITIAL_DATA);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simAnalysis, setSimAnalysis] = useState<string | null>(null);
  
  // AI Generation States
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

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

  const resetSimulation = () => {
    // Restore health to original state based on node ID matching initial data logic or current dataset reset
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

  const handleGenerateScenario = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);
    try {
        const newData = await generateScenarioData(prompt);
        if (newData) {
            setData(newData);
            setSelectedNode(null);
            setSimAnalysis(null);
        } else {
            setGenerationError("L'IA n'a pas pu générer un graphe valide. Essayez une autre description.");
        }
    } catch (e) {
        setGenerationError("Erreur de connexion API.");
    } finally {
        setIsGenerating(false);
    }
  };

  const runSimulation = useCallback(async (startNodeId: string) => {
    setIsSimulating(true);
    
    // We will simulate a cascade.
    // Logic: 
    // 1. Reduce startNode health to 0.
    // 2. Find nodes that have 'source' pointing to startNode (startNode is target).
    //    Actually, if Source invests in Target, and Target dies: Source loses money.
    //    If Source relies on Target (dependency), and Target dies: Source is stressed.
    //    We need to check links where target === startNodeId.
    
    let currentNodes = [...data.nodes];
    let impactedNodeIds = new Set<string>();
    
    // Helper to find node index
    const findIdx = (id: string) => currentNodes.findIndex(n => n.id === id);

    // Step 1: Kill the patient zero
    const patientZeroIdx = findIdx(startNodeId);
    if (patientZeroIdx === -1) return;

    currentNodes[patientZeroIdx] = {
        ...currentNodes[patientZeroIdx],
        currentHealth: 0,
        status: HealthStatus.BANKRUPT
    };
    impactedNodeIds.add(currentNodes[patientZeroIdx].name);

    setData({ ...data, nodes: [...currentNodes] });
    // Update selected view if needed
    if (selectedNode?.id === startNodeId) setSelectedNode(currentNodes[patientZeroIdx]);

    // Step 2: Propagate
    // Simple 1-step propagation for visual effect, can be made recursive
    // Wait a bit for visual effect
    await new Promise(r => setTimeout(r, 800));

    let iteration = 0;
    let unstable = true;

    while (unstable && iteration < 3) { // Limit iterations to prevent infinite loops
        unstable = false;
        const newNodes = [...currentNodes];
        
        // Check all links
        for (const link of data.links) {
            const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
            const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;

            const targetNode = newNodes.find(n => n.id === targetId);
            const sourceNode = newNodes.find(n => n.id === sourceId);

            if (!targetNode || !sourceNode) continue;

            // Scenario A: Investment loss. Source invested in Target. Target is Dead.
            if (link.type === 'investment' && targetNode.status === HealthStatus.BANKRUPT && sourceNode.status !== HealthStatus.BANKRUPT) {
                // Source loses the value
                const damage = (link.value / sourceNode.cashReserve) * 100; 
                sourceNode.currentHealth -= damage;
                
                if (sourceNode.currentHealth <= 0) {
                    sourceNode.currentHealth = 0;
                    sourceNode.status = HealthStatus.BANKRUPT;
                    impactedNodeIds.add(sourceNode.name);
                    unstable = true; // Changes happened, need re-evaluation
                } else if (sourceNode.currentHealth < 50) {
                    sourceNode.status = HealthStatus.STRESSED;
                }
            }

            // Scenario B: Tech Dependency. Source depends on Target. Target is Dead.
            if (link.type === 'dependency' && targetNode.status === HealthStatus.BANKRUPT && sourceNode.status !== HealthStatus.BANKRUPT) {
                // Massive operational hit
                const damage = 40; // Flat 40% health hit for critical dependency failure
                sourceNode.currentHealth -= damage;

                 if (sourceNode.currentHealth <= 0) {
                    sourceNode.currentHealth = 0;
                    sourceNode.status = HealthStatus.BANKRUPT;
                    impactedNodeIds.add(sourceNode.name);
                    unstable = true;
                } else {
                    sourceNode.status = HealthStatus.STRESSED; // Almost always stressed if provider fails
                }
            }
        }
        
        currentNodes = newNodes;
        setData({ ...data, nodes: [...currentNodes] });
        // Refresh selected node if it changed
        if (selectedNode) {
             const updatedSelected = currentNodes.find(n => n.id === selectedNode.id);
             if (updatedSelected) setSelectedNode(updatedSelected);
        }
        await new Promise(r => setTimeout(r, 800));
        iteration++;
    }

    // After simulation, ask Gemini for analysis
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
          <h1 className="text-xl font-bold tracking-tight text-slate-100">Risk Nexus <span className="text-slate-500 font-normal">| Simulateur de Contagion Financière</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
             <button 
                onClick={resetSimulation}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-sm transition-colors"
             >
                <RefreshCw size={14} />
                Réinitialiser
             </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Floating Input for GenAI */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl">
           <div className="mx-4">
                <div className="flex items-center gap-2 p-1 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg shadow-2xl ring-1 ring-white/10">
                    <input 
                        type="text" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Décrivez un scénario (ex: L'impact de la faillite de Nvidia sur les startups IA...)"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 py-2 text-slate-200 placeholder-slate-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateScenario()}
                    />
                    <button 
                        onClick={handleGenerateScenario}
                        disabled={isGenerating}
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md disabled:opacity-50 transition-colors"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                    </button>
                </div>
                {generationError && (
                    <div className="mt-2 text-xs text-red-400 bg-red-900/20 px-3 py-1 rounded border border-red-900/50">
                        {generationError}
                    </div>
                )}
           </div>
        </div>

        {/* Graph Area */}
        <div className="flex-1 relative bg-slate-950" ref={graphContainerRef}>
           <ForceGraph 
             data={data} 
             width={dimensions.width} 
             height={dimensions.height} 
             onNodeClick={handleNodeClick}
           />
           
           {/* Simulation Analysis Toast */}
           {simAnalysis && (
               <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-auto md:w-96 bg-slate-900/95 border border-red-500/30 text-slate-200 p-4 rounded-lg shadow-2xl backdrop-blur animate-in slide-in-from-bottom-5">
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
            isSimulating={isSimulating}
        />
      </div>
    </div>
  );
};

export default App;