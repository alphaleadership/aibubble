import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphData, NodeData, CustomLinkData, HealthStatus } from '../types';

const ForceGraph = ({ data, onNodeClick, width, height, filterMode = 'all' }) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const zoomRef = useRef(null);

  const getNodeColor = (status) => {
    switch (status) {
      case HealthStatus.HEALTHY: return '#10b981';
      case HealthStatus.STRESSED: return '#f59e0b';
      case HealthStatus.BANKRUPT: return '#ef4444';
      default: return '#64748b';
    }
  };

  const getLinkColor = (type) => {
    switch (type) {
      case 'investment': return '#10b981';
      case 'dependency': return '#8b5cf6';
      case 'partnership': return '#3b82f6';
      default: return '#64748b';
    }
  };

  const renderGraph = useCallback(() => {
    if (!svgRef.current) return;

    const filteredLinks = data.links.filter(l => {
      if (filterMode === 'financial') return l.type === 'investment';
      if (filterMode === 'tech') return l.type === 'dependency';
      return true;
    });

    const activeNodeIds = new Set();
    filteredLinks.forEach(l => {
      activeNodeIds.add(typeof l.source === 'object' ? l.source.id : l.source);
      activeNodeIds.add(typeof l.target === 'object' ? l.target.id : l.target);
    });

    const filteredNodes = filterMode === 'all'
      ? data.nodes
      : data.nodes.filter(n => activeNodeIds.has(n.id));

    d3.select(svgRef.current).selectAll("*").remove();

    const nodes = filteredNodes.map(d => ({ ...d }));
    const links = filteredLinks
      .map(d => ({
        ...d,
        source: nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source)),
        target: nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target)),
      }))
      .filter(d => d.source !== undefined && d.target !== undefined);

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto");

    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        svg.selectAll("g").attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    const defs = svg.append("defs");
    const createMarker = (id, color) => {
      defs.append("marker")
        .attr("id", id)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", color)
        .attr("d", "M0,-5L10,0L0,5");
    };

    createMarker("arrow-investment", "#10b981");
    createMarker("arrow-dependency", "#8b5cf6");
    createMarker("arrow-partnership", "#3b82f6");
    createMarker("arrow-default", "#64748b");

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));

    simulationRef.current = simulation;

    svg.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value) + 1.5)
      .attr("stroke", d => getLinkColor(d.type))
      .attr("marker-end", d => `url(#arrow-${d.type})`);

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => 12 + Math.sqrt(d.valuation) / 2)
      .attr("fill", d => getNodeColor(d.status))
      .attr("cursor", "pointer")
      .call(drag(simulation))
      .on("click", (_, d) => {
        const original = data.nodes.find(n => n.id === d.id);
        if(original) onNodeClick(original);
      });

    svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dx", 18)
      .attr("dy", 4)
      .text(d => d.name)
      .attr("fill", "#e2e8f0")
      .style("font-size", "12px")
      .style("font-family", "sans-serif")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 4px rgba(0,0,0,0.9)");

    svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dx", 18)
      .attr("dy", 18)
      .text(d => `$${d.valuation}B`)
      .attr("fill", "#94a3b8")
      .style("font-size", "10px")
      .style("font-family", "monospace")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      svg.selectAll("line")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      svg.selectAll("text")
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

  }, [data, width, height, onNodeClick, filterMode]);

  useEffect(() => {
    renderGraph();
    return () => {
      if (simulationRef.current) simulationRef.current.stop();
    };
  }, [renderGraph]);

  const drag = (simulation) => {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  const resetZoom = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
      <svg ref={svgRef} width={width} height={height} className="w-full h-full block" />
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.2)}
          className="p-2 bg-white rounded-full shadow"
        >
          +
        </button>
        <button
          onClick={() => d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.8)}
          className="p-2 bg-white rounded-full shadow"
        >
          -
        </button>
        <button
          onClick={resetZoom}
          className="p-2 bg-white rounded-full shadow"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ForceGraph;
