import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Workflow,
  Plus,
  Search,
  Filter,
  FileCode,
  Copy,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  Boxes,
  Database,
  Server,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Upload,
  Bookmark
} from 'lucide-react';
import { bfovService } from '../../services/bfovService';
import { useToast } from '../../context/ToastContext';
import { BfovCanvas } from './components/BfovCanvas';
import { BfovToolbar } from './components/BfovToolbar';
import { BfovSidebar } from './components/BfovSidebar';
import { BfovProperties } from './components/BfovProperties';
import { BfovMermaidModal } from './components/BfovMermaidModal';
import { BfovAiModal } from './components/BfovAiModal';
import { BfovVersionModal } from './components/BfovVersionModal';
import { BfovShareModal } from './components/BfovShareModal';

export const RdBfovCharts = () => {
  const { showToast } = useToast() || { showToast: (msg) => console.log(msg) };

  // View state: 'gallery' | 'editor'
  const [viewMode, setViewMode] = useState('gallery');

  // Gallery state
  const [diagrams, setDiagrams] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Active Editor state
  const [activeDiagramId, setActiveDiagramId] = useState(null);
  const [diagramTitle, setDiagramTitle] = useState('Untitled Diagram');
  const [diagramVersion, setDiagramVersion] = useState(1);
  const [diagramMeta, setDiagramMeta] = useState({
    description: '',
    diagramType: 'FLOWCHART',
    category: 'General',
    tags: []
  });
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'connect'
  const [gridSettings, setGridSettings] = useState({ showGrid: true, snapToGrid: true, gridSize: 10 });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mobilePanel, setMobilePanel] = useState('none'); // 'none' | 'shapes' | 'properties'

  // Advanced Master 15 Modals
  const [isMermaidModalOpen, setIsMermaidModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalMode, setAiModalMode] = useState('generate');
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Hidden JSON file input ref
  const jsonFileInputRef = useRef(null);

  // Undo / Redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Push snapshot to undo stack
  const pushHistory = useCallback((currentNodes, currentEdges) => {
    const snapshot = {
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges))
    };
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, snapshot];
    });
    setHistoryIndex((prev) => prev + 1);
    setHasUnsavedChanges(true);
  }, [historyIndex]);

  // Load telemetry and diagrams on mount
  const loadGalleryData = useCallback(async () => {
    try {
      setLoading(true);
      const [diagRes, tmplRes, telRes] = await Promise.all([
        bfovService.listDiagrams({ search: searchQuery, diagramType: selectedTypeFilter }),
        bfovService.listTemplates(),
        bfovService.getWorkspaceTelemetry()
      ]);

      if (diagRes?.diagrams) setDiagrams(diagRes.diagrams);
      if (tmplRes?.templates) setTemplates(tmplRes.templates);
      if (telRes?.telemetry) setTelemetry(telRes.telemetry);
    } catch (err) {
      console.error('[BFOV] Failed to load gallery data:', err);
      showToast('Failed to load diagrams list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTypeFilter]);

  useEffect(() => {
    loadGalleryData();
  }, [loadGalleryData]);

  // Open existing diagram in editor
  const handleOpenDiagram = async (diagramId) => {
    try {
      setLoading(true);
      const res = await bfovService.getDiagramById(diagramId);
      if (res?.diagram) {
        const d = res.diagram;
        setActiveDiagramId(d.id);
        setDiagramTitle(d.title);
        setDiagramVersion(d.version || 1);
        setDiagramMeta({
          description: d.description || '',
          diagramType: d.diagramType,
          category: d.category,
          tags: d.tags || []
        });

        const g = d.graphData || { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
        setNodes(g.nodes || []);
        setEdges(g.edges || []);
        setViewport(g.viewport || { x: 0, y: 0, zoom: 1 });
        setSelectedNodeIds([]);
        setSelectedEdgeId(null);
        setHasUnsavedChanges(false);

        // Reset history
        setHistory([{ nodes: g.nodes || [], edges: g.edges || [] }]);
        setHistoryIndex(0);

        setViewMode('editor');
      }
    } catch (err) {
      console.error('[BFOV] Failed to open diagram:', err);
      showToast('Could not open diagram: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create new blank diagram
  const handleCreateBlank = async () => {
    try {
      const defaultTitle = `New Architecture Diagram (${new Date().toLocaleDateString()})`;
      const res = await bfovService.createDiagram({
        title: defaultTitle,
        diagramType: 'FLOWCHART',
        category: 'General',
        graphData: {
          nodes: [
            {
              id: 'node-start',
              type: 'terminator',
              x: 200,
              y: 100,
              width: 140,
              height: 50,
              label: 'Start Node',
              style: { fill: '#ecfdf5', stroke: '#10b981', strokeWidth: 2, textColor: '#065f46' }
            }
          ],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 }
        }
      });

      if (res?.diagram) {
        showToast('Created new diagram canvas.', 'success');
        handleOpenDiagram(res.diagram.id);
      }
    } catch (err) {
      console.error('[BFOV] Error creating diagram:', err);
      showToast('Failed to create diagram: ' + err.message, 'error');
    }
  };

  // Instantiate from template
  const handleCreateFromTemplate = async (templateKey) => {
    try {
      setIsTemplateModalOpen(false);
      const res = await bfovService.createFromTemplate(templateKey);
      if (res?.diagram) {
        showToast('Diagram initialized from template blueprint.', 'success');
        handleOpenDiagram(res.diagram.id);
      }
    } catch (err) {
      console.error('[BFOV] Failed template instantiation:', err);
      showToast('Failed to instantiate template: ' + err.message, 'error');
    }
  };

  // Save current diagram
  const handleSaveDiagram = async () => {
    if (!activeDiagramId) return;

    try {
      setIsSaving(true);
      const updated = await bfovService.updateDiagram(activeDiagramId, {
        title: diagramTitle,
        description: diagramMeta.description,
        diagramType: diagramMeta.diagramType,
        category: diagramMeta.category,
        graphData: {
          nodes,
          edges,
          viewport
        }
      });

      if (updated?.diagram) {
        setDiagramVersion(updated.diagram.version);
      }
      setHasUnsavedChanges(false);
      showToast('Diagram changes saved with version snapshot.', 'success');
    } catch (err) {
      console.error('[BFOV] Save failed:', err);
      showToast('Failed to save diagram: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save as Template
  const handleSaveAsTemplate = async () => {
    if (!activeDiagramId) return;
    try {
      await bfovService.saveAsTemplate(activeDiagramId, {
        title: `${diagramTitle} (Template)`,
        category: diagramMeta.category
      });
      showToast('Diagram saved as reusable template blueprint.', 'success');
    } catch (e) {
      showToast('Failed to save template: ' + e.message, 'error');
    }
  };

  // Multi-Format Export Handler
  const handleExportFormat = async (format) => {
    if (!activeDiagramId) return;

    try {
      if (format === 'svg') {
        const svgContent = await bfovService.exportSvg(activeDiagramId);
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${diagramTitle.replace(/[^a-z0-9]/gi, '_')}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('SVG vector exported.', 'success');
      } else if (format === 'json') {
        const json = await bfovService.exportJson(activeDiagramId);
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${diagramTitle.replace(/[^a-z0-9]/gi, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('JSON graph exported.', 'success');
      } else if (format === 'pdf') {
        const pdfBlob = await bfovService.exportPdf(activeDiagramId);
        const url = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${diagramTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('PDF document exported.', 'success');
      } else if (format === 'png') {
        // High-resolution SVG-to-canvas rasterizer
        const svgContent = await bfovService.exportSvg(activeDiagramId);
        const img = new Image();
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width * 2;
          canvas.height = img.height * 2;
          const ctx = canvas.getContext('2d');
          ctx.scale(2, 2);
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);

          const pngUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `${diagramTitle.replace(/[^a-z0-9]/gi, '_')}.png`;
          a.click();
          showToast('Retina PNG exported.', 'success');
        };
        img.src = url;
      }
    } catch (err) {
      console.error('[BFOV] Export error:', err);
      showToast('Export failed: ' + err.message, 'error');
    }
  };

  // Safe JSON Import Handler
  const handleJsonFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result;
        const res = await bfovService.importJson(content);
        if (res?.diagram) {
          showToast('Imported diagram from JSON file.', 'success');
          handleOpenDiagram(res.diagram.id);
        }
      } catch (err) {
        showToast('Failed to import JSON: ' + (err.response?.data?.errors?.[0] || err.message), 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  // Duplicate diagram
  const handleDuplicate = async (diagramId, title) => {
    try {
      await bfovService.duplicateDiagram(diagramId, `${title} (Copy)`);
      showToast('Diagram duplicated.', 'success');
      loadGalleryData();
    } catch (err) {
      showToast('Duplication failed: ' + err.message, 'error');
    }
  };

  // Delete diagram
  const handleDeleteDiagram = async (diagramId) => {
    if (!window.confirm('Are you sure you want to delete this diagram?')) return;
    try {
      await bfovService.deleteDiagram(diagramId);
      showToast('Diagram deleted.', 'success');
      loadGalleryData();
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  // Node selection
  const handleSelectNode = (nodeId, isMulti = false) => {
    setSelectedEdgeId(null);
    if (!nodeId) {
      setSelectedNodeIds([]);
      return;
    }
    if (isMulti) {
      setSelectedNodeIds((prev) =>
        prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
      );
    } else {
      setSelectedNodeIds([nodeId]);
    }
  };

  const handleSelectEdge = (edgeId) => {
    setSelectedNodeIds([]);
    setSelectedEdgeId(edgeId);
  };

  // Add shape from stencil sidebar click
  const handleAddShape = (shapeType) => {
    const newId = `node-${Date.now()}`;
    const newNode = {
      id: newId,
      type: shapeType,
      x: 200 + nodes.length * 20,
      y: 150 + nodes.length * 20,
      width: shapeType.includes('uml') || shapeType === 'entity' ? 180 : 130,
      height: shapeType.includes('uml') || shapeType === 'entity' ? 120 : 65,
      label: shapeType === 'uml_class' ? 'Class\n--\n+ prop: Type' : shapeType === 'entity' ? 'ENTITY\n--\nPK id' : shapeType.replace('_', ' ').toUpperCase(),
      style: {
        fill: '#ffffff',
        stroke: '#475569',
        strokeWidth: 2,
        textColor: '#0f172a'
      }
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    pushHistory(nextNodes, edges);
    setSelectedNodeIds([newId]);
  };

  // Drop shape from drag-and-drop
  const handleDropShape = (shapeType, worldX, worldY) => {
    const newId = `node-${Date.now()}`;
    const newNode = {
      id: newId,
      type: shapeType,
      x: worldX,
      y: worldY,
      width: shapeType.includes('uml') || shapeType === 'entity' ? 180 : 130,
      height: shapeType.includes('uml') || shapeType === 'entity' ? 120 : 65,
      label: shapeType === 'uml_class' ? 'Class\n--\n+ prop: Type' : shapeType === 'entity' ? 'ENTITY\n--\nPK id' : shapeType.replace('_', ' ').toUpperCase(),
      style: {
        fill: '#ffffff',
        stroke: '#475569',
        strokeWidth: 2,
        textColor: '#0f172a'
      }
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    pushHistory(nextNodes, edges);
    setSelectedNodeIds([newId]);
  };

  // Move node
  const handleMoveNode = (nodeId, nextX, nextY) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, x: nextX, y: nextY } : n))
    );
    setHasUnsavedChanges(true);
  };

  // Resize node
  const handleResizeNode = (nodeId, x, y, width, height) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, x, y, width, height } : n))
    );
    setHasUnsavedChanges(true);
  };

  // Create connector edge
  const handleCreateEdge = (edgeData) => {
    const newEdge = {
      id: `edge-${Date.now()}`,
      source: edgeData.source,
      sourceHandle: edgeData.sourceHandle || 'right',
      target: edgeData.target,
      targetHandle: edgeData.targetHandle || 'left',
      type: edgeData.type || 'straight',
      label: '',
      style: {
        stroke: '#64748b',
        strokeWidth: 2
      }
    };

    const nextEdges = [...edges, newEdge];
    setEdges(nextEdges);
    pushHistory(nodes, nextEdges);
    setSelectedEdgeId(newEdge.id);
  };

  // Delete selected nodes or edges
  const handleDeleteSelected = () => {
    if (selectedNodeIds.length > 0) {
      const nextNodes = nodes.filter((n) => !selectedNodeIds.includes(n.id));
      const nextEdges = edges.filter(
        (e) => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)
      );
      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedNodeIds([]);
      pushHistory(nextNodes, nextEdges);
    } else if (selectedEdgeId) {
      const nextEdges = edges.filter((e) => e.id !== selectedEdgeId);
      setEdges(nextEdges);
      setSelectedEdgeId(null);
      pushHistory(nodes, nextEdges);
    }
  };

  // Duplicate selected node(s)
  const handleDuplicateSelected = () => {
    if (selectedNodeIds.length === 0) return;

    const newNodes = [];
    const newSelectedIds = [];

    for (const nid of selectedNodeIds) {
      const original = nodes.find((n) => n.id === nid);
      if (original) {
        const copyId = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        newNodes.push({
          ...JSON.parse(JSON.stringify(original)),
          id: copyId,
          x: original.x + 30,
          y: original.y + 30
        });
        newSelectedIds.push(copyId);
      }
    }

    const nextNodes = [...nodes, ...newNodes];
    setNodes(nextNodes);
    pushHistory(nextNodes, edges);
    setSelectedNodeIds(newSelectedIds);
  };

  // Align selected nodes
  const handleAlign = async (alignType) => {
    if (selectedNodeIds.length < 2) return;
    const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
    try {
      const res = await bfovService.alignNodes(selectedNodes, alignType);
      if (res?.nodes) {
        const alignedMap = {};
        for (const an of res.nodes) alignedMap[an.id] = an;

        const nextNodes = nodes.map((n) => (alignedMap[n.id] ? alignedMap[n.id] : n));
        setNodes(nextNodes);
        pushHistory(nextNodes, edges);
      }
    } catch (e) {
      console.warn('Align fallback:', e);
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetSnapshot = history[historyIndex - 1];
      setNodes(targetSnapshot.nodes);
      setEdges(targetSnapshot.edges);
      setHistoryIndex((prev) => prev - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetSnapshot = history[historyIndex + 1];
      setNodes(targetSnapshot.nodes);
      setEdges(targetSnapshot.edges);
      setHistoryIndex((prev) => prev - 1);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode !== 'editor') return;
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveDiagram();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, selectedNodeIds, selectedEdgeId, nodes, edges, historyIndex, history]);

  // Selected node & edge objects for properties panel
  const activeSelectedNode = nodes.find((n) => n.id === selectedNodeIds[0]) || null;
  const activeSelectedEdge = edges.find((e) => e.id === selectedEdgeId) || null;

  // Render Editor Mode
  if (viewMode === 'editor') {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-950 font-sans">
        {/* Hidden JSON File Input */}
        <input
          type="file"
          ref={jsonFileInputRef}
          onChange={handleJsonFileSelected}
          accept=".json,application/json"
          style={{ display: 'none' }}
        />

        {/* Top Toolbar */}
        <BfovToolbar
          title={diagramTitle}
          version={diagramVersion}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          activeTool={activeTool}
          gridSettings={gridSettings}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          selectedCount={selectedNodeIds.length}
          zoom={viewport.zoom}
          onTitleChange={setDiagramTitle}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onZoomIn={() => setViewport((v) => ({ ...v, zoom: Math.min(3, v.zoom * 1.15) }))}
          onZoomOut={() => setViewport((v) => ({ ...v, zoom: Math.max(0.25, v.zoom * 0.85) }))}
          onZoomReset={() => setViewport((v) => ({ ...v, zoom: 1 }))}
          onZoomFit={() => setViewport({ x: 50, y: 50, zoom: 0.9 })}
          onToggleGrid={() => setGridSettings((g) => ({ ...g, showGrid: !g.showGrid }))}
          onToggleSnap={() => setGridSettings((g) => ({ ...g, snapToGrid: !g.snapToGrid }))}
          onSetTool={setActiveTool}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onAlign={handleAlign}
          onSave={handleSaveDiagram}
          onExportFormat={handleExportFormat}
          onImportJsonTrigger={() => jsonFileInputRef.current?.click()}
          onOpenMermaidModal={() => setIsMermaidModalOpen(true)}
          onOpenAiModal={() => { setAiModalMode('edit'); setIsAiModalOpen(true); }}
          onOpenVersionModal={() => setIsVersionModalOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onSaveAsTemplate={handleSaveAsTemplate}
          onBackToList={() => {
            if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Return to diagram list?')) {
              return;
            }
            setViewMode('gallery');
            loadGalleryData();
          }}
          mobilePanel={mobilePanel}
          onToggleMobilePanel={setMobilePanel}
        />

        {/* 3-Column Studio Layout */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Desktop Stencil Sidebar */}
          <div className="hidden lg:flex h-full shrink-0">
            <BfovSidebar onAddShape={handleAddShape} />
          </div>

          {/* Canvas Center */}
          <main className="flex-1 relative overflow-hidden h-full">
            <BfovCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeIds={selectedNodeIds}
              selectedEdgeId={selectedEdgeId}
              activeTool={activeTool}
              viewport={viewport}
              gridSettings={gridSettings}
              onSelectNode={handleSelectNode}
              onSelectEdge={handleSelectEdge}
              onMoveNode={handleMoveNode}
              onResizeNode={handleResizeNode}
              onCreateEdge={handleCreateEdge}
              onUpdateViewport={setViewport}
              onDropShape={handleDropShape}
            />
          </main>

          {/* Desktop Properties Panel */}
          <div className="hidden lg:flex h-full shrink-0">
            <BfovProperties
              selectedNode={activeSelectedNode}
              selectedEdge={activeSelectedEdge}
              diagramMeta={diagramMeta}
              nodeCount={nodes.length}
              edgeCount={edges.length}
              onUpdateNodeStyle={(id, stylePatch) => {
                setNodes((prev) =>
                  prev.map((n) =>
                    n.id === id ? { ...n, style: { ...n.style, ...stylePatch } } : n
                  )
                );
                setHasUnsavedChanges(true);
              }}
              onUpdateNodeText={(id, text) => {
                setNodes((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, label: text } : n))
                );
                setHasUnsavedChanges(true);
              }}
              onUpdateNodeBounds={(id, boundsPatch) => {
                setNodes((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, ...boundsPatch } : n))
                );
                setHasUnsavedChanges(true);
              }}
              onUpdateEdge={(id, edgePatch) => {
                setEdges((prev) =>
                  prev.map((e) => (e.id === id ? { ...e, ...edgePatch } : e))
                );
                setHasUnsavedChanges(true);
              }}
              onUpdateMeta={(metaPatch) => {
                setDiagramMeta((prev) => ({ ...prev, ...metaPatch }));
                setHasUnsavedChanges(true);
              }}
            />
          </div>

          {/* Mobile / Tablet Slide-over Drawer for Shapes */}
          {mobilePanel === 'shapes' && (
            <div className="lg:hidden absolute inset-0 z-40 flex">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                onClick={() => setMobilePanel('none')}
              />
              <div className="relative z-50 w-72 max-w-[85vw] h-full shadow-2xl bg-slate-900 animate-in slide-in-from-left duration-200">
                <BfovSidebar
                  onAddShape={(shape) => {
                    handleAddShape(shape);
                    setMobilePanel('none');
                  }}
                  onClose={() => setMobilePanel('none')}
                />
              </div>
            </div>
          )}

          {/* Mobile / Tablet Slide-over Drawer for Properties */}
          {mobilePanel === 'properties' && (
            <div className="lg:hidden absolute inset-0 z-40 flex justify-end">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                onClick={() => setMobilePanel('none')}
              />
              <div className="relative z-50 w-72 max-w-[85vw] h-full shadow-2xl bg-slate-900 animate-in slide-in-from-right duration-200">
                <BfovProperties
                  selectedNode={activeSelectedNode}
                  selectedEdge={activeSelectedEdge}
                  diagramMeta={diagramMeta}
                  nodeCount={nodes.length}
                  edgeCount={edges.length}
                  onClose={() => setMobilePanel('none')}
                  onUpdateNodeStyle={(id, stylePatch) => {
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === id ? { ...n, style: { ...n.style, ...stylePatch } } : n
                      )
                    );
                    setHasUnsavedChanges(true);
                  }}
                  onUpdateNodeText={(id, text) => {
                    setNodes((prev) =>
                      prev.map((n) => (n.id === id ? { ...n, label: text } : n))
                    );
                    setHasUnsavedChanges(true);
                  }}
                  onUpdateNodeBounds={(id, boundsPatch) => {
                    setNodes((prev) =>
                      prev.map((n) => (n.id === id ? { ...n, ...boundsPatch } : n))
                    );
                    setHasUnsavedChanges(true);
                  }}
                  onUpdateEdge={(id, edgePatch) => {
                    setEdges((prev) =>
                      prev.map((e) => (e.id === id ? { ...e, ...edgePatch } : e))
                    );
                    setHasUnsavedChanges(true);
                  }}
                  onUpdateMeta={(metaPatch) => {
                    setDiagramMeta((prev) => ({ ...prev, ...metaPatch }));
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Advanced Feature Modals */}
        <BfovMermaidModal
          isOpen={isMermaidModalOpen}
          onClose={() => setIsMermaidModalOpen(false)}
          onImportToCanvas={(importedGraph, type) => {
            setNodes(importedGraph.nodes || []);
            setEdges(importedGraph.edges || []);
            setViewport(importedGraph.viewport || { x: 50, y: 50, zoom: 1 });
            setDiagramMeta(prev => ({ ...prev, diagramType: type || prev.diagramType }));
            pushHistory(importedGraph.nodes || [], importedGraph.edges || []);
            showToast('Imported Mermaid diagram into canvas.', 'success');
          }}
        />

        <BfovAiModal
          isOpen={isAiModalOpen}
          mode={aiModalMode}
          currentGraphData={{ nodes, edges, viewport }}
          diagramId={activeDiagramId}
          onClose={() => setIsAiModalOpen(false)}
          onApplyGraph={(newGraph, type) => {
            setNodes(newGraph.nodes || []);
            setEdges(newGraph.edges || []);
            if (newGraph.viewport) setViewport(newGraph.viewport);
            if (type) setDiagramMeta(prev => ({ ...prev, diagramType: type }));
            pushHistory(newGraph.nodes || [], newGraph.edges || []);
            showToast('Applied AI diagram structure to canvas.', 'success');
          }}
        />

        <BfovVersionModal
          isOpen={isVersionModalOpen}
          diagramId={activeDiagramId}
          currentVersion={diagramVersion}
          onClose={() => setIsVersionModalOpen(false)}
          onVersionRestored={(restored) => {
            setDiagramTitle(restored.title);
            setDiagramVersion(restored.version);
            const g = restored.graphData || { nodes: [], edges: [] };
            setNodes(g.nodes || []);
            setEdges(g.edges || []);
            pushHistory(g.nodes || [], g.edges || []);
            showToast(`Restored diagram version v${restored.version}.`, 'success');
          }}
        />

        <BfovShareModal
          isOpen={isShareModalOpen}
          diagramId={activeDiagramId}
          onClose={() => setIsShareModalOpen(false)}
        />
      </div>
    );
  }

  // Render Gallery / Manager Mode
  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Hidden JSON file input */}
      <input
        type="file"
        ref={jsonFileInputRef}
        onChange={handleJsonFileSelected}
        accept=".json,application/json"
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Workflow className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl font-bold text-slate-100">BFOV Charts & Diagramming Studio</h1>
            <span className="text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-mono">
              v2.0 Advanced + AI
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Visual architecture modeling, Mermaid import, AI text-to-diagram generation, and multi-format exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mermaid Quick Import */}
          <button
            type="button"
            onClick={() => setIsMermaidModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-sm transition-all"
          >
            <FileCode className="w-4 h-4 text-sky-400" />
            <span>Import Mermaid</span>
          </button>

          {/* AI Generator */}
          <button
            type="button"
            onClick={() => { setAiModalMode('generate'); setIsAiModalOpen(true); }}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 rounded-lg shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Copilot</span>
          </button>

          {/* Import JSON */}
          <button
            type="button"
            onClick={() => jsonFileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Import JSON</span>
          </button>

          {/* From Template */}
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-sky-400 bg-sky-950/60 hover:bg-sky-900 border border-sky-500/40 rounded-lg shadow-sm transition-all"
          >
            <Boxes className="w-4 h-4" />
            <span>Templates</span>
          </button>

          {/* New Diagram */}
          <button
            type="button"
            onClick={handleCreateBlank}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Canvas</span>
          </button>
        </div>
      </div>

      {/* Telemetry KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Total Diagrams</span>
          <span className="text-2xl font-bold text-slate-100">{telemetry?.totalDiagrams || diagrams.length}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Flowcharts</span>
          <span className="text-2xl font-bold text-emerald-400">{telemetry?.distribution?.FLOWCHART || 0}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">UML & Sequence</span>
          <span className="text-2xl font-bold text-sky-400">{(telemetry?.distribution?.UML || 0) + (telemetry?.distribution?.SEQUENCE || 0)}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Relational ERDs</span>
          <span className="text-2xl font-bold text-fuchsia-400">{telemetry?.distribution?.ERD || 0}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Blueprints</span>
          <span className="text-2xl font-bold text-amber-400">{telemetry?.templatesAvailable || templates.length}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search diagrams by title or tag..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-sky-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:border-sky-500 outline-none"
          >
            <option value="ALL">All Diagram Types</option>
            <option value="FLOWCHART">Flowchart</option>
            <option value="UML">UML</option>
            <option value="SEQUENCE">Sequence</option>
            <option value="ERD">ERD</option>
            <option value="NETWORK">Network</option>
            <option value="ARCHITECTURE">Architecture</option>
          </select>

          <button
            type="button"
            onClick={loadGalleryData}
            title="Refresh list"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Diagram Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Loading diagrams and blueprints...
        </div>
      ) : diagrams.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl space-y-3">
          <Workflow className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No Diagrams Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by creating a blank diagram canvas, importing Mermaid code, using AI Copilot, or selecting standard blueprints.
          </p>
          <div className="flex justify-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-sky-400 bg-sky-950 border border-sky-500/40 rounded-lg"
            >
              Choose Template
            </button>
            <button
              type="button"
              onClick={handleCreateBlank}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg"
            >
              New Blank Canvas
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diagrams.map((d) => (
            <div
              key={d.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                      d.diagramType === 'FLOWCHART'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : d.diagramType === 'UML'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        : d.diagramType === 'ERD'
                        ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30'
                        : d.diagramType === 'SEQUENCE'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {d.diagramType}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">v{d.version || 1}</span>
                </div>

                <h3 className="text-sm font-semibold text-slate-200 group-hover:text-sky-400 transition-colors line-clamp-1">
                  {d.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 h-8">
                  {d.description || 'No description provided.'}
                </p>

                <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800/80">
                  <span>{d.nodeCount || 0} Nodes</span>
                  <span>•</span>
                  <span>{d.edgeCount || 0} Connectors</span>
                  <span>•</span>
                  <span>{d.category || 'General'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500">
                  {new Date(d.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicate(d.id, d.title)}
                    title="Duplicate diagram"
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDiagram(d.id)}
                    title="Delete diagram"
                    className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDiagram(d.id)}
                    className="flex items-center space-x-1 px-3 py-1 bg-sky-600/80 hover:bg-sky-500 text-white text-xs font-medium rounded transition-colors ml-1"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Chooser Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <Boxes className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-semibold text-slate-100">Select Diagram Blueprint Template</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {templates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleCreateFromTemplate(t.templateKey)}
                  className="p-4 rounded-xl border border-slate-800 hover:border-sky-500 bg-slate-950/60 hover:bg-slate-800/40 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {t.category}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-sky-400 transition-colors">
                    {t.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {t.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Mode AI & Mermaid Modals */}
      <BfovMermaidModal
        isOpen={isMermaidModalOpen}
        onClose={() => setIsMermaidModalOpen(false)}
        onImportToCanvas={async (importedGraph, type) => {
          try {
            const res = await bfovService.createDiagram({
              title: `Imported Mermaid (${type || 'Flowchart'})`,
              diagramType: type || 'FLOWCHART',
              category: 'Architecture',
              graphData: importedGraph
            });
            if (res?.diagram) {
              showToast('Created diagram from Mermaid import.', 'success');
              handleOpenDiagram(res.diagram.id);
            }
          } catch (e) {
            showToast('Failed to create diagram: ' + e.message, 'error');
          }
        }}
      />

      <BfovAiModal
        isOpen={isAiModalOpen}
        mode={aiModalMode}
        onClose={() => setIsAiModalOpen(false)}
        onApplyGraph={async (newGraph, type) => {
          try {
            const res = await bfovService.createDiagram({
              title: `AI Synthesized (${type || 'Flowchart'})`,
              diagramType: type || 'FLOWCHART',
              category: 'Architecture',
              graphData: newGraph
            });
            if (res?.diagram) {
              showToast('Created diagram from AI Copilot.', 'success');
              handleOpenDiagram(res.diagram.id);
            }
          } catch (e) {
            showToast('Failed to create diagram: ' + e.message, 'error');
          }
        }}
      />
    </div>
  );
};
