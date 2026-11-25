import React from 'react';
import {
  Palette,
  Sliders,
  Type,
  Square,
  Share2,
  FileCode,
  Tag,
  Hash,
  RotateCw,
  X
} from 'lucide-react';

const PRESET_COLORS = [
  '#ffffff', '#f8fafc', '#ecfdf5', '#eff6ff', '#fef3c7', '#fff1f2', '#fdf4ff',
  '#0f172a', '#475569', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'
];

export const BfovProperties = ({
  selectedNode = null,
  selectedEdge = null,
  diagramMeta = {},
  nodeCount = 0,
  edgeCount = 0,
  onUpdateNodeStyle,
  onUpdateNodeText,
  onUpdateNodeBounds,
  onUpdateEdge,
  onUpdateMeta,
  onClose
}) => {
  if (selectedNode) {
    const style = selectedNode.style || {};

    return (
      <aside className="w-64 border-l border-slate-800 bg-slate-900/90 flex flex-col h-full select-none overflow-y-auto">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Square className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Shape Properties</h3>
          </div>
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

        <div className="p-3 space-y-4">
          {/* Label / Text */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1 flex items-center space-x-1">
              <Type className="w-3 h-3 text-slate-400" />
              <span>Label / Text</span>
            </label>
            <textarea
              rows={3}
              value={selectedNode.label || ''}
              onChange={(e) => onUpdateNodeText && onUpdateNodeText(selectedNode.id, e.target.value)}
              placeholder="Enter text..."
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 focus:border-sky-500 outline-none"
            />
          </div>

          {/* Typography options */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400">Font Size</label>
              <select
                value={style.fontSize || 13}
                onChange={(e) => onUpdateNodeStyle && onUpdateNodeStyle(selectedNode.id, { fontSize: Number(e.target.value) })}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-1 text-slate-300"
              >
                {[10, 11, 12, 13, 14, 16, 18, 20, 24, 28].map(s => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Weight</label>
              <select
                value={style.fontWeight || 'normal'}
                onChange={(e) => onUpdateNodeStyle && onUpdateNodeStyle(selectedNode.id, { fontWeight: e.target.value })}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-1 text-slate-300"
              >
                <option value="normal">Regular</option>
                <option value="500">Medium</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>

          {/* Fill Color */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1 flex items-center space-x-1">
              <Palette className="w-3 h-3 text-slate-400" />
              <span>Fill Color</span>
            </label>
            <div className="flex items-center space-x-2 mb-1.5">
              <input
                type="color"
                value={style.fill?.startsWith('#') ? style.fill : '#ffffff'}
                onChange={(e) => onUpdateNodeStyle && onUpdateNodeStyle(selectedNode.id, { fill: e.target.value })}
                className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono text-slate-300">{style.fill || '#ffffff'}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  style={{ backgroundColor: c }}
                  onClick={() => onUpdateNodeStyle && onUpdateNodeStyle(selectedNode.id, { fill: c })}
                  className="w-4 h-4 rounded-sm border border-slate-700 hover:scale-110 transition-transform"
                />
              ))}
            </div>
          </div>

          {/* Border / Stroke */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1 flex items-center space-x-1">
              <Sliders className="w-3 h-3 text-slate-400" />
              <span>Border & Stroke</span>
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="color"
                value={style.stroke?.startsWith('#') ? style.stroke : '#475569'}
                onChange={(e) => onUpdateNodeStyle && onUpdateNodeStyle(selectedNode.id, { stroke: e.target.value })}
                className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
              />
              <select
                value={style.strokeWidth || 2}
                onChange={(e) => onUpdateNodeStyle && onUpdateNodeStyle(selectedNode.id, { strokeWidth: Number(e.target.value) })}
                className="text-xs bg-slate-950 border border-slate-700 rounded p-1 text-slate-300"
              >
                {[1, 2, 3, 4, 6].map(w => (
                  <option key={w} value={w}>{w}px Width</option>
                ))}
              </select>
            </div>
            <select
              value={style.strokeDasharray || 'solid'}
              onChange={(e) => onUpdateNodeStyle && onUpdateNodeStyle(selectedNode.id, { strokeDasharray: e.target.value === 'solid' ? null : e.target.value })}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-1 text-slate-300"
            >
              <option value="solid">Solid Line</option>
              <option value="4 4">Dashed Line</option>
              <option value="2 2">Dotted Line</option>
            </select>
          </div>

          {/* Dimensions & Coordinates */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-500 mb-2 block">Geometry</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400">Width</span>
                <input
                  type="number"
                  value={selectedNode.width || 120}
                  onChange={(e) => onUpdateNodeBounds && onUpdateNodeBounds(selectedNode.id, { width: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Height</span>
                <input
                  type="number"
                  value={selectedNode.height || 60}
                  onChange={(e) => onUpdateNodeBounds && onUpdateNodeBounds(selectedNode.id, { height: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">X Pos</span>
                <input
                  type="number"
                  value={selectedNode.x || 0}
                  onChange={(e) => onUpdateNodeBounds && onUpdateNodeBounds(selectedNode.id, { x: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Y Pos</span>
                <input
                  type="number"
                  value={selectedNode.y || 0}
                  onChange={(e) => onUpdateNodeBounds && onUpdateNodeBounds(selectedNode.id, { y: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  if (selectedEdge) {
    const style = selectedEdge.style || {};

    return (
      <aside className="w-64 border-l border-slate-800 bg-slate-900/90 flex flex-col h-full select-none overflow-y-auto">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Connector Line</h3>
          </div>
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

        <div className="p-3 space-y-4">
          {/* Edge Label */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1 block">Edge Label</label>
            <input
              type="text"
              value={selectedEdge.label || ''}
              onChange={(e) => onUpdateEdge && onUpdateEdge(selectedEdge.id, { label: e.target.value })}
              placeholder="Label (e.g. Yes, No, 1:N)..."
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 focus:border-sky-500 outline-none"
            />
          </div>

          {/* Connector Routing Type */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1 block">Routing Style</label>
            <select
              value={selectedEdge.type || 'straight'}
              onChange={(e) => onUpdateEdge && onUpdateEdge(selectedEdge.id, { type: e.target.value })}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-300"
            >
              <option value="straight">Straight Line</option>
              <option value="elbow">Elbow (Orthogonal)</option>
              <option value="curved">Curved (Bezier)</option>
            </select>
          </div>

          {/* Line Stroke & Width */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1 block">Stroke Style</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="color"
                value={style.stroke?.startsWith('#') ? style.stroke : '#64748b'}
                onChange={(e) => onUpdateEdge && onUpdateEdge(selectedEdge.id, { style: { ...style, stroke: e.target.value } })}
                className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
              />
              <select
                value={style.strokeWidth || 2}
                onChange={(e) => onUpdateEdge && onUpdateEdge(selectedEdge.id, { style: { ...style, strokeWidth: Number(e.target.value) } })}
                className="text-xs bg-slate-950 border border-slate-700 rounded p-1 text-slate-300"
              >
                {[1, 2, 3, 4].map(w => (
                  <option key={w} value={w}>{w}px Width</option>
                ))}
              </select>
            </div>
            <select
              value={style.strokeDasharray || 'solid'}
              onChange={(e) => onUpdateEdge && onUpdateEdge(selectedEdge.id, { style: { ...style, strokeDasharray: e.target.value === 'solid' ? null : e.target.value } })}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-1 text-slate-300"
            >
              <option value="solid">Solid Stroke</option>
              <option value="4 4">Dashed Stroke</option>
              <option value="2 2">Dotted Stroke</option>
            </select>
          </div>
        </div>
      </aside>
    );
  }

  // Fallback: Diagram Global Metadata
  return (
    <aside className="w-64 border-l border-slate-800 bg-slate-900/90 flex flex-col h-full select-none overflow-y-auto">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Diagram Settings</h3>
        </div>
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

      <div className="p-3 space-y-4">
        <div>
          <label className="text-[11px] font-medium text-slate-400 mb-1 block">Description</label>
          <textarea
            rows={3}
            value={diagramMeta.description || ''}
            onChange={(e) => onUpdateMeta && onUpdateMeta({ description: e.target.value })}
            placeholder="Architecture / workflow notes..."
            className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 focus:border-sky-500 outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 mb-1 block">Diagram Type</label>
          <select
            value={diagramMeta.diagramType || 'FLOWCHART'}
            onChange={(e) => onUpdateMeta && onUpdateMeta({ diagramType: e.target.value })}
            className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-300"
          >
            <option value="FLOWCHART">Flowchart</option>
            <option value="UML">UML Diagram</option>
            <option value="ERD">Entity Relationship (ERD)</option>
            <option value="NETWORK">Network Topology</option>
            <option value="GENERAL">General Architecture</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 mb-1 block">Category</label>
          <select
            value={diagramMeta.category || 'General'}
            onChange={(e) => onUpdateMeta && onUpdateMeta({ category: e.target.value })}
            className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-300"
          >
            <option value="General">General</option>
            <option value="Architecture">System Architecture</option>
            <option value="Process">Business Process</option>
            <option value="Data Model">Data Model</option>
            <option value="Network">Infrastructure & Cloud</option>
            <option value="R&D">R&D Experimentation</option>
          </select>
        </div>

        <div className="pt-3 border-t border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-500 mb-2 block">Telemetry & Stats</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Total Nodes</span>
              <span className="text-base font-bold text-sky-400">{nodeCount}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Total Connectors</span>
              <span className="text-base font-bold text-emerald-400">{edgeCount}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

