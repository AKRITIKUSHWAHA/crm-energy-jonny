import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Compass,
  MapPin,
  Layers,
  Search,
  Plus,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Upload,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Check,
  X,
  Target,
  Users,
  Shield,
  Route,
  Activity,
  Globe,
  Radio,
  Share2,
  ArrowRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Input,
  Modal,
  Tabs
} from '../../../components/ui';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import gisService from '../../../services/gisService';

export const MaplyticsWorkspace = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  // Active Maplytics Tab: 'map' | 'sevenSearch' | 'drawing' | 'upload' | 'realignment' | 'arcgis' | 'audit'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('map');

  // Loading States
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Map Navigation & Projection State
  // Default centered around San Francisco Bay Metro
  const [viewport, setViewport] = useState({
    centerLat: 37.7749,
    centerLng: -122.4194,
    zoom: 11,
  });
  const [basemap, setBasemap] = useState('roadmap'); // 'roadmap' | 'satellite' | 'dark' | 'terrain'
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [drawnVertices, setDrawnVertices] = useState([]);
  const [drawnGeometryType, setDrawnGeometryType] = useState('Polygon'); // 'Polygon' | 'Point' | 'LineString'

  // GIS Data States
  const [layers, setLayers] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [features, setFeatures] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [realignments, setRealignments] = useState([]);
  const [arcgisConfig, setArcgisConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // Selected Feature / Territory Inspector
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedTerritory, setSelectedTerritory] = useState(null);

  // 7-Search Engine State
  const [searchMode, setSearchMode] = useState('PROXIMITY'); // FILE | PROXIMITY | REGION | DRAWING | TERRITORY | OVERLAY | ARCGIS
  const [searchParams, setSearchParams] = useState({
    radius: 25,
    unit: 'km',
    centerLat: 37.7749,
    centerLng: -122.4194,
    regionId: '',
    territoryId: '',
    fileId: '',
    featureType: '',
    arcgisUrl: 'https://services.arcgis.com/nErgy/arcgis/rest/services/PowerGrid/FeatureServer',
    arcgisWhere: "status = 'Operational'",
  });
  const [searchResults, setSearchResults] = useState(null);

  // Realignment State
  const [selectedRealignment, setSelectedRealignment] = useState(null);
  const [showRealignmentModal, setShowRealignmentModal] = useState(false);
  const [newProposalForm, setNewProposalForm] = useState({
    territoryId: '',
    proposalName: '',
    justification: '',
    proposedBoundaryStr: '',
  });

  // File Upload State
  const [fileToUpload, setFileToUpload] = useState(null);
  const [fileContentStr, setFileContentStr] = useState('');
  const [fileTypeChoice, setFileTypeChoice] = useState('GEOJSON');

  // ArcGIS Form State
  const [arcgisForm, setArcgisForm] = useState({
    serviceName: 'Enterprise ArcGIS Feature Server',
    serviceUrl: '',
    authType: 'API_KEY',
    apiKey: '',
  });

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------
  const loadWorkspaceData = useCallback(async () => {
    try {
      setLoading(true);
      const [tel, terrs, regs, feats, files, reals, arcgis, logs] = await Promise.all([
        gisService.getWorkspaceTelemetry(),
        gisService.getTerritories(),
        gisService.getRegions(),
        gisService.getFeatures(),
        gisService.getUploadedFiles(),
        gisService.getRealignments(),
        gisService.getArcgisConfig(),
        gisService.getAuditLogs(),
      ]);

      if (tel?.layers) setLayers(tel.layers);
      if (terrs) setTerritories(terrs);
      if (regs) setRegions(regs);
      if (feats) setFeatures(feats);
      if (files) setUploadedFiles(files);
      if (reals) setRealignments(reals);
      if (arcgis) {
        setArcgisConfig(arcgis);
        setArcgisForm({
          serviceName: arcgis.serviceName || 'Enterprise ArcGIS Feature Server',
          serviceUrl: arcgis.serviceUrl || '',
          authType: arcgis.authType || 'API_KEY',
          apiKey: '',
        });
      }
      if (logs) setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load GIS workspace telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // --------------------------------------------------------------------------
  // Map Projection Helpers (Mercator WGS-84 to 800x500 Viewport)
  // --------------------------------------------------------------------------
  const mapWidth = 800;
  const mapHeight = 500;

  // Converts geographic (lat, lng) to canvas pixels (x, y) based on current viewport
  const projectToPixels = useCallback(
    (lat, lng) => {
      // Zoom factor: at zoom 11, span ~0.35 deg lat/lng
      const span = 0.35 * Math.pow(2, 11 - viewport.zoom);
      const x = ((lng - (viewport.centerLng - span)) / (2 * span)) * mapWidth;
      const y = (((viewport.centerLat + span) - lat) / (2 * span)) * mapHeight;
      return { x, y };
    },
    [viewport]
  );

  // Converts canvas pixels (x, y) back to GPS coordinate (lat, lng)
  const unprojectFromPixels = useCallback(
    (x, y) => {
      const span = 0.35 * Math.pow(2, 11 - viewport.zoom);
      const lng = (x / mapWidth) * (2 * span) + (viewport.centerLng - span);
      const lat = (viewport.centerLat + span) - (y / mapHeight) * (2 * span);
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      };
    },
    [viewport]
  );

  // Generate SVG path for a polygon ring
  const getPolygonSvgPath = useCallback(
    (ring) => {
      if (!ring || ring.length < 3) return '';
      return ring
        .map((p, idx) => {
          const pt = projectToPixels(p[1], p[0]);
          return `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
        })
        .concat('Z')
        .join(' ');
    },
    [projectToPixels]
  );

  // --------------------------------------------------------------------------
  // Map Pan & Zoom Handlers
  // --------------------------------------------------------------------------
  const handleZoomIn = () => {
    setViewport((prev) => ({ ...prev, zoom: Math.min(18, prev.zoom + 1) }));
  };

  const handleZoomOut = () => {
    setViewport((prev) => ({ ...prev, zoom: Math.max(4, prev.zoom - 1) }));
  };

  const handleResetView = () => {
    setViewport({ centerLat: 37.7749, centerLng: -122.4194, zoom: 11 });
  };

  // Canvas Click for Drawing or Inspecting
  const handleCanvasClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const coord = unprojectFromPixels(x, y);

    if (isDrawingActive) {
      setDrawnVertices((prev) => [...prev, [coord.lng, coord.lat]]);
      addToast(`Point added: [${coord.lng}, ${coord.lat}]`, 'info');
    } else {
      // Set proximity center if in proximity mode
      if (searchMode === 'PROXIMITY') {
        setSearchParams((prev) => ({
          ...prev,
          centerLat: coord.lat,
          centerLng: coord.lng,
        }));
      }
    }
  };

  // --------------------------------------------------------------------------
  // 7-Search Execution
  // --------------------------------------------------------------------------
  const handleExecuteSearch = async () => {
    try {
      setSearching(true);
      let payloadParams = { ...searchParams };

      if (searchMode === 'DRAWING') {
        if (drawnVertices.length < 3) {
          addToast('Please draw at least 3 vertices on the map first.', 'warning');
          setSearching(false);
          return;
        }
        const closed = [...drawnVertices];
        if (closed[0][0] !== closed[closed.length - 1][0] || closed[0][1] !== closed[closed.length - 1][1]) {
          closed.push(closed[0]);
        }
        payloadParams.drawnGeometry = {
          type: 'Polygon',
          coordinates: [closed],
        };
      }

      const res = await gisService.executeSearch(searchMode, payloadParams);
      setSearchResults(res);
      addToast(`Search completed: ${res.totalResults} features found.`, 'success');

      // If proximity search, pan map to center
      if (searchMode === 'PROXIMITY' && payloadParams.centerLat) {
        setViewport((prev) => ({
          ...prev,
          centerLat: payloadParams.centerLat,
          centerLng: payloadParams.centerLng,
        }));
      }
    } catch (err) {
      addToast(err.message || 'Search execution failed.', 'error');
    } finally {
      setSearching(false);
    }
  };

  // --------------------------------------------------------------------------
  // Save Drawn Geometry as Feature or Territory
  // --------------------------------------------------------------------------
  const handleSaveDrawnPolygon = async () => {
    if (drawnVertices.length < 3) {
      addToast('A polygon requires at least 3 coordinates.', 'warning');
      return;
    }

    const closed = [...drawnVertices];
    if (closed[0][0] !== closed[closed.length - 1][0] || closed[0][1] !== closed[closed.length - 1][1]) {
      closed.push(closed[0]);
    }

    const name = window.prompt('Enter name for this custom spatial polygon:', 'Custom Drawn Area');
    if (!name) return;

    try {
      const feat = await gisService.createFeature({
        name,
        geometryType: 'POLYGON',
        featureType: 'DRAWN',
        coordinates: [closed],
      });
      setFeatures((prev) => [feat, ...prev]);
      setDrawnVertices([]);
      setIsDrawingActive(false);
      addToast(`Drawn polygon '${name}' saved as spatial feature.`, 'success');
    } catch (err) {
      addToast('Failed to save drawn polygon.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // File Upload Handling
  // --------------------------------------------------------------------------
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileToUpload(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setFileContentStr(evt.target.result);
    };
    reader.readAsText(file);
  };

  const handleUploadSubmit = async () => {
    if (!fileToUpload || !fileContentStr) {
      addToast('Please select a valid GeoJSON or KML file first.', 'warning');
      return;
    }

    try {
      setUploading(true);
      const res = await gisService.uploadGisFile(fileToUpload.name, fileContentStr, fileTypeChoice);
      addToast(`File '${res.filename}' imported with ${res.featureCount} features!`, 'success');
      setFileToUpload(null);
      setFileContentStr('');
      loadWorkspaceData();
    } catch (err) {
      addToast(err.message || 'GIS file upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Realignment Workflow Handlers
  // --------------------------------------------------------------------------
  const handleCreateProposal = async (e) => {
    e.preventDefault();
    if (!newProposalForm.territoryId || !newProposalForm.proposalName || !newProposalForm.proposedBoundaryStr) {
      addToast('Please fill all required realignment fields.', 'warning');
      return;
    }

    try {
      let parsedGeom;
      try {
        parsedGeom = JSON.parse(newProposalForm.proposedBoundaryStr);
      } catch (err) {
        addToast('Proposed boundary must be valid GeoJSON.', 'error');
        return;
      }

      const proposal = await gisService.createRealignment({
        territoryId: newProposalForm.territoryId,
        proposalName: newProposalForm.proposalName,
        proposedBoundary: parsedGeom,
        justification: newProposalForm.justification,
      });

      setRealignments((prev) => [proposal, ...prev]);
      setShowRealignmentModal(false);
      setNewProposalForm({ territoryId: '', proposalName: '', justification: '', proposedBoundaryStr: '' });
      addToast(`Proposal '${proposal.proposalName}' created in DRAFT state.`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to create proposal.', 'error');
    }
  };

  const handleSubmitProposal = async (id) => {
    try {
      const updated = await gisService.submitRealignment(id);
      setRealignments((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'SUBMITTED' } : r)));
      addToast('Proposal submitted for governance review.', 'success');
    } catch (err) {
      addToast('Failed to submit proposal.', 'error');
    }
  };

  const handleApproveProposal = async (id) => {
    try {
      const res = await gisService.approveRealignment(id);
      addToast('Realignment approved! Territory boundary updated in real-time.', 'success');
      loadWorkspaceData();
    } catch (err) {
      addToast('Failed to approve realignment.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // ArcGIS Connection Testing
  // --------------------------------------------------------------------------
  const handleSaveArcgis = async (e) => {
    e.preventDefault();
    try {
      const res = await gisService.saveArcgisConfig(arcgisForm);
      setArcgisConfig(res);
      addToast('ArcGIS configuration saved securely.', 'success');
    } catch (err) {
      addToast('Failed to save ArcGIS config.', 'error');
    }
  };

  const handleTestArcgis = async () => {
    try {
      const res = await gisService.testArcgisConnection(arcgisForm.serviceName);
      setArcgisConfig((prev) => ({ ...prev, status: res.status }));
      if (res.status === 'CONNECTED') {
        addToast(`ArcGIS connected successfully! (${res.layerCount} layers active)`, 'success');
      } else {
        addToast(`ArcGIS handshake error: ${res.error}`, 'error');
      }
    } catch (err) {
      addToast(err.message || 'ArcGIS test connection failed.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Active Layer Toggles
  // --------------------------------------------------------------------------
  const handleToggleLayer = async (layer) => {
    try {
      const updated = await gisService.updateLayer(layer.id, { isVisible: !layer.isVisible });
      setLayers((prev) => prev.map((l) => (l.id === layer.id ? { ...l, isVisible: updated.isVisible } : l)));
    } catch (err) {
      addToast('Failed to update layer visibility', 'error');
    }
  };

  const workspaceTabs = [
    { id: 'map', label: 'GIS Map Canvas', icon: Compass },
    { id: 'sevenSearch', label: '7-Search Engine', icon: Search },
    { id: 'drawing', label: 'Drawing & Geometry', icon: Edit2 },
    { id: 'upload', label: 'File Ingestion (GeoJSON/KML)', icon: Upload },
    { id: 'realignment', label: 'Territory Realignment', icon: Route },
    { id: 'arcgis', label: 'ArcGIS Integration', icon: Globe },
    { id: 'audit', label: 'Spatial Audit Logs', icon: Activity },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Maplytics GIS & Complete Territory Management
            </h2>
            <Badge variant="primary">Master Prompt 13</Badge>
            <Badge variant={arcgisConfig?.status === 'CONNECTED' ? 'success' : 'neutral'}>
              ArcGIS: {arcgisConfig?.status || 'DISCONNECTED'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise geographic spatial operations, 7-mode search engine, shapefile/GeoJSON ingestion, and territory realignment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadWorkspaceData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* 2. Top Sub-Navigation Tabs */}
      <Tabs
        tabs={workspaceTabs}
        activeTab={activeWorkspaceTab}
        onChange={setActiveWorkspaceTab}
      />

      {/* ==================================================================== */}
      {/* TAB 1: GIS MAP CANVAS (INTERACTIVE SPATIAL WORKSPACE) */}
      {/* ==================================================================== */}
      {activeWorkspaceTab === 'map' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Map Canvas Area */}
          <div className="flex-1 flex flex-col gap-3" style={{ minWidth: 0, width: '100%' }}>
            {/* Top Canvas Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 sm:p-2.5 bg-secondary/80 rounded-lg border border-border text-xs">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-muted-foreground mr-0.5">Basemap:</span>
                <div className="inline-flex flex-wrap items-center gap-1">
                  {['roadmap', 'satellite', 'dark', 'terrain'].map((b) => (
                    <button
                      key={b}
                      onClick={() => setBasemap(b)}
                      className={`px-2 sm:px-2.5 py-1 rounded capitalize font-medium text-[11px] sm:text-xs transition-colors ${
                        basemap === b
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-background hover:bg-secondary text-foreground'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50">
                <span className="font-mono text-muted-foreground text-[10px] sm:text-xs truncate max-w-[210px] sm:max-w-none">
                  Center: {viewport.centerLat.toFixed(3)}, {viewport.centerLng.toFixed(3)} | Zoom: {viewport.zoom}x
                </span>
                <div className="flex items-center gap-1 border-l border-border pl-2 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomIn} title="Zoom In">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomOut} title="Zoom Out">
                    <ZoomOut className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleResetView} title="Reset View">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Interactive SVG Canvas */}
            <div
              className={`maplytics-container relative w-full h-[340px] sm:h-[450px] lg:h-[520px] rounded-xl overflow-hidden border border-border select-none touch-manipulation ${
                basemap === 'satellite'
                  ? 'bg-slate-950'
                  : basemap === 'dark'
                  ? 'bg-neutral-900'
                  : 'bg-slate-900'
              }`}
              style={{
                position: 'relative',
                width: '100%',
                minHeight: '480px',
                height: '520px',
                backgroundColor:
                  basemap === 'satellite'
                    ? '#020617'
                    : basemap === 'dark'
                    ? '#0a0a0a'
                    : basemap === 'terrain'
                    ? '#13231b'
                    : '#0f172a',
              }}
              onClick={handleCanvasClick}
            >
              {/* Coordinate Grid Pattern */}
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <pattern id="gis-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gis-grid)" />

                {/* 1. Render Territory Boundaries */}
                {territories.map((terr) => {
                  let ring = [];
                  try {
                    const parsed = JSON.parse(terr.boundaryGeoJson);
                    ring = parsed.coordinates?.[0] || [];
                  } catch (e) {}
                  if (ring.length < 3) return null;

                  const path = getPolygonSvgPath(ring);
                  return (
                    <g key={terr.id}>
                      <path
                        d={path}
                        fill={terr.color || '#0ea5e9'}
                        fillOpacity="0.22"
                        stroke={terr.color || '#0ea5e9'}
                        strokeWidth="2.5"
                        className="cursor-pointer hover:fill-opacity-40 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTerritory(terr);
                        }}
                      />
                    </g>
                  );
                })}

                {/* 2. Render Proximity Circle if Search Results contain one */}
                {searchResults?.circleGeometry && (
                  <path
                    d={getPolygonSvgPath(searchResults.circleGeometry.coordinates[0])}
                    fill="#10b981"
                    fillOpacity="0.15"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                )}

                {/* 3. Render In-Progress Drawn Polygon */}
                {drawnVertices.length >= 2 && (
                  <path
                    d={getPolygonSvgPath(drawnVertices)}
                    fill="#ec4899"
                    fillOpacity="0.2"
                    stroke="#ec4899"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                  />
                )}

                {/* 4. Render Active Realignment Comparison Overlay if any */}
                {selectedRealignment && (
                  <>
                    {/* Current Boundary (Blue) */}
                    <path
                      d={getPolygonSvgPath(JSON.parse(selectedRealignment.currentBoundary).coordinates[0])}
                      fill="#3b82f6"
                      fillOpacity="0.2"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    {/* Proposed Boundary (Dashed Orange) */}
                    <path
                      d={getPolygonSvgPath(JSON.parse(selectedRealignment.proposedBoundary).coordinates[0])}
                      fill="#f97316"
                      fillOpacity="0.2"
                      stroke="#f97316"
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
                    />
                  </>
                )}
              </svg>

              {/* Waypoint Feature Pins (HTML Layer over SVG) */}
              {features.map((feat) => {
                if (feat.latitude === null || feat.longitude === null) return null;
                const pos = projectToPixels(feat.latitude, feat.longitude);
                // Check within canvas bounds
                if (pos.x < 0 || pos.x > mapWidth || pos.y < 0 || pos.y > mapHeight) return null;

                return (
                  <div
                    key={feat.id}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group z-10"
                    style={{ left: pos.x, top: pos.y }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFeature(feat);
                    }}
                  >
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/90 border border-primary text-white text-[11px] font-bold shadow-lg whitespace-nowrap">
                      <MapPin className="w-3 h-3 text-primary animate-pulse" />
                      <span>{feat.name}</span>
                    </div>
                  </div>
                );
              })}

              {/* Drawing Vertices Handles */}
              {drawnVertices.map((v, vIdx) => {
                const pos = projectToPixels(v[1], v[0]);
                return (
                  <div
                    key={vIdx}
                    className="absolute w-3 h-3 rounded-full bg-pink-500 border border-white transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                    style={{ left: pos.x, top: pos.y }}
                  />
                );
              })}

              {/* Drawing Toolbar Overlay */}
              <div
                className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-900/90 p-1.5 rounded-lg border border-border shadow-md z-30 max-w-[calc(100%-20px)]"
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  zIndex: 30,
                  backgroundColor: 'rgba(15, 23, 42, 0.92)',
                  maxWidth: 'calc(100% - 24px)',
                }}
              >
                <Button
                  variant={isDrawingActive ? 'primary' : 'outline'}
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={() => setIsDrawingActive(!isDrawingActive)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  {isDrawingActive ? 'Cancel Drawing' : 'Draw Polygon'}
                </Button>
                {isDrawingActive && drawnVertices.length >= 3 && (
                  <Button variant="success" size="sm" className="h-7 text-xs shrink-0" onClick={handleSaveDrawnPolygon}>
                    <Check className="w-3 h-3 mr-1" />
                    Save ({drawnVertices.length} pts)
                  </Button>
                )}
                {isDrawingActive && (
                  <span className="text-[10.5px] text-muted-foreground px-1 hidden sm:inline">
                    Click canvas to add vertices
                  </span>
                )}
              </div>

              {/* Bottom Scale Indicator */}
              <div
                className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 bg-slate-900/80 px-2 sm:px-2.5 py-1 rounded text-[10px] text-muted-foreground border border-border max-w-[calc(100%-20px)] truncate select-none pointer-events-none"
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  zIndex: 20,
                  backgroundColor: 'rgba(15, 23, 42, 0.88)',
                  color: '#94a3b8',
                  maxWidth: 'calc(100% - 24px)',
                }}
              >
                GIS Projection: WGS-84 / Web Mercator | Scale: ~10 km
              </div>
            </div>
          </div>

          {/* Right Inspector & Layers Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4" style={{ flexShrink: 0 }}>
            {/* 1. Layers Panel */}
            <Card>
              <CardHeader title="Map Layers & Overlays" subtitle="Toggle visibility and z-order" />
              <CardBody className="pt-0 flex flex-col gap-2">
                {layers.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                      <span className="font-medium text-foreground">{l.name}</span>
                    </div>
                    <button
                      onClick={() => handleToggleLayer(l)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {l.isVisible ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </CardBody>
            </Card>

            {/* 2. Feature / Territory Attributes Inspector */}
            {selectedTerritory ? (
              <Card className="border-primary/40 bg-primary/5">
                <CardHeader
                  title={selectedTerritory.name}
                  subtitle={`Code: ${selectedTerritory.code}`}
                />
                <CardBody className="pt-0 flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Surface Area:</span>
                    <span className="font-semibold">{selectedTerritory.areaSqKm} km²</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Target Quota:</span>
                    <span className="font-semibold">${selectedTerritory.targetQuota.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Assigned Manager:</span>
                    <span className="font-semibold">{selectedTerritory.assignedUser?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Centroid:</span>
                    <span className="font-mono text-[11px]">{selectedTerritory.centerLat}, {selectedTerritory.centerLng}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 h-7 text-xs"
                    onClick={() => setSelectedTerritory(null)}
                  >
                    Close Inspector
                  </Button>
                </CardBody>
              </Card>
            ) : selectedFeature ? (
              <Card className="border-emerald-500/40 bg-emerald-500/5">
                <CardHeader
                  title={selectedFeature.name}
                  subtitle={`Type: ${selectedFeature.featureType} (${selectedFeature.geometryType})`}
                />
                <CardBody className="pt-0 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-mono text-[11px]">{selectedFeature.latitude}, {selectedFeature.longitude}</span>
                  </div>
                  {selectedFeature.properties && (
                    <div className="bg-secondary/60 p-2 rounded border border-border/50 font-mono text-[11px]">
                      {JSON.stringify(selectedFeature.properties, null, 2)}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 h-7 text-xs"
                    onClick={() => setSelectedFeature(null)}
                  >
                    Close Inspector
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody className="py-8 text-center text-xs text-muted-foreground">
                  Click any territory boundary or waypoint on the canvas to inspect spatial attributes.
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: SEVEN SEARCH MODES CONSOLE */}
      {/* ==================================================================== */}
      {activeWorkspaceTab === 'sevenSearch' && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Maplytics 7-Mode Spatial Search Engine"
              subtitle="Execute high-precision geographic spatial queries across all seven canonical GIS search modes"
            />
            <CardBody className="pt-0 flex flex-col gap-6">
              {/* Search Mode Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
                {[
                  { id: 'FILE', label: '1. File Ingestion', icon: FileText },
                  { id: 'PROXIMITY', label: '2. Proximity & Radius', icon: Target },
                  { id: 'REGION', label: '3. Administrative Region', icon: Globe },
                  { id: 'DRAWING', label: '4. Custom Drawing', icon: Edit2 },
                  { id: 'TERRITORY', label: '5. Territory Boundary', icon: Route },
                  { id: 'OVERLAY', label: '6. Layer Overlay', icon: Layers },
                  { id: 'ARCGIS', label: '7. ArcGIS Feature Service', icon: Activity },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSearchMode(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                      searchMode === m.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <m.icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Inputs per Mode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {searchMode === 'PROXIMITY' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                        Center Latitude
                      </label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={searchParams.centerLat}
                        onChange={(e) => setSearchParams((p) => ({ ...p, centerLat: parseFloat(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                        Center Longitude
                      </label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={searchParams.centerLng}
                        onChange={(e) => setSearchParams((p) => ({ ...p, centerLng: parseFloat(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                        Search Radius ({searchParams.unit})
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={searchParams.radius}
                          onChange={(e) => setSearchParams((p) => ({ ...p, radius: parseFloat(e.target.value) }))}
                        />
                        <select
                          className="bg-background border border-border rounded px-2 text-xs"
                          value={searchParams.unit}
                          onChange={(e) => setSearchParams((p) => ({ ...p, unit: e.target.value }))}
                        >
                          <option value="km">km</option>
                          <option value="miles">miles</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {searchMode === 'REGION' && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                      Target Administrative Region
                    </label>
                    <select
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                      value={searchParams.regionId}
                      onChange={(e) => setSearchParams((p) => ({ ...p, regionId: e.target.value }))}
                    >
                      <option value="">All Regions</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {searchMode === 'TERRITORY' && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                      Sales / Research Territory
                    </label>
                    <select
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                      value={searchParams.territoryId}
                      onChange={(e) => setSearchParams((p) => ({ ...p, territoryId: e.target.value }))}
                    >
                      <option value="">Select Territory</option>
                      {territories.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {searchMode === 'FILE' && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                      Uploaded GIS File Source
                    </label>
                    <select
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                      value={searchParams.fileId}
                      onChange={(e) => setSearchParams((p) => ({ ...p, fileId: e.target.value }))}
                    >
                      <option value="">All Uploaded Files</option>
                      {uploadedFiles.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.filename} ({f.featureCount} features)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {searchMode === 'DRAWING' && (
                  <div className="col-span-1 md:col-span-3 text-xs text-muted-foreground p-3 bg-secondary/50 rounded-lg border border-border">
                    <p className="font-semibold text-foreground mb-1">Custom Drawn Polygon Search:</p>
                    Uses mathematical ray-casting containment to find all accounts located within your drawn map boundary ({drawnVertices.length} vertices currently drawn on canvas).
                  </div>
                )}

                {searchMode === 'ARCGIS' && (
                  <>
                    <div className="col-span-1 md:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                        ArcGIS FeatureServer URL
                      </label>
                      <Input
                        value={searchParams.arcgisUrl}
                        onChange={(e) => setSearchParams((p) => ({ ...p, arcgisUrl: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                        SQL Where Filter
                      </label>
                      <Input
                        value={searchParams.arcgisWhere}
                        onChange={(e) => setSearchParams((p) => ({ ...p, arcgisWhere: e.target.value }))}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <Button variant="primary" onClick={handleExecuteSearch} disabled={searching}>
                  <Search className={`w-4 h-4 mr-1.5 ${searching ? 'animate-spin' : ''}`} />
                  {searching ? 'Executing Spatial Query...' : 'Execute Search'}
                </Button>
              </div>

              {/* Search Results Display */}
              {searchResults && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="text-sm font-bold text-foreground">
                      Search Results: {searchResults.totalResults} features found
                    </h3>
                    <Badge variant="primary">{searchResults.searchMode}</Badge>
                  </div>

                  <div className="overflow-x-auto border border-border rounded-lg" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full min-w-[650px] text-xs text-left border-collapse">
                      <thead className="bg-secondary/70 border-b border-border">
                        <tr>
                          <th className="py-2.5 px-3">Feature Name</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Latitude</th>
                          <th className="py-2.5 px-3">Longitude</th>
                          {searchMode === 'PROXIMITY' && <th className="py-2.5 px-3">Distance</th>}
                          <th className="py-2.5 px-3">Attributes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.results?.map((r) => (
                          <tr key={r.id} className="border-b border-border/40 hover:bg-secondary/40">
                            <td className="py-2.5 px-3 font-semibold text-foreground">{r.name}</td>
                            <td className="py-2.5 px-3">
                              <Badge variant="neutral">{r.featureType || r.geometryType}</Badge>
                            </td>
                            <td className="py-2.5 px-3 font-mono">{r.latitude}</td>
                            <td className="py-2.5 px-3 font-mono">{r.longitude}</td>
                            {searchMode === 'PROXIMITY' && (
                              <td className="py-2.5 px-3 font-semibold text-emerald-500">
                                {r.distance} {r.distanceUnit}
                              </td>
                            )}
                            <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                              {JSON.stringify(r.properties || {})}
                            </td>
                          </tr>
                        ))}
                        {(!searchResults.results || searchResults.results.length === 0) && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-muted-foreground">
                              No features matched the spatial search criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: FILE INGESTION (GEOJSON / KML) */}
      {/* ==================================================================== */}
      {activeWorkspaceTab === 'upload' && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Geographic File Ingestion & Parser"
              subtitle="Upload GeoJSON (.geojson, .json) or KML (.kml) files to parse features into the map layers"
            />
            <CardBody className="pt-0 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-center p-6 border-2 border-dashed border-border rounded-xl bg-secondary/30 text-center">
                <input
                  type="file"
                  accept=".geojson,.json,.kml"
                  onChange={handleFileSelect}
                  className="text-sm"
                />
                <select
                  className="bg-background border border-border rounded px-3 py-1.5 text-xs"
                  value={fileTypeChoice}
                  onChange={(e) => setFileTypeChoice(e.target.value)}
                >
                  <option value="GEOJSON">GeoJSON (.geojson, .json)</option>
                  <option value="KML">KML (.kml)</option>
                </select>
                <Button variant="primary" size="sm" onClick={handleUploadSubmit} disabled={uploading}>
                  <Upload className={`w-4 h-4 mr-1.5 ${uploading ? 'animate-spin' : ''}`} />
                  {uploading ? 'Parsing...' : 'Upload & Ingest'}
                </Button>
              </div>

              {/* Uploaded Files Table */}
              <div className="mt-4">
                <h3 className="text-sm font-bold mb-2">Ingested Files History ({uploadedFiles.length})</h3>
                <div className="overflow-x-auto border border-border rounded-lg" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="w-full min-w-[600px] text-xs text-left border-collapse">
                    <thead className="bg-secondary/70 border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3">Filename</th>
                        <th className="py-2.5 px-3">Format</th>
                        <th className="py-2.5 px-3">Features Count</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Uploaded At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedFiles.map((f) => (
                        <tr key={f.id} className="border-b border-border/40">
                          <td className="py-2.5 px-3 font-semibold text-foreground">{f.filename}</td>
                          <td className="py-2.5 px-3"><Badge variant="info">{f.fileType}</Badge></td>
                          <td className="py-2.5 px-3">{f.featureCount} features</td>
                          <td className="py-2.5 px-3 font-mono">{(f.fileSizeBytes / 1024).toFixed(1)} KB</td>
                          <td className="py-2.5 px-3"><Badge variant="success">{f.status}</Badge></td>
                          <td className="py-2.5 px-3 text-muted-foreground">{new Date(f.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: TERRITORY REALIGNMENT WORKFLOW */}
      {/* ==================================================================== */}
      {activeWorkspaceTab === 'realignment' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Territory Boundary Realignment & Staging</h2>
              <p className="text-xs text-muted-foreground">
                Propose and evaluate territory adjustments with delta calculations before applying to live boundaries
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowRealignmentModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Propose Realignment
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {realignments.map((r) => (
              <Card key={r.id} className="border-border">
                <CardHeader
                  title={
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{r.proposalName}</span>
                      <Badge variant={r.status === 'APPROVED' ? 'success' : r.status === 'SUBMITTED' ? 'warning' : 'neutral'}>
                        {r.status}
                      </Badge>
                    </div>
                  }
                  subtitle={`Target: ${r.territory?.name || 'Territory'}`}
                />
                <CardBody className="pt-0 flex flex-col gap-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-secondary/50 p-3 rounded-lg border border-border">
                    <div>
                      <span className="text-muted-foreground">Current Area:</span>
                      <div className="font-semibold">{r.currentAreaSqKm} km²</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Proposed Area:</span>
                      <div className="font-semibold text-primary">{r.proposedAreaSqKm} km²</div>
                    </div>
                  </div>

                  <p className="text-muted-foreground">{r.justification || 'No justification entered.'}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedRealignment(r);
                        setActiveWorkspaceTab('map');
                        addToast('Loaded proposed boundary comparison onto Map Canvas (Blue vs Orange)', 'info');
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Visual Diff
                    </Button>

                    <div className="flex items-center gap-2">
                      {r.status === 'DRAFT' && (
                        <Button variant="primary" size="sm" className="h-7 text-xs" onClick={() => handleSubmitProposal(r.id)}>
                          Submit
                        </Button>
                      )}
                      {r.status === 'SUBMITTED' && (
                        <Button variant="success" size="sm" className="h-7 text-xs" onClick={() => handleApproveProposal(r.id)}>
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: ARCGIS INTEGRATION CONFIGURATION */}
      {/* ==================================================================== */}
      {activeWorkspaceTab === 'arcgis' && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="ArcGIS Feature Service & WebMap Integration"
              subtitle="Connect to enterprise ArcGIS REST feature servers to ingest spatial boundaries"
            />
            <CardBody className="pt-0 flex flex-col gap-4">
              <form onSubmit={handleSaveArcgis} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Service Name
                  </label>
                  <Input
                    value={arcgisForm.serviceName}
                    onChange={(e) => setArcgisForm((p) => ({ ...p, serviceName: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    ArcGIS Feature Server URL
                  </label>
                  <Input
                    value={arcgisForm.serviceUrl}
                    placeholder="https://services.arcgis.com/.../FeatureServer"
                    onChange={(e) => setArcgisForm((p) => ({ ...p, serviceUrl: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Authentication API Key / Token (Masked)
                  </label>
                  <Input
                    type="password"
                    value={arcgisForm.apiKey}
                    placeholder={arcgisConfig?.apiKeyMasked || 'Enter API Key'}
                    onChange={(e) => setArcgisForm((p) => ({ ...p, apiKey: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={handleTestArcgis}>
                    <Activity className="w-4 h-4 mr-1.5" />
                    Test Connection
                  </Button>
                  <Button type="submit" variant="primary">
                    Save Configuration
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: SPATIAL AUDIT LOGS */}
      {/* ==================================================================== */}
      {activeWorkspaceTab === 'audit' && (
        <Card>
          <CardHeader title="Geographic Spatial Audit Logs" subtitle="Audit records for all territory changes and realignments" />
          <CardBody className="pt-0 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[620px] text-xs text-left border-collapse">
              <thead className="bg-secondary/70 border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border/40">
                    <td className="py-2 px-3 font-semibold text-primary">{log.action}</td>
                    <td className="py-2 px-3"><Badge variant="neutral">{log.entityType}</Badge></td>
                    <td className="py-2 px-3">{log.user?.name || 'System'}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">
                      {JSON.stringify(log.details || {})}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {/* MODAL: PROPOSE REALIGNMENT */}
      {showRealignmentModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowRealignmentModal(false)}
          title="Propose Territory Boundary Realignment"
        >
          <form onSubmit={handleCreateProposal} className="flex flex-col gap-4 p-4 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground mb-1 block">Target Territory</label>
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                value={newProposalForm.territoryId}
                onChange={(e) => setNewProposalForm((p) => ({ ...p, territoryId: e.target.value }))}
              >
                <option value="">Select Territory</option>
                {territories.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-muted-foreground mb-1 block">Proposal Name</label>
              <Input
                value={newProposalForm.proposalName}
                placeholder="e.g. Q4 Territory Rebalance"
                onChange={(e) => setNewProposalForm((p) => ({ ...p, proposalName: e.target.value }))}
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground mb-1 block">Proposed Boundary (GeoJSON Polygon)</label>
              <textarea
                className="w-full bg-background border border-border rounded-md p-2 font-mono text-[11px] h-28"
                placeholder='{"type":"Polygon","coordinates":[[[-122.5,37.7],[-122.3,37.7],[-122.3,37.8],[-122.5,37.8],[-122.5,37.7]]]}'
                value={newProposalForm.proposedBoundaryStr}
                onChange={(e) => setNewProposalForm((p) => ({ ...p, proposedBoundaryStr: e.target.value }))}
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground mb-1 block">Justification</label>
              <Input
                value={newProposalForm.justification}
                placeholder="Business justification for boundary adjustment"
                onChange={(e) => setNewProposalForm((p) => ({ ...p, justification: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowRealignmentModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Proposal
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

