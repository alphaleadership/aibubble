import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphData, NodeData, LinkData, HealthStatus } from '../types';

interface ForceGraphProps {
  data: GraphData;
  onNodeClick: (node: NodeData) => void;
  width: number;
  height: number;
}

const ForceGraph: React.FC<ForceGraphProps> = ({ data, onNodeClick, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // Keep track of the simulation instance to stop it on unmount or update
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);

  const getNodeColor = (status: HealthStatus) => {
    switch (status) {
      case HealthStatus.HEALTHY: return '#10b981'; // Emerald 500
      case HealthStatus.STRESSED: return '#f59e0b'; // Amber 500
      case HealthStatus.BANKRUPT: return '#ef4444'; // Red 500
      default: return '#64748b';
    }
  };

  const getLinkColor = (type: string) => {
    switch (type) {
        case 'investment': return '#3b82f6'; // Blue
        case 'dependency': return '#ec4899'; // Pink
        default: return '#64748b'; // Slate
    }
  };

  const renderGraph = useCallback(() => {
    if (!svgRef.current) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    // Deep copy data for D3 (it mutates objects)
    const nodes = data.nodes.map(d => ({ ...d })) as (NodeData & d3.SimulationNodeDatum)[];
    const links = data.links.map(d => ({ ...d })) as (LinkData & d3.SimulationLinkDatum<NodeData & d3.SimulationNodeDatum>)[];

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto");

    // Add generic arrow marker
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .join("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25) // Offset to not overlap node
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#94a3b8")
      .attr("d", "M0,-5L10,0L0,5");

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));
    
    simulationRef.current = simulation;

    const link = svg.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value) + 1)
      .attr("stroke", d => getLinkColor(d.type))
      .attr("marker-end", "url(#arrow)");

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => 10 + Math.sqrt(d.valuation) / 2) // Size based on valuation
      .attr("fill", d => getNodeColor(d.status))
      .attr("cursor", "pointer")
      .call(drag(simulation) as any)
      .on("click", (event, d) => {
          // Find original data object to pass back
          const original = data.nodes.find(n => n.id === d.id);
          if(original) onNodeClick(original);
      });

    // Add labels
    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dx", 15)
      .attr("dy", 4)
      .text(d => d.name)
      .attr("fill", "#e2e8f0")
      .style("font-size", "12px")
      .style("font-family", "sans-serif")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);
      
      label
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);
    });

  }, [data, width, height, onNodeClick]);

  useEffect(() => {
    renderGraph();
    return () => {
      if (simulationRef.current) simulationRef.current.stop();
    };
  }, [renderGraph]);

  // Drag behavior
  const drag = (simulation: d3.Simulation<any, any>) => {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  return (
    <div className="relative w-full h-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
      <svg ref={svgRef} width={width} height={height} className="w-full h-full block" />
      <div className="absolute top-4 left-4 pointer-events-none flex gap-4 text-xs font-mono">
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Sain</div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> En difficulté</div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Faillite</div>
      </div>
      <div className="absolute top-4 right-4 pointer-events-none flex gap-4 text-xs font-mono">
         <div className="flex items-center gap-2"><div className="w-8 h-[2px] bg-blue-500"></div> Investissement</div>
         <div className="flex items-center gap-2"><div className="w-8 h-[2px] bg-pink-500"></div> Dépendance Tech</div>
      </div>
    </div>
  );
};

export default ForceGraph;