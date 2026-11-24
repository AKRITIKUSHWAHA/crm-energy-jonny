import React, { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Renders SVG geometric shape based on type
 */
const renderShapeGeometry = (type, width, height, style) => {
  const w = width;
  const h = height;
  const fill = style.fill || '#ffffff';
  const stroke = style.stroke || '#475569';
  const strokeWidth = style.strokeWidth || 2;
  const strokeDasharray = style.strokeDasharray || undefined;
  const opacity = style.opacity !== undefined ? style.opacity : 1;

  switch (type) {
    case 'circle': {
      const r = Math.min(w, h) / 2;
      return <circle cx={w / 2} cy={h / 2} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} opacity={opacity} />;
    }
    case 'ellipse':
      return <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} opacity={opacity} />;
    case 'diamond':
    case 'decision': {
      const points = `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`;
      return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} opacity={opacity} />;
    }
    case 'triangle': {
      const points = `${w / 2},0 ${w},${h} 0,${h}`;
      return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} opacity={opacity} />;
    }
    case 'terminator':
      return <rect x={0} y={0} width={w} height={h} rx={h / 2} ry={h / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} opacity={opacity} />;
    case 'rounded_rectangle':
      return <rect x={0} y={0} width={w} height={h} rx={12} ry={12} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} opacity={opacity} />;
    case 'input_output': {
      const skew = Math.min(24, w * 0.15);
      const points = `${skew},0 ${w},0 ${w - skew},${h} 0,${h}`;
      return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} opacity={opacity} />;
    }
    case 'document': {
      const d = `M 0 0 L ${w} 0 L ${w} ${h - 14} Q ${w * 0.75} ${h - 24} ${w * 0.5} ${h - 10} T 0 ${h - 10} Z`;
      return <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} opacity={opacity} />;
    }
    case 'database': {
      const ry = 10;
      const d = `M 0 ${ry} A ${w / 2} ${ry} 0 0 1 ${w} ${ry} L ${w} ${h - ry} A ${w / 2} ${ry} 0 0 1 0 ${h - ry} Z`;
      return (
        <g opacity={opacity}>
          <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          <ellipse cx={w / 2} cy={ry} rx={w / 2} ry={ry} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </g>
      );
    }
    case 'cloud': {
      return (
        <g opacity={opacity}>
          <rect x={0} y={0} width={w} height={h} rx={20} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          <path d={`M 15 ${h * 0.7} A 18 18 0 0 1 ${w * 0.35} ${h * 0.3} A 22 22 0 0 1 ${w * 0.7} ${h * 0.3} A 18 18 0 0 1 ${w - 15} ${h * 0.7} Z`} fill="none" stroke={stroke} strokeWidth={1} strokeOpacity={0.4} />
        </g>
      );
    }
    case 'server':
    case 'network_node':
    case 'firewall': {
      return (
        <g opacity={opacity}>
          <rect x={0} y={0} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          <line x1={0} y1={h * 0.35} x2={w} y2={h * 0.35} stroke={stroke} strokeWidth={1} strokeOpacity={0.4} />
          <circle cx={14} cy={h * 0.18} r={3} fill={type === 'firewall' ? '#ef4444' : '#10b981'} />
          <circle cx={24} cy={h * 0.18} r={3} fill="#64748b" />
        </g>
      );
    }
    case 'uml_class':
    case 'entity': {
      return (
        <g opacity={opacity}>
          <rect x={0} y={0} width={w} height={h} rx={4} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          <rect x={0} y={0} width={w} height={28} rx={4} fill={stroke} fillOpacity={0.12} />
          <line x1={0} y1={28} x2={w} y2={28} stroke={stroke} strokeWidth={strokeWidth} />
        </g>
      );
    }
    case 'text':
      return <rect x={0} y={0} width={w} height={h} fill="transparent" stroke="transparent" />;
    case 'rectangle':
    case 'process':
    default:
      return <rect x={0} y={0} width={w} height={h} rx={4} ry={4} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} opacity={opacity} />;
  }
};

