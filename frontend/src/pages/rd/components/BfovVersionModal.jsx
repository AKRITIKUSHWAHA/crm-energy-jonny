import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Clock, Check, AlertCircle } from 'lucide-react';
import { bfovService } from '../../../services/bfovService';

export const BfovVersionModal = ({ isOpen, diagramId, currentVersion = 1, onClose, onVersionRestored }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen && diagramId) {
      setLoading(true);
      setErrorMsg(null);
      bfovService.getVersions(diagramId)
        .then(res => {
          if (res?.versions) setVersions(res.versions);
        })
        .catch(err => setErrorMsg(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, diagramId]);

  if (!isOpen) return null;

  const handleRestore = async (versionNum) => {
    if (!window.confirm(`Are you sure you want to restore diagram version v${versionNum}? A new snapshot will be created.`)) return;

    try {
      setRestoringVersion(versionNum);
      const res = await bfovService.restoreVersion(diagramId, versionNum);
      if (res?.diagram) {
        onVersionRestored && onVersionRestored(res.diagram);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    } finally {
      setRestoringVersion(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-semibold text-slate-100">Diagram Version History</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm font-bold">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="max-h-[50vh] overflow-y-auto space-y-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading version snapshots...</div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No version snapshots recorded yet.</div>
          ) : (
            versions.map((v) => {
              const isCurrent = v.version === currentVersion;
              return (
                <div
                  key={v.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'bg-sky-950/40 border-sky-500/40 text-slate-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-sky-400">v{v.version}</span>
                      <span className="text-xs font-semibold">{v.title}</span>
                      {isCurrent && (
                        <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-mono">
                          Current Live
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{v.changeSummary || 'Canvas update'}</p>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-500 pt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(v.createdAt).toLocaleString()}</span>
                      </span>
                      <span>•</span>
                      <span>{v.nodeCount} Nodes</span>
                      <span>•</span>
                      <span>{v.edgeCount} Connectors</span>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      type="button"
                      disabled={restoringVersion === v.version}
                      onClick={() => handleRestore(v.version)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-sky-600 text-xs font-medium text-slate-300 hover:text-white rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{restoringVersion === v.version ? 'Restoring...' : 'Restore'}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

