import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  FileText,
  Database,
  Search,
  Upload,
  Download,
  Eye,
  History,
  RotateCcw,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Tag,
  Folder,
  Layers,
  Sparkles,
  AlertTriangle,
  Lock,
  Share2,
  Users,
  ExternalLink,
  Code,
  List,
  Bold,
  Italic,
  Underline,
  Heading,
  Quote,
  Table as TableIcon,
  Trash2,
  Archive,
  RefreshCw,
  File,
  FileSpreadsheet
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Input,
  KPICard
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';

export const RdElnWorkspace = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('notebooks'); // notebooks | entries | documents | datasets | knowledge | search
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Notebooks State
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [notebookForm, setNotebookForm] = useState({
    title: '',
    category: 'LABORATORY',
    description: '',
    tags: '',
  });

  // Entries State
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryForm, setEntryForm] = useState({
    title: '',
    content: '',
    category: 'RESEARCH_OBSERVATION',
    status: 'DRAFT',
    notebookId: '',
    tags: '',
    changeSummary: '',
  });
  const [entryVersions, setEntryVersions] = useState([]);
  const [showVersionModal, setShowVersionModal] = useState(false);

  // Documents State
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docCategoryFilter, setDocCategoryFilter] = useState('ALL');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'RESEARCH_REPORT',
    description: '',
    tags: '',
    notebookId: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePayload, setFilePayload] = useState(null);

  // New Version Modal
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [versionRevisionSummary, setVersionRevisionSummary] = useState('');
  const [versionFilePayload, setVersionFilePayload] = useState(null);

  // Document Versions History Drawer
  const [showDocHistoryDrawer, setShowDocHistoryDrawer] = useState(false);
  const [docVersionsList, setDocVersionsList] = useState([]);

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);

  // Datasets State
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [datasetForm, setDatasetForm] = useState({
    title: '',
    category: 'EXPERIMENTAL_DATASET',
    dataFormat: 'CSV',
    dataSource: '',
    description: '',
    tags: '',
  });
  const [showAddDatasetFileModal, setShowAddDatasetFileModal] = useState(false);
  const [datasetFilePayload, setDatasetFilePayload] = useState(null);
  const [datasetFileMeta, setDatasetFileMeta] = useState({ rowCount: '', columnCount: '', schemaDescription: '' });

  // Knowledge Repository State
  const [knowledgeRecords, setKnowledgeRecords] = useState([]);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [knowledgeCategoryFilter, setKnowledgeCategoryFilter] = useState('ALL');
  const [knowledgeForm, setKnowledgeForm] = useState({
    title: '',
    category: 'RESEARCH_FINDING',
    content: '',
    description: '',
    tags: '',
    accessLevel: 'TENANT_WIDE',
  });

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // 1. Fetch Initial Projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await apiClient.get('/rd/portfolio');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.projects) ? res.data.projects : []);
      if (list.length > 0) {
        setProjects(list);
        if (!selectedProjectId) {
          setSelectedProjectId(list[0].id);
        }
      }
    } catch (err) {
      console.warn('[ELN] Project load info:', err.message);
    }
  }, [selectedProjectId]);

  // 2. Fetch Notebooks
  const fetchNotebooks = useCallback(async () => {
    setLoading(true);
    try {
      const q = selectedProjectId ? `?projectId=${selectedProjectId}` : '';
      const res = await apiClient.get(`/rd/eln/notebooks${q}`);
      if (res.success) setNotebooks(res.data || []);
    } catch (err) {
      console.warn('[ELN] Notebooks fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // 3. Fetch Entries
  const fetchEntries = useCallback(async () => {
    try {
      const q = selectedProjectId ? `?projectId=${selectedProjectId}` : '';
      const res = await apiClient.get(`/rd/eln/entries${q}`);
      if (res.success) setEntries(res.data || []);
    } catch (err) {
      console.warn('[ELN] Entries fetch error:', err.message);
    }
  }, [selectedProjectId]);

  // 4. Fetch Documents
  const fetchDocuments = useCallback(async () => {
    try {
      let q = selectedProjectId ? `?projectId=${selectedProjectId}` : '';
      if (docCategoryFilter !== 'ALL') {
        q += (q ? '&' : '?') + `category=${docCategoryFilter}`;
      }
      const res = await apiClient.get(`/rd/eln/documents${q}`);
      if (res.success) setDocuments(res.data || []);
    } catch (err) {
      console.warn('[ELN] Documents fetch error:', err.message);
    }
  }, [selectedProjectId, docCategoryFilter]);

  // 5. Fetch Datasets
  const fetchDatasets = useCallback(async () => {
    try {
      const q = selectedProjectId ? `?projectId=${selectedProjectId}` : '';
      const res = await apiClient.get(`/rd/eln/datasets${q}`);
      if (res.success) setDatasets(res.data || []);
    } catch (err) {
      console.warn('[ELN] Datasets fetch error:', err.message);
    }
  }, [selectedProjectId]);

  // 6. Fetch Knowledge Records
  const fetchKnowledge = useCallback(async () => {
    try {
      let q = knowledgeCategoryFilter !== 'ALL' ? `?category=${knowledgeCategoryFilter}` : '';
      const res = await apiClient.get(`/rd/eln/knowledge${q}`);
      if (res.success) setKnowledgeRecords(res.data || []);
    } catch (err) {
      console.warn('[ELN] Knowledge fetch error:', err.message);
    }
  }, [knowledgeCategoryFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchNotebooks();
    fetchEntries();
    fetchDocuments();
    fetchDatasets();
    fetchKnowledge();
  }, [fetchNotebooks, fetchEntries, fetchDocuments, fetchDatasets, fetchKnowledge]);

  // Handle File Input Conversion to Base64
  const handleFileChange = (e, setPayloadFunc) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      addToast({
        title: 'File Rejected',
        message: 'File size exceeds 25MB maximum limit.',
        type: 'danger',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64Content = evt.target.result;
      setPayloadFunc({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        base64Content,
      });
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  // Notebook Handlers
  const handleCreateNotebook = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      addToast({ title: 'Validation Error', message: 'Please select an R&D project first.', type: 'danger' });
      return;
    }
    try {
      const res = await apiClient.post('/rd/eln/notebooks', {
        ...notebookForm,
        projectId: selectedProjectId,
      });
      if (res.success) {
        addToast({ title: 'Notebook Created', message: `Notebook ${res.data.notebookCode} registered.`, type: 'success' });
        setShowNotebookModal(false);
        setNotebookForm({ title: '', category: 'LABORATORY', description: '', tags: '' });
        fetchNotebooks();
      }
    } catch (err) {
      addToast({ title: 'Creation Failed', message: err.message, type: 'danger' });
    }
  };

  // Entry Handlers
  const handleSaveEntry = async (statusOverride = null) => {
    if (!selectedProjectId) {
      addToast({ title: 'Validation Error', message: 'Please select an R&D project.', type: 'danger' });
      return;
    }
    if (!entryForm.title.trim() || !entryForm.content.trim()) {
      addToast({ title: 'Validation Error', message: 'Title and content are required.', type: 'danger' });
      return;
    }

    const targetStatus = statusOverride || entryForm.status;

    try {
      if (selectedEntry?.id) {
        // Update existing entry
        const res = await apiClient.put(`/rd/eln/entries/${selectedEntry.id}`, {
          ...entryForm,
          status: targetStatus,
        });
        if (res.success) {
          addToast({ title: 'Entry Updated', message: `Entry ${res.data.entryNumber} updated (v${res.data.version}).`, type: 'success' });
          fetchEntries();
          setSelectedEntry(res.data);
        }
      } else {
        // Create new entry
        const res = await apiClient.post('/rd/eln/entries', {
          ...entryForm,
          projectId: selectedProjectId,
          status: targetStatus,
        });
        if (res.success) {
          addToast({ title: 'Entry Saved', message: `Entry ${res.data.entryNumber} recorded.`, type: 'success' });
          fetchEntries();
          setSelectedEntry(res.data);
        }
      }
    } catch (err) {
      addToast({ title: 'Save Failed', message: err.message, type: 'danger' });
    }
  };

  const handleOpenVersions = async (entryId) => {
    try {
      const res = await apiClient.get(`/rd/eln/entries/${entryId}/versions`);
      if (res.success) {
        setEntryVersions(res.data || []);
        setShowVersionModal(true);
      }
    } catch (err) {
      addToast({ title: 'Error', message: 'Could not load revision history.', type: 'danger' });
    }
  };

  // Document Upload Handler
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      addToast({ title: 'Validation Error', message: 'Select an R&D project.', type: 'danger' });
      return;
    }
    if (!filePayload) {
      addToast({ title: 'Validation Error', message: 'Please select a valid file to upload.', type: 'danger' });
      return;
    }

    try {
      const res = await apiClient.post('/rd/eln/documents', {
        ...docForm,
        projectId: selectedProjectId,
        filePayload,
      });
      if (res.success) {
        addToast({ title: 'Document Uploaded', message: `Document ${res.data.documentCode} saved.`, type: 'success' });
        setShowDocModal(false);
        setDocForm({ title: '', category: 'RESEARCH_REPORT', description: '', tags: '', notebookId: '' });
        setFilePayload(null);
        setSelectedFile(null);
        fetchDocuments();
      }
    } catch (err) {
      addToast({ title: 'Upload Failed', message: err.message, type: 'danger' });
    }
  };

  // Upload New Version Handler (Req 94)
  const handleUploadNewVersion = async (e) => {
    e.preventDefault();
    if (!selectedDocument || !versionFilePayload) {
      addToast({ title: 'Validation Error', message: 'Select a replacement file.', type: 'danger' });
      return;
    }

    try {
      const res = await apiClient.post(`/rd/eln/documents/${selectedDocument.id}/versions`, {
        filePayload: versionFilePayload,
        revisionSummary: versionRevisionSummary || 'Updated file version',
      });
      if (res.success) {
        addToast({ title: 'New Version Uploaded', message: `Created ${res.data.data.version.versionLabel} without erasing history.`, type: 'success' });
        setShowNewVersionModal(false);
        setVersionFilePayload(null);
        setVersionRevisionSummary('');
        fetchDocuments();
      }
    } catch (err) {
      addToast({ title: 'Version Upload Failed', message: err.message, type: 'danger' });
    }
  };

  // Restore Version Handler (Req 94, AC-17)
  const handleRestoreHistoricalVersion = async (docId, versionNumber) => {
    if (!window.confirm(`Are you sure you want to restore Version #${versionNumber} as the current document version? All existing versions will be preserved.`)) {
      return;
    }

    try {
      const res = await apiClient.post(`/rd/eln/documents/${docId}/versions/${versionNumber}/restore`);
      if (res.success) {
        addToast({
          title: 'Version Restored',
          message: `Restored v${versionNumber} as latest revision ${res.data.data.restoredVersion.versionLabel}. Full history preserved!`,
          type: 'success',
        });
        fetchDocuments();
        setShowDocHistoryDrawer(false);
      }
    } catch (err) {
      addToast({ title: 'Restoration Failed', message: err.message, type: 'danger' });
    }
  };

  // Open Document History Drawer
  const handleViewDocHistory = async (doc) => {
    setSelectedDocument(doc);
    try {
      const res = await apiClient.get(`/rd/eln/documents/${doc.id}/versions`);
      if (res.success) {
        setDocVersionsList(res.data || []);
        setShowDocHistoryDrawer(true);
      }
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to retrieve version history.', type: 'danger' });
    }
  };

  // Preview Document Handler
  const handlePreviewDocument = async (doc) => {
    setPreviewDoc(doc);
    try {
      const previewUrl = `/api/rd/eln/documents/${doc.id}/preview`;
      setPreviewContent(previewUrl);
    } catch (err) {
      addToast({ title: 'Preview Error', message: err.message, type: 'danger' });
    }
  };

  // Download Document Handler
  const handleDownloadDoc = (docId, fileName, versionNumber = null) => {
    const q = versionNumber ? `?version=${versionNumber}` : '';
    const url = `/api/rd/eln/documents/${docId}/download${q}`;
    const token = localStorage.getItem('token');
    
    // Trigger browser download via anchor
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dataset Handlers
  const handleCreateDataset = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      addToast({ title: 'Validation Error', message: 'Select an R&D project.', type: 'danger' });
      return;
    }
    try {
      const res = await apiClient.post('/rd/eln/datasets', {
        ...datasetForm,
        projectId: selectedProjectId,
      });
      if (res.success) {
        addToast({ title: 'Dataset Registered', message: `Dataset ${res.data.datasetCode} created.`, type: 'success' });
        setShowDatasetModal(false);
        setDatasetForm({ title: '', category: 'EXPERIMENTAL_DATASET', dataFormat: 'CSV', dataSource: '', description: '', tags: '' });
        fetchDatasets();
      }
    } catch (err) {
      addToast({ title: 'Registration Failed', message: err.message, type: 'danger' });
    }
  };

  const handleUploadDatasetFile = async (e) => {
    e.preventDefault();
    if (!selectedDataset || !datasetFilePayload) {
      addToast({ title: 'Validation Error', message: 'Choose a file to attach to dataset.', type: 'danger' });
      return;
    }

    try {
      const res = await apiClient.post(`/rd/eln/datasets/${selectedDataset.id}/files`, {
        filePayload: datasetFilePayload,
        ...datasetFileMeta,
      });
      if (res.success) {
        addToast({ title: 'File Attached', message: `File ${res.data.fileName} added to dataset.`, type: 'success' });
        setShowAddDatasetFileModal(false);
        setDatasetFilePayload(null);
        setDatasetFileMeta({ rowCount: '', columnCount: '', schemaDescription: '' });
        fetchDatasets();
      }
    } catch (err) {
      addToast({ title: 'Attachment Failed', message: err.message, type: 'danger' });
    }
  };

  // Knowledge Record Handlers
  const handleCreateKnowledge = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/rd/eln/knowledge', {
        ...knowledgeForm,
        sourceProjectId: selectedProjectId || null,
      });
      if (res.success) {
        addToast({ title: 'Knowledge Saved', message: `Knowledge record ${res.data.knowledgeCode} published.`, type: 'success' });
        setShowKnowledgeModal(false);
        setKnowledgeForm({ title: '', category: 'RESEARCH_FINDING', content: '', description: '', tags: '', accessLevel: 'TENANT_WIDE' });
        fetchKnowledge();
      }
    } catch (err) {
      addToast({ title: 'Save Failed', message: err.message, type: 'danger' });
    }
  };

  // Global Search Handler (AC-20)
  const handleGlobalSearch = async (e) => {
    if (e) e.preventDefault();
    if (!globalSearchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await apiClient.get(`/rd/eln/search?q=${encodeURIComponent(globalSearchQuery.trim())}`);
      if (res.success) {
        setSearchResults(res.data);
      }
    } catch (err) {
      addToast({ title: 'Search Failed', message: err.message, type: 'danger' });
    } finally {
      setSearching(false);
    }
  };

  // Helper for editor formatting injection
  const injectEditorSyntax = (syntaxPrefix, syntaxSuffix = '') => {
    const current = entryForm.content || '';
    setEntryForm({ ...entryForm, content: current + `${syntaxPrefix}Sample Text${syntaxSuffix}` });
  };

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%' }}>
      {/* Top Header & Project Context Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Badge variant="primary" style={{ fontWeight: 800 }}>Master Prompt 08</Badge>
            <Badge variant="success" style={{ fontWeight: 700 }}>Req 30 • Req 42 • Req 63 • Req 94</Badge>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Electronic Lab Notebook (ELN) & Research Documentation
          </h1>
          <p className="text-sm text-secondary" style={{ margin: '4px 0 0 0' }}>
            Centralized scientific notebook, versioned research documentation, dataset registry, and reusable knowledge repository.
          </p>
        </div>

        {/* Project Context Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="text-xs font-bold text-secondary">R&D Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              minWidth: '220px',
            }}
          >
            <option value="">All R&D Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode ? `[${p.projectCode}] ` : ''}{p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top KPI Metrics Rollup */}
      <div className="grid-responsive-kpi mb-6">
        <KPICard
          title="Active Notebooks"
          value={String(notebooks.filter(n => n.status === 'ACTIVE').length)}
          subtitle="Laboratory & Theoretical"
          icon={BookOpen}
        />
        <KPICard
          title="Research Entries"
          value={String(entries.length)}
          subtitle={`${entries.filter(e => e.status === 'FINALIZED').length} Finalized Sign-offs`}
          icon={FileText}
        />
        <KPICard
          title="Research Documents"
          value={String(documents.length)}
          subtitle="Reports, Papers & Specs"
          icon={File}
        />
        <KPICard
          title="Registered Datasets"
          value={String(datasets.length)}
          subtitle="Experimental & Instrument Data"
          icon={Database}
        />
        <KPICard
          title="Knowledge Repository"
          value={String(knowledgeRecords.length)}
          subtitle="Reusable Findings & SOPs"
          icon={Sparkles}
        />
      </div>

      {/* Primary ELN Navigation Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'notebooks', label: 'Lab Notebooks', icon: BookOpen, count: notebooks.length },
          { id: 'entries', label: 'Notebook Entries & Editor', icon: FileText, count: entries.length },
          { id: 'documents', label: 'Document Repository', icon: File, count: documents.length },
          { id: 'datasets', label: 'Dataset Registry', icon: Database, count: datasets.length },
          { id: 'knowledge', label: 'Knowledge Repository', icon: Sparkles, count: knowledgeRecords.length },
          { id: 'search', label: 'Global ELN Search', icon: Search },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '10px',
                    backgroundColor: isActive ? 'var(--primary)' : 'var(--surface-raised)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: LAB NOTEBOOKS */}
      {/* ========================================================================= */}
      {activeTab === 'notebooks' && (
        <div className="flex flex-col gap-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Research Notebooks</h3>
              <p className="text-xs text-secondary margin-0">Dedicated project notebooks with multi-contributor access control.</p>
            </div>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowNotebookModal(true)}>
              New Notebook
            </Button>
          </div>

          {notebooks.length === 0 ? (
            <Card style={{ padding: '2rem', textAlign: 'center' }}>
              <BookOpen size={40} style={{ margin: '0 auto 1rem auto', color: 'var(--text-muted)' }} />
              <h4 style={{ margin: 0, fontWeight: 700 }}>No Research Notebooks Found</h4>
              <p className="text-xs text-secondary" style={{ marginTop: 4 }}>
                Create a project notebook to begin documenting laboratory procedures and experimental notes.
              </p>
              <Button variant="primary" size="sm" icon={Plus} style={{ margin: '1rem auto 0 auto' }} onClick={() => setShowNotebookModal(true)}>
                Create First Notebook
              </Button>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
              {notebooks.map((nb) => (
                <Card key={nb.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <CardHeader
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800 }}>{nb.title}</span>
                        <Badge variant={nb.status === 'ACTIVE' ? 'success' : 'neutral'}>{nb.status}</Badge>
                      </div>
                    }
                    subtitle={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>{nb.notebookCode}</span>
                        <span className="text-xs text-secondary">• {nb.category}</span>
                      </div>
                    }
                  />
                  <CardBody className="pt-0 flex flex-col gap-3">
                    <p className="text-xs text-secondary margin-0" style={{ minHeight: '36px' }}>
                      {nb.description || 'No description provided.'}
                    </p>

                    <div style={{ display: 'flex', gap: 12, padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--surface-raised)', fontSize: '11px' }}>
                      <div><strong>{nb._count?.entries || 0}</strong> Entries</div>
                      <div><strong>{nb._count?.documents || 0}</strong> Docs</div>
                      <div><strong>{nb._count?.datasets || 0}</strong> Datasets</div>
                      <div><strong>{nb.contributors?.length || 1}</strong> Contributors</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span className="text-xs text-muted">
                        Project: <strong>{nb.project?.name || 'R&D Project'}</strong>
                      </span>
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={BookOpen}
                        onClick={() => {
                          setSelectedNotebook(nb);
                          setEntryForm(prev => ({ ...prev, notebookId: nb.id }));
                          setActiveTab('entries');
                        }}
                      >
                        Open Notebook
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: RESEARCH ENTRIES & RICH TEXT EDITOR */}
      {/* ========================================================================= */}
      {activeTab === 'entries' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,340px)_1fr] gap-4">
          {/* Left Column: Entries List */}
          <div className="flex flex-col gap-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Entries List</h3>
              <Button
                variant="primary"
                size="xs"
                icon={Plus}
                onClick={() => {
                  setSelectedEntry(null);
                  setEntryForm({
                    title: '',
                    content: '',
                    category: 'RESEARCH_OBSERVATION',
                    status: 'DRAFT',
                    notebookId: selectedNotebook?.id || '',
                    tags: '',
                    changeSummary: '',
                  });
                }}
              >
                New Entry
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '680px', overflowY: 'auto' }}>
              {entries.map((ent) => {
                const isSelected = selectedEntry?.id === ent.id;
                return (
                  <div
                    key={ent.id}
                    onClick={() => {
                      setSelectedEntry(ent);
                      setEntryForm({
                        title: ent.title,
                        content: ent.content,
                        category: ent.category || 'RESEARCH_OBSERVATION',
                        status: ent.status || 'DRAFT',
                        notebookId: ent.notebookId || '',
                        tags: ent.tags || '',
                        changeSummary: '',
                      });
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>
                        {ent.entryNumber || 'ENT-001'}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Badge variant={ent.status === 'FINALIZED' ? 'success' : 'neutral'} style={{ fontSize: '9px' }}>
                          {ent.status}
                        </Badge>
                        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          v{ent.version || 1}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {ent.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>{ent.category?.replace(/_/g, ' ')}</span>
                      <span>{new Date(ent.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Research Documentation Rich Text Editor */}
          <Card>
            <CardHeader
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BookOpen size={18} color="var(--primary)" />
                    <span style={{ fontSize: '16px', fontWeight: 800 }}>
                      {selectedEntry ? `Edit Entry: ${selectedEntry.entryNumber}` : 'New Research Documentation Entry'}
                    </span>
                    {selectedEntry && (
                      <Badge variant="primary" style={{ fontSize: '10px' }}>Version {selectedEntry.version || 1}</Badge>
                    )}
                  </div>

                  {selectedEntry && (
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={History}
                      onClick={() => handleOpenVersions(selectedEntry.id)}
                    >
                      Revision History
                    </Button>
                  )}
                </div>
              }
            />
            <CardBody className="pt-0 flex flex-col gap-4">
              {/* Form Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label className="text-xs font-bold text-secondary">Entry Title *</label>
                  <input
                    type="text"
                    value={entryForm.title}
                    onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
                    placeholder="e.g. Synthesis Reaction Observation Run #4"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      marginTop: 4,
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-secondary">Category</label>
                  <select
                    value={entryForm.category}
                    onChange={(e) => setEntryForm({ ...entryForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      marginTop: 4,
                    }}
                  >
                    <option value="RESEARCH_OBSERVATION">Research Observation</option>
                    <option value="METHODOLOGY">Methodology</option>
                    <option value="LITERATURE_REVIEW">Literature Review</option>
                    <option value="EXPERIMENTAL_PROCEDURE">Experimental Procedure</option>
                    <option value="THEORETICAL_FRAMEWORK">Theoretical Framework</option>
                    <option value="ANALYSIS">Analysis & Interpretation</option>
                    <option value="CONCLUSION">Conclusion</option>
                    <option value="GENERAL_NOTE">General Note</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-secondary">Target Notebook</label>
                  <select
                    value={entryForm.notebookId}
                    onChange={(e) => setEntryForm({ ...entryForm, notebookId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      marginTop: 4,
                    }}
                  >
                    <option value="">No Notebook Bound</option>
                    {notebooks.map((nb) => (
                      <option key={nb.id} value={nb.id}>
                        {nb.notebookCode}: {nb.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rich Text Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  flexWrap: 'wrap',
                }}
              >
                <button type="button" onClick={() => injectEditorSyntax('**', '**')} style={{ padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Bold">
                  <Bold size={14} />
                </button>
                <button type="button" onClick={() => injectEditorSyntax('*', '*')} style={{ padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Italic">
                  <Italic size={14} />
                </button>
                <button type="button" onClick={() => injectEditorSyntax('<u>', '</u>')} style={{ padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Underline">
                  <Underline size={14} />
                </button>
                <span style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)', margin: '0 4px' }} />
                <button type="button" onClick={() => injectEditorSyntax('### ')} style={{ padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Heading">
                  <Heading size={14} />
                </button>
                <button type="button" onClick={() => injectEditorSyntax('- ')} style={{ padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Bullet List">
                  <List size={14} />
                </button>
                <button type="button" onClick={() => injectEditorSyntax('> ')} style={{ padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Blockquote">
                  <Quote size={14} />
                </button>
                <button type="button" onClick={() => injectEditorSyntax('```\n', '\n```')} style={{ padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Code Block">
                  <Code size={14} />
                </button>
                <button type="button" onClick={() => injectEditorSyntax('\n| Variable | Expected | Observed |\n|---|---|---|\n| Temp | 1200C | 1198C |\n')} style={{ padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Data Table">
                  <TableIcon size={14} />
                </button>
              </div>

              {/* Textarea Documentation Editor */}
              <div>
                <textarea
                  value={entryForm.content}
                  onChange={(e) => setEntryForm({ ...entryForm, content: e.target.value })}
                  placeholder="Enter detailed laboratory documentation, observations, equations, and synthesis notes..."
                  rows={14}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Revision Summary (if updating existing entry) */}
              {selectedEntry && (
                <div>
                  <label className="text-xs font-bold text-secondary">Change Summary (Saved to Revision History)</label>
                  <input
                    type="text"
                    value={entryForm.changeSummary}
                    onChange={(e) => setEntryForm({ ...entryForm, changeSummary: e.target.value })}
                    placeholder="e.g. Added spectroscopic peak analysis"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      marginTop: 4,
                    }}
                  />
                </div>
              )}

              {/* Editor Bottom Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span className="text-xs text-muted">
                  Status: <strong>{entryForm.status}</strong>
                </span>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSaveEntry('DRAFT')}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => handleSaveEntry('FINALIZED')}
                  >
                    Finalize & Sign-off
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: DOCUMENT REPOSITORY (REQUIREMENT 42 & 94) */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <div className="flex flex-col gap-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Research Document Repository</h3>
              <p className="text-xs text-secondary margin-0">
                Secure scientific document storage with internal version control, SHA-256 integrity, and preview.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" size="sm" icon={Upload} onClick={() => setShowDocModal(true)}>
                Upload Document
              </Button>
            </div>
          </div>

          {/* Category Filter Pills & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['ALL', 'RESEARCH_REPORT', 'TECHNICAL_DOCUMENT', 'SCIENTIFIC_PAPER', 'EXPERIMENTAL_REPORT', 'METHODOLOGY', 'DATASET_DOCUMENTATION'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setDocCategoryFilter(cat)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: docCategoryFilter === cat ? '1px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: docCategoryFilter === cat ? 'var(--primary-subtle)' : 'var(--surface)',
                    color: docCategoryFilter === cat ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div style={{ width: '240px' }}>
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                placeholder="Search documents..."
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
            </div>
          </div>

          {/* Documents Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Document Code</TableCell>
                <TableCell isHeader>Title & Original Filename</TableCell>
                <TableCell isHeader>Category</TableCell>
                <TableCell isHeader>Version (Req 94)</TableCell>
                <TableCell isHeader>Size & Type</TableCell>
                <TableCell isHeader>Uploaded By</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents
                .filter(d => !docSearchQuery || d.title.toLowerCase().includes(docSearchQuery.toLowerCase()) || d.originalFilename.toLowerCase().includes(docSearchQuery.toLowerCase()))
                .map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>
                        {doc.documentCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-bold text-sm text-primary">{doc.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span className="font-mono text-xs text-muted">{doc.originalFilename}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" style={{ fontSize: '10px' }}>
                        {doc.category.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Badge variant="primary" style={{ fontWeight: 700, fontSize: '11px' }}>
                          v{doc.currentVersion}.0
                        </Badge>
                        {doc.versions?.length > 1 && (
                          <span className="text-xs text-secondary font-mono">
                            ({doc.versions.length} revisions)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-secondary">
                        {Math.round(doc.fileSize / 1024)} KB ({doc.fileExtension})
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-secondary">
                        {doc.uploader?.name || 'Researcher'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={Eye}
                          onClick={() => handlePreviewDocument(doc)}
                          title="Preview document"
                        >
                          Preview
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={Download}
                          onClick={() => handleDownloadDoc(doc.id, doc.originalFilename)}
                          title="Download current file"
                        />
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={Plus}
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowNewVersionModal(true);
                          }}
                          title="Upload replacement version (Req 94)"
                        >
                          New Ver
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={History}
                          onClick={() => handleViewDocHistory(doc)}
                          title="View revision history & restore"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: RESEARCH DATASET REGISTRY (REQUIREMENT 42) */}
      {/* ========================================================================= */}
      {activeTab === 'datasets' && (
        <div className="flex flex-col gap-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Research Dataset Registry</h3>
              <p className="text-xs text-secondary margin-0">
                Register scientific instrument files, simulation exports, and structured experimental tables.
              </p>
            </div>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowDatasetModal(true)}>
              Register Dataset
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
            {datasets.map((ds) => (
              <Card key={ds.id}>
                <CardHeader
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800 }}>{ds.title}</span>
                      <Badge variant="primary">{ds.dataFormat}</Badge>
                    </div>
                  }
                  subtitle={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>{ds.datasetCode}</span>
                      <span className="text-xs text-secondary">• {ds.category.replace(/_/g, ' ')}</span>
                    </div>
                  }
                />
                <CardBody className="pt-0 flex flex-col gap-3">
                  <p className="text-xs text-secondary margin-0">
                    {ds.description || 'No dataset description provided.'}
                  </p>

                  <div style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--surface-raised)', fontSize: '11px' }}>
                    <strong>{ds.files?.length || 0}</strong> attached files
                    {ds.dataSource && <span> • Source: <em>{ds.dataSource}</em></span>}
                  </div>

                  {/* Attached Files List */}
                  {ds.files && ds.files.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      {ds.files.map((f) => (
                        <div
                          key={f.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            fontSize: '11px',
                          }}
                        >
                          <span className="font-mono font-bold">{f.fileName}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="text-muted">{Math.round(f.fileSize / 1024)} KB</span>
                            <a
                              href={`/api/rd/eln/datasets/files/${f.id}/download`}
                              download={f.fileName}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--primary)' }}
                            >
                              <Download size={12} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={Upload}
                      onClick={() => {
                        setSelectedDataset(ds);
                        setShowAddDatasetFileModal(true);
                      }}
                    >
                      + Add File
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 5: KNOWLEDGE REPOSITORY (REQUIREMENT 30) */}
      {/* ========================================================================= */}
      {activeTab === 'knowledge' && (
        <div className="flex flex-col gap-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Research Knowledge Repository</h3>
              <p className="text-xs text-secondary margin-0">
                Discover reusable scientific findings, standard methodologies, and lessons learned.
              </p>
            </div>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowKnowledgeModal(true)}>
              + New Knowledge Record
            </Button>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['ALL', 'RESEARCH_FINDING', 'TECHNICAL_KNOWLEDGE', 'SCIENTIFIC_REFERENCE', 'METHODOLOGY', 'BEST_PRACTICE', 'LESSONS_LEARNED'].map((cat) => (
              <button
                key={cat}
                onClick={() => setKnowledgeCategoryFilter(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: knowledgeCategoryFilter === cat ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: knowledgeCategoryFilter === cat ? 'var(--primary-subtle)' : 'var(--surface)',
                  color: knowledgeCategoryFilter === cat ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
            {knowledgeRecords.map((kr) => (
              <Card key={kr.id}>
                <CardHeader
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800 }}>{kr.title}</span>
                      <Badge variant="primary" style={{ fontSize: '9px' }}>{kr.accessLevel}</Badge>
                    </div>
                  }
                  subtitle={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>{kr.knowledgeCode}</span>
                      <span className="text-xs text-secondary">• {kr.category.replace(/_/g, ' ')}</span>
                    </div>
                  }
                />
                <CardBody className="pt-0 flex flex-col gap-3">
                  <p className="text-xs text-secondary margin-0">
                    {kr.description || 'No summary description.'}
                  </p>

                  <div
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--surface-raised)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      maxHeight: '140px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.5',
                    }}
                  >
                    {kr.content}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span className="text-xs text-muted">
                      {new Date(kr.createdAt).toLocaleDateString()}
                    </span>
                    {kr.tags && (
                      <span className="text-xs text-secondary font-mono">
                        #{kr.tags}
                      </span>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 6: UNIFIED GLOBAL ELN SEARCH (AC-20) */}
      {/* ========================================================================= */}
      {activeTab === 'search' && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader
              title="Unified ELN Discovery & Scientific Content Search"
              subtitle="Search simultaneously across Notebooks, Research Entries, Documents, Datasets, and Knowledge Records"
            />
            <CardBody className="pt-0 flex flex-col gap-4">
              <form onSubmit={handleGlobalSearch} style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  placeholder="Enter keywords, chemical compounds, procedure codes, or author names..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
                <Button variant="primary" type="submit" icon={Search} disabled={searching}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </form>

              {/* Search Results Display */}
              {searchResults && (
                <div className="flex flex-col gap-4 mt-2">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="text-sm font-bold">Total Matches: {searchResults.counts?.total || 0}</span>
                    <Badge variant="neutral">{searchResults.counts?.notebooks} Notebooks</Badge>
                    <Badge variant="neutral">{searchResults.counts?.entries} Entries</Badge>
                    <Badge variant="neutral">{searchResults.counts?.documents} Documents</Badge>
                    <Badge variant="neutral">{searchResults.counts?.datasets} Datasets</Badge>
                    <Badge variant="neutral">{searchResults.counts?.knowledge} Knowledge</Badge>
                  </div>

                  {/* Documents Matches */}
                  {searchResults.documents?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '8px 0' }}>Matched Documents:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {searchResults.documents.map(d => (
                          <div key={d.id} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--surface-raised)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)', marginRight: 8 }}>{d.documentCode}</span>
                              <strong className="text-sm">{d.title}</strong>
                              <span className="text-xs text-muted" style={{ marginLeft: 8 }}>({d.originalFilename})</span>
                            </div>
                            <Button variant="secondary" size="xs" icon={Eye} onClick={() => handlePreviewDocument(d)}>View</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entries Matches */}
                  {searchResults.entries?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '8px 0' }}>Matched Research Entries:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {searchResults.entries.map(e => (
                          <div key={e.id} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--surface-raised)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>{e.entryNumber}</span>
                              <Badge variant="neutral" style={{ fontSize: '10px' }}>{e.category}</Badge>
                            </div>
                            <strong className="text-sm">{e.title}</strong>
                            <p className="text-xs text-secondary margin-0" style={{ marginTop: 4 }}>{e.content.slice(0, 140)}...</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NOTEBOOK */}
      {/* ========================================================================= */}
      {showNotebookModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <Card style={{ width: '100%', maxWidth: '520px', backgroundColor: 'var(--surface)' }}>
            <CardHeader title="Create New Research Notebook" subtitle="Initialize a dedicated laboratory or theoretical notebook" />
            <CardBody className="pt-0">
              <form onSubmit={handleCreateNotebook} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-secondary">Notebook Title *</label>
                  <input
                    type="text"
                    required
                    value={notebookForm.title}
                    onChange={(e) => setNotebookForm({ ...notebookForm, title: e.target.value })}
                    placeholder="e.g. Nanomaterial Coating Synthesis Lab Notebook"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary">Category</label>
                  <select
                    value={notebookForm.category}
                    onChange={(e) => setNotebookForm({ ...notebookForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  >
                    <option value="LABORATORY">Laboratory</option>
                    <option value="THEORETICAL">Theoretical</option>
                    <option value="COMPUTATIONAL">Computational</option>
                    <option value="FORMULATION">Formulation</option>
                    <option value="CLINICAL">Clinical</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary">Description</label>
                  <textarea
                    rows={3}
                    value={notebookForm.description}
                    onChange={(e) => setNotebookForm({ ...notebookForm, description: e.target.value })}
                    placeholder="Research scope and objective summary..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={notebookForm.tags}
                    onChange={(e) => setNotebookForm({ ...notebookForm, tags: e.target.value })}
                    placeholder="synthesis, graphene, high-temp"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <Button variant="secondary" type="button" onClick={() => setShowNotebookModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Create Notebook</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: UPLOAD DOCUMENT */}
      {/* ========================================================================= */}
      {showDocModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <Card style={{ width: '100%', maxWidth: '560px', backgroundColor: 'var(--surface)' }}>
            <CardHeader title="Upload Research Document" subtitle="Attach research papers, specifications, or lab reports" />
            <CardBody className="pt-0">
              <form onSubmit={handleUploadDocument} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-secondary">File Attachment * (Max 25MB)</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => handleFileChange(e, setFilePayload)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                  {selectedFile && (
                    <span className="text-xs text-muted font-mono" style={{ marginTop: 2, display: 'block' }}>
                      Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    placeholder="e.g. Phase 2 Spectrometry Analysis Report"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary">Category</label>
                  <select
                    value={docForm.category}
                    onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  >
                    <option value="RESEARCH_REPORT">Research Report</option>
                    <option value="TECHNICAL_DOCUMENT">Technical Document</option>
                    <option value="SCIENTIFIC_PAPER">Scientific Paper</option>
                    <option value="EXPERIMENTAL_REPORT">Experimental Report</option>
                    <option value="METHODOLOGY">Methodology</option>
                    <option value="DATASET_DOCUMENTATION">Dataset Documentation</option>
                    <option value="RESEARCH_EVIDENCE">Research Evidence</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary">Description</label>
                  <textarea
                    rows={2}
                    value={docForm.description}
                    onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                    placeholder="Brief description of findings..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <Button variant="secondary" type="button" onClick={() => setShowDocModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Upload Document</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UPLOAD REPLACEMENT VERSION (REQUIREMENT 94) */}
      {/* ========================================================================= */}
      {showNewVersionModal && selectedDocument && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <Card style={{ width: '100%', maxWidth: '520px', backgroundColor: 'var(--surface)' }}>
            <CardHeader
              title={`Upload Replacement Revision for ${selectedDocument.documentCode}`}
              subtitle="Creates an incremented version record without deleting past history"
            />
            <CardBody className="pt-0">
              <form onSubmit={handleUploadNewVersion} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-secondary">New Version File *</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => handleFileChange(e, setVersionFilePayload)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary">Revision Description / Change Summary *</label>
                  <input
                    type="text"
                    required
                    value={versionRevisionSummary}
                    onChange={(e) => setVersionRevisionSummary(e.target.value)}
                    placeholder="e.g. Corrected peak calibration data and updated conclusions"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <Button variant="secondary" type="button" onClick={() => setShowNewVersionModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Save Revision (v{selectedDocument.currentVersion + 1}.0)</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL 4: DOCUMENT VERSION HISTORY & RESTORATION (REQ 94, AC-17) */}
      {/* ========================================================================= */}
      {showDocHistoryDrawer && selectedDocument && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <Card style={{ width: '100%', maxWidth: '640px', maxHeight: '80vh', overflowY: 'auto', backgroundColor: 'var(--surface)' }}>
            <CardHeader
              title={`Revision History: ${selectedDocument.documentCode}`}
              subtitle={`Complete historical versions for "${selectedDocument.title}"`}
            />
            <CardBody className="pt-0 flex flex-col gap-3">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {docVersionsList.map((ver) => (
                  <div
                    key={ver.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: ver.isCurrent ? '1px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: ver.isCurrent ? 'var(--primary-subtle)' : 'var(--surface-raised)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="font-bold text-sm text-primary">{ver.versionLabel} (#{ver.versionNumber})</span>
                        {ver.isCurrent && <Badge variant="success">Current Active Version</Badge>}
                      </div>
                      <div className="text-xs text-secondary mt-1">
                        {ver.revisionSummary || 'Initial upload'}
                      </div>
                      <div className="font-mono text-xs text-muted mt-1">
                        {ver.originalFilename} • {Math.round(ver.fileSize / 1024)} KB • {new Date(ver.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={Download}
                        onClick={() => handleDownloadDoc(selectedDocument.id, ver.originalFilename, ver.versionNumber)}
                        title="Download this historical version"
                      >
                        Download
                      </Button>

                      {!ver.isCurrent && (
                        <Button
                          variant="primary"
                          size="xs"
                          icon={RotateCcw}
                          onClick={() => handleRestoreHistoricalVersion(selectedDocument.id, ver.versionNumber)}
                          title="Restore as latest active version (creates new revision, preserving all history)"
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <Button variant="secondary" onClick={() => setShowDocHistoryDrawer(false)}>Close</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DOCUMENT PREVIEW */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <Card style={{ width: '100%', maxWidth: '820px', height: '80vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)' }}>
            <CardHeader
              title={`Preview: ${previewDoc.title}`}
              subtitle={`${previewDoc.originalFilename} (v${previewDoc.currentVersion}.0 • ${previewDoc.mimeType})`}
            />
            <CardBody className="pt-0 flex-1 flex flex-col" style={{ overflow: 'hidden' }}>
              <div style={{ flex: 1, backgroundColor: 'var(--surface-raised)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {previewDoc.mimeType?.startsWith('image/') ? (
                  <img src={previewContent} alt={previewDoc.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <iframe
                    src={previewContent}
                    title={previewDoc.title}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <Button variant="secondary" size="sm" icon={Download} onClick={() => handleDownloadDoc(previewDoc.id, previewDoc.originalFilename)}>
                  Download File
                </Button>
                <Button variant="primary" size="sm" onClick={() => setPreviewDoc(null)}>
                  Close Preview
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: REGISTER DATASET */}
      {/* ========================================================================= */}
      {showDatasetModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <Card style={{ width: '100%', maxWidth: '520px', backgroundColor: 'var(--surface)' }}>
            <CardHeader title="Register Research Dataset" subtitle="Define scientific dataset metadata and format" />
            <CardBody className="pt-0">
              <form onSubmit={handleCreateDataset} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-secondary">Dataset Title *</label>
                  <input
                    type="text"
                    required
                    value={datasetForm.title}
                    onChange={(e) => setDatasetForm({ ...datasetForm, title: e.target.value })}
                    placeholder="e.g. Run 1-5 Thermal Sensor CSV Streams"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="text-xs font-bold text-secondary">Category</label>
                    <select
                      value={datasetForm.category}
                      onChange={(e) => setDatasetForm({ ...datasetForm, category: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                    >
                      <option value="EXPERIMENTAL_DATASET">Experimental Dataset</option>
                      <option value="INSTRUMENT_DATA">Instrument Data</option>
                      <option value="OBSERVATION_DATASET">Observation Dataset</option>
                      <option value="SIMULATION_DATASET">Simulation Dataset</option>
                      <option value="EXTERNAL_DATASET">External Dataset</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-secondary">Data Format</label>
                    <select
                      value={datasetForm.dataFormat}
                      onChange={(e) => setDatasetForm({ ...datasetForm, dataFormat: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                    >
                      <option value="CSV">CSV</option>
                      <option value="JSON">JSON</option>
                      <option value="XLSX">XLSX</option>
                      <option value="NETCDF">NetCDF</option>
                      <option value="PARQUET">Parquet</option>
                      <option value="MIXED">Mixed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary">Data Source</label>
                  <input
                    type="text"
                    value={datasetForm.dataSource}
                    onChange={(e) => setDatasetForm({ ...datasetForm, dataSource: e.target.value })}
                    placeholder="e.g. Yokogawa DL850E ScopeCorder"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary">Description</label>
                  <textarea
                    rows={2}
                    value={datasetForm.description}
                    onChange={(e) => setDatasetForm({ ...datasetForm, description: e.target.value })}
                    placeholder="Sampling frequency, calibration notes..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <Button variant="secondary" type="button" onClick={() => setShowDatasetModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Register Dataset</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: ADD FILE TO DATASET */}
      {/* ========================================================================= */}
      {showAddDatasetFileModal && selectedDataset && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <Card style={{ width: '100%', maxWidth: '520px', backgroundColor: 'var(--surface)' }}>
            <CardHeader title={`Add File to ${selectedDataset.datasetCode}`} subtitle={`Upload dataset file to "${selectedDataset.title}"`} />
            <CardBody className="pt-0">
              <form onSubmit={handleUploadDatasetFile} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-secondary">File *</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => handleFileChange(e, setDatasetFilePayload)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="text-xs font-bold text-secondary">Row Count</label>
                    <input
                      type="number"
                      value={datasetFileMeta.rowCount}
                      onChange={(e) => setDatasetFileMeta({ ...datasetFileMeta, rowCount: e.target.value })}
                      placeholder="e.g. 50000"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-secondary">Column Count</label>
                    <input
                      type="number"
                      value={datasetFileMeta.columnCount}
                      onChange={(e) => setDatasetFileMeta({ ...datasetFileMeta, columnCount: e.target.value })}
                      placeholder="e.g. 12"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary">Schema Description</label>
                  <input
                    type="text"
                    value={datasetFileMeta.schemaDescription}
                    onChange={(e) => setDatasetFileMeta({ ...datasetFileMeta, schemaDescription: e.target.value })}
                    placeholder="e.g. timestamp, ch1_temp, ch2_temp, pressure_bar"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <Button variant="secondary" type="button" onClick={() => setShowAddDatasetFileModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Upload to Dataset</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: CREATE KNOWLEDGE RECORD */}
      {/* ========================================================================= */}
      {showKnowledgeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <Card style={{ width: '100%', maxWidth: '580px', backgroundColor: 'var(--surface)' }}>
            <CardHeader title="Create Reusable Knowledge Record" subtitle="Publish scientific finding or standard methodology" />
            <CardBody className="pt-0">
              <form onSubmit={handleCreateKnowledge} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-secondary">Knowledge Title *</label>
                  <input
                    type="text"
                    required
                    value={knowledgeForm.title}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, title: e.target.value })}
                    placeholder="e.g. Optimal Temperature Window for Graphene Exfoliation"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="text-xs font-bold text-secondary">Category</label>
                    <select
                      value={knowledgeForm.category}
                      onChange={(e) => setKnowledgeForm({ ...knowledgeForm, category: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                    >
                      <option value="RESEARCH_FINDING">Research Finding</option>
                      <option value="TECHNICAL_KNOWLEDGE">Technical Knowledge</option>
                      <option value="SCIENTIFIC_REFERENCE">Scientific Reference</option>
                      <option value="METHODOLOGY">Methodology</option>
                      <option value="BEST_PRACTICE">Best Practice</option>
                      <option value="LESSONS_LEARNED">Lessons Learned</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-secondary">Access Level</label>
                    <select
                      value={knowledgeForm.accessLevel}
                      onChange={(e) => setKnowledgeForm({ ...knowledgeForm, accessLevel: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', marginTop: 4 }}
                    >
                      <option value="TENANT_WIDE">Tenant-Wide (All Researchers)</option>
                      <option value="PROJECT_RESTRICTED">Project-Restricted</option>
                      <option value="CONFIDENTIAL">Confidential</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary">Content & Findings *</label>
                  <textarea
                    rows={6}
                    required
                    value={knowledgeForm.content}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, content: e.target.value })}
                    placeholder="Synthesized discovery details, formulas, and operational considerations..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '13px', marginTop: 4 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <Button variant="secondary" type="button" onClick={() => setShowKnowledgeModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Publish Record</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};
