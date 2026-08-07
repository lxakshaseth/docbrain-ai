import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Network, ListTree } from 'lucide-react';

export interface MindMapNode {
  id: string;
  label: string;
  category?: string;
}

export interface MindMapEdge {
  from: string;
  to: string;
  label?: string;
}

export interface MindMapData {
  nodes: MindMapNode[];
  edges?: MindMapEdge[];
}

interface MindMapVisualizerProps {
  data: MindMapData;
}

interface NodePosition {
  id: string;
  label: string;
  category?: string;
  x: number; // percentage
  y: number; // percentage
  level: number;
}

export const MindMapVisualizer: React.FC<MindMapVisualizerProps> = ({ data }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'tree'>('graph');
  const [zoom, setZoom] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const nodes = data?.nodes || [];
  const edges = data?.edges || [];

  // Compute Layout Positions for Graph View
  const nodePositions = useMemo(() => {
    if (!nodes.length) return [];

    // Identify root / central node
    const rootIndex = nodes.findIndex(
      (n) =>
        n.category?.toLowerCase().includes('main') ||
        n.category?.toLowerCase().includes('root') ||
        n.id === '1' ||
        n.id === 'root'
    );
    const rootId = rootIndex !== -1 ? nodes[rootIndex].id : nodes[0].id;

    // Find children of each node
    const childrenMap: Record<string, string[]> = {};
    edges.forEach((edge) => {
      if (!childrenMap[edge.from]) childrenMap[edge.from] = [];
      childrenMap[edge.from].push(edge.to);
    });

    // Classify into levels: Root (Level 0), Level 1, Level 2
    const level0: MindMapNode[] = [];
    const level1: MindMapNode[] = [];
    const level2: MindMapNode[] = [];

    const rootNode = nodes.find((n) => n.id === rootId) || nodes[0];
    level0.push(rootNode);

    // Direct children of root -> Level 1
    const l1Ids = new Set(childrenMap[rootId] || []);
    nodes.forEach((n) => {
      if (n.id === rootId) return;
      if (l1Ids.has(n.id) || level1.length < 4) {
        level1.push(n);
      } else {
        level2.push(n);
      }
    });

    // If level1 is too small, split remaining among level 1 & 2
    if (level1.length === 0 && nodes.length > 1) {
      const half = Math.ceil((nodes.length - 1) / 2);
      level1.push(...nodes.slice(1, 1 + half));
      level2.push(...nodes.slice(1 + half));
    }

    const positions: NodePosition[] = [];

    // Position Root at top-center
    positions.push({
      id: rootNode.id,
      label: rootNode.label,
      category: rootNode.category || 'Main Topic',
      x: 50,
      y: 15,
      level: 0,
    });

    // Position Level 1 (middle row)
    const l1Count = level1.length;
    level1.forEach((node, idx) => {
      const step = 80 / Math.max(l1Count - 1, 1);
      const x = l1Count === 1 ? 50 : 10 + idx * step;
      positions.push({
        id: node.id,
        label: node.label,
        category: node.category || 'Topic',
        x: x,
        y: 50,
        level: 1,
      });
    });

    // Position Level 2 (bottom row)
    const l2Count = level2.length;
    level2.forEach((node, idx) => {
      const step = 80 / Math.max(l2Count - 1, 1);
      const x = l2Count === 1 ? 50 : 10 + idx * step;
      positions.push({
        id: node.id,
        label: node.label,
        category: node.category || 'Subtopic',
        x: x,
        y: 85,
        level: 2,
      });
    });

    return positions;
  }, [nodes, edges]);

  // Map for quick position lookup by ID
  const posMap = useMemo(() => {
    const map = new Map<string, NodePosition>();
    nodePositions.forEach((p) => map.set(p.id, p));
    return map;
  }, [nodePositions]);

  // Synthesize edges if none exist from backend
  const displayEdges = useMemo(() => {
    if (edges && edges.length > 0) return edges;
    // Fallback: connect root (level 0) to level 1, and level 1 to level 2
    const generated: MindMapEdge[] = [];
    const root = nodePositions.find((n) => n.level === 0);
    const l1 = nodePositions.filter((n) => n.level === 1);
    const l2 = nodePositions.filter((n) => n.level === 2);

    if (root) {
      l1.forEach((child) => {
        generated.push({ from: root.id, to: child.id, label: 'includes' });
      });
    }

    if (l1.length > 0) {
      l2.forEach((child, index) => {
        const parent = l1[index % l1.length];
        generated.push({ from: parent.id, to: child.id, label: 'details' });
      });
    }

    return generated;
  }, [edges, nodePositions]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-xl bg-slate-900/60 text-slate-400">
        No concept map data available.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'graph'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Network className="w-3.5 h-3.5" /> Visual Graph
          </button>
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'tree'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" /> Outline View
          </button>
        </div>

        {activeTab === 'graph' && (
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60 text-xs text-slate-300">
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Canvas / Content Container */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[380px] max-h-[500px] w-full bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-inner select-none"
      >
        {activeTab === 'graph' ? (
          <div
            className="w-full h-full relative transition-transform duration-200 ease-out origin-center"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* SVG Connecting Lines Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="edgeActive" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="1" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {displayEdges.map((edge, idx) => {
                const fromPos = posMap.get(edge.from);
                const toPos = posMap.get(edge.to);

                if (!fromPos || !toPos) return null;

                const isHighlighted =
                  hoveredNode === edge.from || hoveredNode === edge.to;

                // Bezier curve calculation
                const startX = `${fromPos.x}%`;
                const startY = `${fromPos.y}%`;
                const endX = `${toPos.x}%`;
                const endY = `${toPos.y}%`;

                // Control points for a smooth, natural curve
                const midY = (fromPos.y + toPos.y) / 2;

                return (
                  <g key={`edge-${idx}`}>
                    <path
                      d={`M ${fromPos.x}% ${fromPos.y}% C ${fromPos.x}% ${midY}%, ${toPos.x}% ${midY}%, ${toPos.x}% ${toPos.y}%`}
                      fill="none"
                      stroke={isHighlighted ? "url(#edgeActive)" : "url(#edgeGradient)"}
                      strokeWidth={isHighlighted ? 3.5 : 2}
                      strokeDasharray={isHighlighted ? "6 3" : "none"}
                      filter={isHighlighted ? "url(#glow)" : undefined}
                      className="transition-all duration-300"
                    />
                    {edge.label && (
                      <text
                        x={`${(fromPos.x + toPos.x) / 2}%`}
                        y={`${midY}%`}
                        fill="#94a3b8"
                        fontSize="10"
                        textAnchor="middle"
                        dy="-4"
                        className="bg-slate-900 font-sans font-semibold tracking-wide"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes Layer */}
            <div className="absolute inset-0 z-10 pointer-events-auto">
              {nodePositions.map((node) => {
                const isHovered = hoveredNode === node.id;
                const isConnected =
                  hoveredNode !== null &&
                  displayEdges.some(
                    (e) =>
                      (e.from === hoveredNode && e.to === node.id) ||
                      (e.to === hoveredNode && e.from === node.id)
                  );
                const isMain = node.level === 0;
                const isSub = node.level === 1;

                return (
                  <div
                    key={node.id}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute cursor-pointer transition-all duration-300 ease-out select-none
                      ${
                        isMain
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/50'
                          : isSub
                          ? 'bg-slate-800/90 text-cyan-200 border border-cyan-500/40 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-500/20'
                          : 'bg-slate-900/90 text-slate-300 border border-slate-700/60 hover:border-blue-500/50'
                      }
                      ${isHovered ? 'scale-110 z-30 ring-4 ring-blue-400/40' : ''}
                      ${isConnected ? 'ring-2 ring-indigo-400 shadow-md' : ''}
                      rounded-xl px-4 py-2.5 max-w-[200px] text-center backdrop-blur-md
                    `}
                  >
                    <div className="text-xs font-bold truncate leading-tight">
                      {node.label}
                    </div>
                    {node.category && (
                      <div
                        className={`text-[9px] font-semibold mt-1 uppercase tracking-wider ${
                          isMain
                            ? 'text-blue-100'
                            : isSub
                            ? 'text-cyan-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {node.category}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Structured Outline / Tree View */
          <div className="p-4 overflow-y-auto max-h-[460px] space-y-3">
            {nodePositions
              .filter((n) => n.level === 0)
              .map((root) => (
                <div
                  key={root.id}
                  className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-3 shadow-sm"
                >
                  <div className="flex items-center gap-2 font-semibold text-blue-400 text-sm mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    {root.label}
                    <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800">
                      {root.category}
                    </span>
                  </div>

                  <div className="pl-4 border-l-2 border-slate-700/50 space-y-2 mt-2">
                    {nodePositions
                      .filter((n) => n.level === 1)
                      .map((sub) => (
                        <div key={sub.id} className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                            {sub.label}
                            {sub.category && (
                              <span className="text-[9px] text-slate-400">({sub.category})</span>
                            )}
                          </div>

                          <div className="pl-4 flex flex-wrap gap-1.5 pt-1">
                            {nodePositions
                              .filter((n) => n.level === 2)
                              .slice(0, 3)
                              .map((leaf) => (
                                <span
                                  key={leaf.id}
                                  className="text-[11px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                                >
                                  {leaf.label}
                                </span>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MindMapVisualizer;
