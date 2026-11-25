import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Save,
  ArrowLeft,
  MousePointer,
  Share2,
  Download,
  FileCode,
  Sparkles,
  History,
  Users,
  Upload,
  ChevronDown,
  Bookmark
} from 'lucide-react';

export const BfovToolbar = ({
  title = 'Untitled Diagram',
  version = 1,
  isSaving = false,
  hasUnsavedChanges = false,
  activeTool = 'select',
  gridSettings = { showGrid: true, snapToGrid: true },
  canUndo = false,
  canRedo = false,
  selectedCount = 0,
  zoom = 1,
  onTitleChange,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  onToggleGrid,
  onToggleSnap,
  onSetTool,
  onDeleteSelected,
  onDuplicateSelected,
  onAlign,
  onSave,
  onExportFormat,
  onImportJsonTrigger,
  onOpenMermaidModal,
  onOpenAiModal,
  onOpenVersionModal,
  onOpenShareModal,
  onSaveAsTemplate,
  onBackToList
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  return (
    <div
      className="h-12 border-b border-slate-800 bg-slate-900 px-3 flex items-center justify-between select-none overflow-x-auto"
      style={{ WebkitOverflowScrolling: 'touch', minWidth: 0, scrollbarWidth: 'none' }}
    >
      {/* Left: Back button, Title & Version */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onBackToList}
          title="Back to Diagrams"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
          className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 text-sm font-semibold text-slate-200 px-2 py-1 rounded border border-transparent focus:border-sky-500 outline-none w-44 transition-colors"
          placeholder="Diagram Title..."
        />

        <button
          type="button"
          onClick={onOpenVersionModal}
          title="Version History"
          className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-sky-400 border border-slate-700 transition-colors"
        >
          <History className="w-3 h-3" />
          <span>v{version}</span>
        </button>

        {hasUnsavedChanges && (
          <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
        )}
      </div>

      {/* Center: Canvas Controls, Tools, Alignment */}
      <div className="flex items-center space-x-1">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-800/60 rounded p-0.5 border border-slate-700/50">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
            className="p-1 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
            className="p-1 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pointer vs Connect Tool */}
        <div className="flex items-center bg-slate-800/60 rounded p-0.5 border border-slate-700/50">
          <button
            type="button"
            onClick={() => onSetTool && onSetTool('select')}
            title="Select & Move Tool (V)"
            className={`p-1 rounded ${activeTool === 'select' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSetTool && onSetTool('connect')}
            title="Connector Tool (C)"
            className={`p-1 rounded ${activeTool === 'connect' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Node Actions when selected */}
        {selectedCount > 0 && (
          <div className="flex items-center bg-slate-800/60 rounded p-0.5 border border-slate-700/50">
            <button
              type="button"
              onClick={onDuplicateSelected}
              title="Duplicate (Ctrl+D)"
              className="p-1 rounded hover:bg-slate-700 text-slate-300"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDeleteSelected}
              title="Delete (Del)"
              className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Alignment controls when multiple nodes selected */}
        {selectedCount >= 2 && (
          <div className="flex items-center bg-slate-800/60 rounded p-0.5 border border-slate-700/50">
            <button type="button" onClick={() => onAlign && onAlign('left')} title="Align Left" className="p-1 rounded hover:bg-slate-700 text-slate-300">
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => onAlign && onAlign('center')} title="Align Center" className="p-1 rounded hover:bg-slate-700 text-slate-300">
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => onAlign && onAlign('right')} title="Align Right" className="p-1 rounded hover:bg-slate-700 text-slate-300">
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => onAlign && onAlign('top')} title="Align Top" className="p-1 rounded hover:bg-slate-700 text-slate-300">
              <AlignStartVertical className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => onAlign && onAlign('middle')} title="Align Middle" className="p-1 rounded hover:bg-slate-700 text-slate-300">
              <AlignCenterVertical className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => onAlign && onAlign('bottom')} title="Align Bottom" className="p-1 rounded hover:bg-slate-700 text-slate-300">
              <AlignEndVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Grid & Snap */}
        <div className="flex items-center bg-slate-800/60 rounded p-0.5 border border-slate-700/50">
          <button
            type="button"
            onClick={onToggleGrid}
            title={`Toggle Grid (${gridSettings.showGrid ? 'On' : 'Off'})`}
            className={`p-1 rounded ${gridSettings.showGrid ? 'text-sky-400 bg-slate-700' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleSnap}
            title={`Toggle Snap to Grid (${gridSettings.snapToGrid ? 'On' : 'Off'})`}
            className={`p-1 rounded ${gridSettings.snapToGrid ? 'text-sky-400 bg-slate-700' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-800/60 rounded p-0.5 border border-slate-700/50">
          <button type="button" onClick={onZoomOut} title="Zoom Out" className="p-1 rounded hover:bg-slate-700 text-slate-300">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onZoomReset} title="Reset Zoom" className="px-1 text-[11px] font-mono text-slate-300 hover:text-white">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" onClick={onZoomIn} title="Zoom In" className="p-1 rounded hover:bg-slate-700 text-slate-300">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onZoomFit} title="Fit to Screen" className="p-1 rounded hover:bg-slate-700 text-slate-300">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Master 15 Advanced Actions (Mermaid, AI, Share, Export, Save) */}
      <div className="flex items-center space-x-1.5 relative">
        {/* Mermaid Import */}
        <button
          type="button"
          onClick={onOpenMermaidModal}
          title="Import Mermaid DSL"
          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-sky-400" />
          <span>Mermaid</span>
        </button>

        {/* AI Assistant */}
        <button
          type="button"
          onClick={onOpenAiModal}
          title="AI Text-to-Diagram & Assisted Editing"
          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 rounded border border-amber-500/30 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Copilot</span>
        </button>

        {/* Share & Comments */}
        <button
          type="button"
          onClick={onOpenShareModal}
          title="Collaboration & Comments"
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
        </button>

        {/* Save as Template */}
        <button
          type="button"
          onClick={onSaveAsTemplate}
          title="Save diagram as reusable blueprint template"
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>

        {/* Multi-Format Export Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs">
              <button
                type="button"
                onClick={() => { setIsExportMenuOpen(false); onExportFormat('svg'); }}
                className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
              >
                <span>Export SVG</span>
                <span className="text-[10px] text-slate-500 font-mono">Vector</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsExportMenuOpen(false); onExportFormat('png'); }}
                className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
              >
                <span>Export PNG</span>
                <span className="text-[10px] text-slate-500 font-mono">Raster</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsExportMenuOpen(false); onExportFormat('pdf'); }}
                className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
              >
                <span>Export PDF</span>
                <span className="text-[10px] text-slate-500 font-mono">Doc</span>
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                type="button"
                onClick={() => { setIsExportMenuOpen(false); onExportFormat('json'); }}
                className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
              >
                <span>Export JSON</span>
                <span className="text-[10px] text-slate-500 font-mono">Data</span>
              </button>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 rounded shadow transition-colors ml-1"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
};