export const BfovCanvas = ({
  nodes = [],
  edges = [],
  selectedNodeIds = [],
  selectedEdgeId = null,
  activeTool = 'select',
  viewport = { x: 0, y: 0, zoom: 1 },
  gridSettings = { showGrid: true, snapToGrid: true, gridSize: 10 },
  onSelectNode,
  onSelectEdge,
  onMoveNode,
  onResizeNode,
  onCreateEdge,
  onUpdateViewport,
  onDropShape
}) => {
  const containerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resizing state
  const [resizingNode, setResizingNode] = useState(null); // { id, handle, startX, startY, startW, startH, nodeX, nodeY }

  // Connector drawing state
  const [connecting, setConnecting] = useState(null); // { sourceNodeId, sourceHandle, currentPoint: { x, y } }

  // Quick lookup map of nodes
  const nodeMap = React.useMemo(() => {
    const map = {};
    for (const n of nodes) {
      map[n.id] = n;
    }
    return map;
  }, [nodes]);

  // Transform screen coordinates to canvas world coordinates
  const screenToWorld = useCallback((clientX, clientY) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (clientY - rect.top - viewport.y) / viewport.zoom;
    return { x, y };
  }, [viewport]);

  // Compute node handle coordinate
  const getNodeHandleCoord = (node, handleId = 'center') => {
    if (!node) return { x: 0, y: 0 };
    const x = Number(node.x) || 0;
    const y = Number(node.y) || 0;
    const w = Number(node.width) || 120;
    const h = Number(node.height) || 60;

    switch (handleId) {
      case 'top':
        return { x: x + w / 2, y };
      case 'bottom':
        return { x: x + w / 2, y: y + h };
      case 'left':
        return { x, y: y + h / 2 };
      case 'right':
        return { x: x + w, y: y + h / 2 };
      default:
        return { x: x + w / 2, y: y + h / 2 };
    }
  };

  // Compute edge SVG path string
  const computeEdgePath = (edge) => {
    const sNode = nodeMap[edge.source];
    const tNode = nodeMap[edge.target];
    if (!sNode || !tNode) return '';

    const p1 = getNodeHandleCoord(sNode, edge.sourceHandle || 'right');
    const p2 = getNodeHandleCoord(tNode, edge.targetHandle || 'left');

    const edgeType = edge.type || 'straight';

    if (edgeType === 'elbow' || edgeType === 'orthogonal') {
      const midX = (p1.x + p2.x) / 2;
      return `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
    } else if (edgeType === 'curved' || edgeType === 'bezier') {
      const dx = Math.abs(p2.x - p1.x) * 0.5;
      return `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
    } else {
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }
  };

  // Mouse Down on Canvas (Pan start or deselect)
  const handleCanvasMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.classList.contains('canvas-background')) {
      if (e.button === 0) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
        onSelectNode && onSelectNode(null);
        onSelectEdge && onSelectEdge(null);
      }
    }
  };

  // Mouse Move
  const handleMouseMove = (e) => {
    if (isPanning) {
      onUpdateViewport && onUpdateViewport({
        ...viewport,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (resizingNode) {
      const world = screenToWorld(e.clientX, e.clientY);
      const dx = world.x - resizingNode.startX;
      const dy = world.y - resizingNode.startY;

      let newW = resizingNode.startW;
      let newH = resizingNode.startH;
      let newX = resizingNode.nodeX;
      let newY = resizingNode.nodeY;

      if (resizingNode.handle.includes('e')) newW = Math.max(30, resizingNode.startW + dx);
      if (resizingNode.handle.includes('s')) newH = Math.max(30, resizingNode.startH + dy);
      if (resizingNode.handle.includes('w')) {
        const potentialW = resizingNode.startW - dx;
        if (potentialW >= 30) {
          newW = potentialW;
          newX = resizingNode.nodeX + dx;
        }
      }
      if (resizingNode.handle.includes('n')) {
        const potentialH = resizingNode.startH - dy;
        if (potentialH >= 30) {
          newH = potentialH;
          newY = resizingNode.nodeY + dy;
        }
      }

      if (gridSettings.snapToGrid) {
        newW = Math.round(newW / gridSettings.gridSize) * gridSettings.gridSize;
        newH = Math.round(newH / gridSettings.gridSize) * gridSettings.gridSize;
        newX = Math.round(newX / gridSettings.gridSize) * gridSettings.gridSize;
        newY = Math.round(newY / gridSettings.gridSize) * gridSettings.gridSize;
      }

      onResizeNode && onResizeNode(resizingNode.id, newX, newY, newW, newH);
      return;
    }

    if (draggingNodeId) {
      const world = screenToWorld(e.clientX, e.clientY);
      let nextX = world.x - dragOffset.x;
      let nextY = world.y - dragOffset.y;

      if (gridSettings.snapToGrid) {
        nextX = Math.round(nextX / gridSettings.gridSize) * gridSettings.gridSize;
        nextY = Math.round(nextY / gridSettings.gridSize) * gridSettings.gridSize;
      }

      onMoveNode && onMoveNode(draggingNodeId, nextX, nextY);
      return;
    }

    if (connecting) {
      const world = screenToWorld(e.clientX, e.clientY);
      setConnecting((prev) => (prev ? { ...prev, currentPoint: world } : null));
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setResizingNode(null);
    setConnecting(null);
  };

  // Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(3, Math.max(0.25, viewport.zoom * zoomFactor));

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
    const newY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);

    onUpdateViewport && onUpdateViewport({ x: newX, y: newY, zoom: newZoom });
  };

  // Drag over handler for HTML5 drag-drop stencil
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const shapeType = e.dataTransfer.getData('application/bfov-shape');
    if (!shapeType) return;

    const world = screenToWorld(e.clientX, e.clientY);
    let x = world.x;
    let y = world.y;

    if (gridSettings.snapToGrid) {
      x = Math.round(x / gridSettings.gridSize) * gridSettings.gridSize;
      y = Math.round(y / gridSettings.gridSize) * gridSettings.gridSize;
    }

    onDropShape && onDropShape(shapeType, x, y);
  };

  // Port click to start connecting
  const handlePortMouseDown = (e, nodeId, handleId) => {
    e.stopPropagation();
    const node = nodeMap[nodeId];
    const pt = getNodeHandleCoord(node, handleId);
    setConnecting({
      sourceNodeId: nodeId,
      sourceHandle: handleId,
      currentPoint: pt
    });
  };

  const handlePortMouseUp = (e, targetNodeId, targetHandle) => {
    e.stopPropagation();
    if (connecting && connecting.sourceNodeId !== targetNodeId) {
      onCreateEdge && onCreateEdge({
        source: connecting.sourceNodeId,
        sourceHandle: connecting.sourceHandle,
        target: targetNodeId,
        targetHandle,
        type: 'straight'
      });
    }
    setConnecting(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-slate-900 select-none cursor-default"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <svg
        className="w-full h-full"
        style={{
          cursor: isPanning ? 'grabbing' : activeTool === 'connect' ? 'crosshair' : 'default'
        }}
      >
        <defs>
          {/* Arrowhead marker for edges */}
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
          </marker>
          <marker id="arrow-selected" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#3b82f6" />
          </marker>

          {/* Grid pattern */}
          {gridSettings.showGrid && (
            <pattern
              id="canvas-grid"
              width={gridSettings.gridSize * viewport.zoom}
              height={gridSettings.gridSize * viewport.zoom}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={(gridSettings.gridSize * viewport.zoom) / 2}
                cy={(gridSettings.gridSize * viewport.zoom) / 2}
                r={1}
                fill="#334155"
              />
            </pattern>
          )}
        </defs>

        {/* Background rect for grid and click handling */}
        <rect
          className="canvas-background"
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill={gridSettings.showGrid ? 'url(#canvas-grid)' : '#0f172a'}
        />

        {/* World container affected by Pan and Zoom */}
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* Render Edges */}
          {edges.map((edge) => {
            const pathData = computeEdgePath(edge);
            const isSelected = selectedEdgeId === edge.id;
            const stroke = isSelected ? '#3b82f6' : edge.style?.stroke || '#64748b';
            const strokeWidth = (edge.style?.strokeWidth || 2) * (isSelected ? 1.5 : 1);

            return (
              <g key={edge.id} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onSelectEdge && onSelectEdge(edge.id); }}>
                {/* Invisible wide stroke for easier clicking */}
                <path d={pathData} fill="none" stroke="transparent" strokeWidth={14} />
                <path
                  d={pathData}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={edge.style?.strokeDasharray || undefined}
                  markerEnd={isSelected ? 'url(#arrow-selected)' : 'url(#arrow)'}
                />
                {edge.label && (
                  <text
                    x={pathData ? (nodeMap[edge.source]?.x + nodeMap[edge.target]?.x) / 2 : 0}
                    y={pathData ? (nodeMap[edge.source]?.y + nodeMap[edge.target]?.y) / 2 - 8 : 0}
                    fill={edge.style?.labelColor || '#94a3b8'}
                    fontSize={11}
                    fontWeight="500"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Render Active Connecting Line */}
          {connecting && (
            <line
              x1={connecting.currentPoint.x}
              y1={connecting.currentPoint.y}
              x2={screenToWorld(panStart.x, panStart.y).x}
              y2={screenToWorld(panStart.x, panStart.y).y}
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNodeIds.includes(node.id);
            const w = node.width || 120;
            const h = node.height || 60;
            const style = node.style || {};

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y}) rotate(${node.rotation || 0}, ${w / 2}, ${h / 2})`}
                className="cursor-move"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onSelectNode && onSelectNode(node.id, e.shiftKey);
                  const world = screenToWorld(e.clientX, e.clientY);
                  setDraggingNodeId(node.id);
                  setDragOffset({ x: world.x - node.x, y: world.y - node.y });
                }}
              >
                {/* Geometry */}
                {renderShapeGeometry(node.type, w, h, style)}

                {/* Node Label */}
                {node.label && (
                  <text
                    x={w / 2}
                    y={node.type === 'uml_class' || node.type === 'entity' ? 18 : h / 2 + 5}
                    fill={style.textColor || '#0f172a'}
                    fontSize={style.fontSize || 13}
                    fontWeight={style.fontWeight || '500'}
                    textAnchor={style.textAlign || 'middle'}
                    className="select-none pointer-events-none"
                  >
                    {node.label.split('\n')[0]}
                  </text>
                )}

                {/* Multi-line attributes for UML/ERD */}
                {node.label && node.label.includes('\n') && (
                  <g className="select-none pointer-events-none">
                    {node.label.split('\n').slice(1).map((line, idx) => (
                      <text
                        key={idx}
                        x={10}
                        y={36 + idx * 14}
                        fill={style.textColor || '#334155'}
                        fontSize={10}
                        fontFamily="monospace"
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                )}

                {/* Connection Ports (Top, Bottom, Left, Right) */}
                {['top', 'bottom', 'left', 'right'].map((handle) => {
                  let px = w / 2;
                  let py = 0;
                  if (handle === 'bottom') py = h;
                  if (handle === 'left') { px = 0; py = h / 2; }
                  if (handle === 'right') { px = w; py = h / 2; }

                  return (
                    <circle
                      key={handle}
                      cx={px}
                      cy={py}
                      r={4}
                      className="fill-sky-400 stroke-slate-900 stroke-1 hover:r-6 cursor-crosshair transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
                      onMouseDown={(e) => handlePortMouseDown(e, node.id, handle)}
                      onMouseUp={(e) => handlePortMouseUp(e, node.id, handle)}
                    />
                  );
                })}

                {/* Selection Bounding Box & Resize Handles */}
                {isSelected && (
                  <g>
                    <rect
                      x={-3}
                      y={-3}
                      width={w + 6}
                      height={h + 6}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                    />
                    {/* 4 Corner Resize Handles */}
                    {['nw', 'ne', 'se', 'sw'].map((corner) => {
                      let cx = -3;
                      let cy = -3;
                      let cursor = 'nwse-resize';
                      if (corner === 'ne') { cx = w - 3; cursor = 'nesw-resize'; }
                      if (corner === 'se') { cx = w - 3; cy = h - 3; cursor = 'nwse-resize'; }
                      if (corner === 'sw') { cy = h - 3; cursor = 'nesw-resize'; }

                      return (
                        <rect
                          key={corner}
                          x={cx}
                          y={cy}
                          width={6}
                          height={6}
                          fill="#ffffff"
                          stroke="#0284c7"
                          strokeWidth={1.5}
                          style={{ cursor }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const world = screenToWorld(e.clientX, e.clientY);
                            setResizingNode({
                              id: node.id,
                              handle: corner,
                              startX: world.x,
                              startY: world.y,
                              startW: w,
                              startH: h,
                              nodeX: node.x,
                              nodeY: node.y
                            });
                          }}
                        />
                      );
                    })}
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

