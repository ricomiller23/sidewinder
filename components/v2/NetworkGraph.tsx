"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Network } from "lucide-react";

interface EntityNode {
  id: string;
  label: string;
  type: "insider" | "issuer";
  cik?: string;
  x: number;
  y: number;
}

interface Edge {
  source: string;
  target: string;
}

export function NetworkGraph({ 
  insiderName, 
  insiderCik,
  issuers,
  onNodeClick
}: { 
  insiderName: string, 
  insiderCik?: string,
  issuers: { name: string, cik: string }[],
  onNodeClick?: (entity: { name: string, cik: string, type: "insider" | "issuer" }) => void
}) {
  const { nodes, edges } = useMemo(() => {
    const cx = 200;
    const cy = 150;
    const r = 100;
    
    const ns: EntityNode[] = [
      { id: "center", label: insiderName, type: "insider", cik: insiderCik, x: cx, y: cy }
    ];
    const es: Edge[] = [];

    const angleStep = (2 * Math.PI) / (issuers.length || 1);
    
    issuers.forEach((issuer, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      
      const id = `issuer-${i}`;
      ns.push({ id, label: issuer.name, type: "issuer", cik: issuer.cik, x, y });
      es.push({ source: "center", target: id });
    });

    return { nodes: ns, edges: es };
  }, [insiderName, insiderCik, issuers]);

  if (!issuers || issuers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-[#07080B] rounded-2xl border border-dashed border-[#1B2030]">
        <Network className="h-8 w-8 text-[#8892A6] mb-3 opacity-50" />
        <p className="text-xs text-[#8892A6]">No cross-company relationships detected.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[300px] bg-[#07080B] rounded-2xl border border-[#1B2030] overflow-hidden group/graph">
      <svg width="100%" height="100%" viewBox="0 0 400 300" className="absolute inset-0">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.2)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </radialGradient>
        </defs>
        
        {/* Edges */}
        {edges.map((edge, i) => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          if (!source || !target) return null;
          
          return (
            <motion.line
              key={i}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="#2A3050"
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: i * 0.2 }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g 
            key={node.id} 
            transform={`translate(${node.x},${node.y})`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => node.cik && onNodeClick?.({ name: node.label, cik: node.cik, type: node.type })}
            className="cursor-pointer"
          >
            {node.type === "insider" && (
              <circle r="40" fill="url(#glow)" />
            )}
            <motion.circle
              r={node.type === "insider" ? 24 : 16}
              fill={node.type === "insider" ? "#0F1218" : "#1B2030"}
              stroke={node.type === "insider" ? "#22d3ee" : "#8892A6"}
              strokeWidth={2}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: i * 0.1 }}
              className="group-hover:stroke-cyan-400"
            />
            <text
              y={node.type === "insider" ? 40 : 30}
              textAnchor="middle"
              fill={node.type === "insider" ? "#E8ECF4" : "#8892A6"}
              fontSize={node.type === "insider" ? 12 : 10}
              fontWeight={node.type === "insider" ? "bold" : "normal"}
              className="pointer-events-none"
            >
              {node.label}
            </text>
          </motion.g>
        ))}
      </svg>
      <div className="absolute bottom-4 right-4 text-[9px] text-[#8892A6] bg-[#07080B]/80 px-2 py-1 rounded border border-[#1B2030] pointer-events-none">
        CLICK NODE TO VIEW INTEL
      </div>
    </div>
  );
}
