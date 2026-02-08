import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { TopicPage, CurriculumItem } from '../types';

interface GraphViewProps {
  pages: Record<string, TopicPage>;
  curriculum: CurriculumItem[];
  rootLabel: string;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onGenerateConnection: (nodeLabels: string[]) => void;
  isConnecting: boolean;
}

const GraphView: React.FC<GraphViewProps> = ({ pages, curriculum, rootLabel, onClose, onNavigate, onGenerateConnection, isConnecting }) => {
  const fgRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const labels: string[] = [];
    const addedNodeIds = new Set<string>();

    // 1. Root Node
    const rootId = 'root_goal';
    nodes.push({ id: rootId, name: rootLabel.toUpperCase(), val: 30, color: '#a855f7', isRoot: true });
    addedNodeIds.add(rootId);

    // 2. Traversal Helper
    const traverse = (items: CurriculumItem[], parentId: string) => {
      items.forEach(item => {
        labels.push(item.label);
        
        // Match label to potential generated topic page ID
        const matchingPage = Object.values(pages).find(p => p.title.toLowerCase() === item.label.toLowerCase());
        const nodeId = matchingPage ? matchingPage.id : `curric_${item.id}`;
        const isUnlocked = !!matchingPage;

        if (!addedNodeIds.has(nodeId)) {
          nodes.push({ 
            id: nodeId, 
            name: item.label.toUpperCase(), 
            val: isUnlocked ? 15 : 8, 
            color: isUnlocked ? '#3b82f6' : '#525252', 
            isUnlocked 
          });
          addedNodeIds.add(nodeId);
        }
        
        links.push({ source: parentId, target: nodeId });

        if (item.children && item.children.length > 0) {
          traverse(item.children, nodeId);
        }
      });
    };
    
    traverse(curriculum, rootId);

    // 3. Ad-Hoc Nodes (Pages created via links that might not be in the curriculum tree)
    Object.values(pages).forEach(page => {
      if (!addedNodeIds.has(page.id)) {
        nodes.push({ 
          id: page.id, 
          name: page.title.toUpperCase(), 
          val: 12, 
          color: '#60a5fa', 
          isUnlocked: true 
        });
        addedNodeIds.add(page.id);
        labels.push(page.title);

        // Link to parent if parent is in the graph
        if (page.parentId && addedNodeIds.has(page.parentId)) {
          links.push({ source: page.parentId, target: page.id });
        } else {
          // Link to root if parentless or parent not yet added
          links.push({ source: rootId, target: page.id });
        }
      }
    });

    return { nodes, links, labels };
  }, [pages, curriculum, rootLabel]);

  const handleNodeClick = useCallback((node: any) => {
    if (node.isUnlocked && node.id && node.id !== 'root_goal') {
      onNavigate(node.id);
    } else if (node.isRoot) {
      if (fgRef.current) fgRef.current.cameraPosition({ x: 0, y: 0, z: 300 }, node, 1000);
    }
  }, [onNavigate]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col p-0 overflow-hidden">
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h2 className="text-4xl font-black tracking-tighter uppercase">MindMap 3D</h2>
        <p className="text-neutral-500 font-medium uppercase">Root: <span className="text-purple-400">{rootLabel}</span>. Blue nodes are unlocked.</p>
      </div>
      
      <button onClick={onClose} className="absolute top-24 right-8 z-[60] w-12 h-12 rounded-2xl glass hover:bg-white/10 flex items-center justify-center transition-all border border-white/10">
        <i className="fa-solid fa-times text-xl"></i>
      </button>

      <div className="flex-1 w-full h-full">
          <ForceGraph3D 
            ref={fgRef} 
            graphData={data} 
            nodeLabel="name" 
            nodeColor="color" 
            nodeRelSize={6} 
            linkColor={() => '#ffffff40'} 
            linkWidth={3} 
            showNavInfo={false} 
            onNodeClick={handleNodeClick} 
            backgroundColor="#0a0a0a" 
          />
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col gap-4 items-center">
        <button onClick={() => onGenerateConnection(data.labels)} disabled={isConnecting} className="px-8 py-4 rounded-full glass border border-purple-500/50 hover:bg-purple-500/20 flex items-center gap-3 transition-all active:scale-95 shadow-[0_0_40px_rgba(168,85,247,0.4)]">
          {isConnecting ? <i className="fa-solid fa-spinner animate-spin text-purple-400"></i> : <i className="fa-solid fa-draw-polygon text-purple-400"></i>}
          <span className="font-black uppercase tracking-widest text-xs text-white">Find Smart Connection</span>
        </button>
      </div>
    </div>
  );
};

export default GraphView;