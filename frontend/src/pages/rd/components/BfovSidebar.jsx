import React, { useState } from 'react';
import {
  Square,
  Circle,
  Diamond,
  Triangle,
  Type,
  Workflow,
  Database,
  FileText,
  Server,
  Cloud,
  Shield,
  Layers,
  ChevronDown,
  ChevronRight,
  Boxes,
  Network,
  X
} from 'lucide-react';

const SHAPE_CATEGORIES = [
  {
    id: 'basic',
    name: 'Basic Shapes',
    icon: Square,
    shapes: [
      { type: 'rectangle', label: 'Rectangle', icon: Square, width: 130, height: 60 },
      { type: 'rounded_rectangle', label: 'Rounded Rect', icon: Square, width: 130, height: 60 },
      { type: 'circle', label: 'Circle', icon: Circle, width: 80, height: 80 },
      { type: 'ellipse', label: 'Ellipse', icon: Circle, width: 120, height: 70 },
      { type: 'diamond', label: 'Diamond', icon: Diamond, width: 100, height: 80 },
      { type: 'triangle', label: 'Triangle', icon: Triangle, width: 90, height: 80 },
      { type: 'text', label: 'Text Box', icon: Type, width: 120, height: 40 }
    ]
  },
  {
    id: 'flowchart',
    name: 'Flowchart Shapes',
    icon: Workflow,
    shapes: [
      { type: 'terminator', label: 'Start / End', icon: Workflow, width: 140, height: 50 },
      { type: 'process', label: 'Process', icon: Square, width: 140, height: 65 },
      { type: 'decision', label: 'Decision', icon: Diamond, width: 120, height: 80 },
      { type: 'input_output', label: 'Input / Output', icon: Square, width: 150, height: 60 },
      { type: 'document', label: 'Document', icon: FileText, width: 130, height: 70 },
      { type: 'database', label: 'Database', icon: Database, width: 120, height: 80 }
    ]
  },
  {
    id: 'technical',
    name: 'UML & ERD Shapes',
    icon: Boxes,
    shapes: [
      { type: 'uml_class', label: 'UML Class', icon: Boxes, width: 180, height: 140 },
      { type: 'entity', label: 'ERD Entity', icon: Layers, width: 180, height: 120 },
      { type: 'attribute', label: 'Attribute', icon: Circle, width: 110, height: 50 },
      { type: 'relationship', label: 'Relationship', icon: Diamond, width: 120, height: 70 },
      { type: 'uml_usecase', label: 'Use Case', icon: Circle, width: 140, height: 60 }
    ]
  },
  {
    id: 'network',
    name: 'Network & Cloud',
    icon: Network,
    shapes: [
      { type: 'server', label: 'Host Server', icon: Server, width: 130, height: 65 },
      { type: 'cloud', label: 'Cloud Network', icon: Cloud, width: 140, height: 75 },
      { type: 'firewall', label: 'WAF Firewall', icon: Shield, width: 130, height: 60 },
      { type: 'network_node', label: 'Gateway Node', icon: Network, width: 130, height: 60 }
    ]
  }
];

export const BfovSidebar = ({ onAddShape, onClose }) => {
  const [openCategories, setOpenCategories] = useState({
    basic: true,
    flowchart: true,
    technical: true,
    network: true
  });

  const toggleCategory = (catId) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleDragStart = (e, shape) => {
    e.dataTransfer.setData('application/bfov-shape', shape.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/90 flex flex-col h-full select-none">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Workflow className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Shape Library</h2>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded hidden sm:inline">Drag & Drop</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {SHAPE_CATEGORIES.map((category) => {
          const isOpen = openCategories[category.id];
          const CategoryIcon = category.icon;

          return (
            <div key={category.id} className="border border-slate-800/80 rounded bg-slate-950/40 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <CategoryIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{category.name}</span>
                </div>
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {isOpen && (
                <div className="p-2 grid grid-cols-2 gap-1.5 border-t border-slate-800/60 bg-slate-900/50">
                  {category.shapes.map((shape) => {
                    const ShapeIcon = shape.icon;
                    return (
                      <div
                        key={shape.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, shape)}
                        onClick={() => onAddShape && onAddShape(shape.type)}
                        title={`Click to add or drag onto canvas: ${shape.label}`}
                        className="flex flex-col items-center justify-center p-2 rounded bg-slate-800/40 hover:bg-slate-800 hover:border-sky-500/50 border border-transparent cursor-grab active:cursor-grabbing text-slate-300 transition-all text-center group"
                      >
                        <ShapeIcon className="w-4 h-4 mb-1 text-slate-400 group-hover:text-sky-400 transition-colors" />
                        <span className="text-[11px] leading-tight line-clamp-1">{shape.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

