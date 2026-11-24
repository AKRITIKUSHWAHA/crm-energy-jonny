import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, ArrowRight, CheckCircle2, AlertCircle, Wand2, RefreshCw } from 'lucide-react';
import { bfovService } from '../../../services/bfovService';

export const BfovAiModal = ({
  isOpen,
  mode = 'generate', // 'generate' | 'edit'
  currentGraphData = null,
  diagramId = null,
  onClose,
  onApplyGraph
}) => {
  const [activeTab, setActiveTab] = useState(mode);
  const [prompt, setPrompt] = useState('');
  const [diagramType, setDiagramType] = useState('FLOWCHART');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    setActiveTab(mode);
    setPreviewResult(null);
    setErrorMsg(null);
  }, [mode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      bfovService.getAiStatus()
        .then(res => res?.status && setAiStatus(res.status))
        .catch(err => console.warn('AI status notice:', err.message));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecute = async () => {
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      if (activeTab === 'generate') {
        const res = await bfovService.generateDiagramFromAi({
          prompt: prompt.trim(),
          diagramType
        });
        if (res?.previewGraph) {
          setPreviewResult(res);
        } else {
          setErrorMsg('Failed to generate diagram from AI.');
        }
      } else {
        const res = await bfovService.editDiagramFromAi({
          diagramId,
          currentGraphData,
          editInstruction: prompt.trim()
        });
        if (res?.previewGraph) {
          setPreviewResult(res);
        } else {
          setErrorMsg('Failed to apply AI edit.');
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (previewResult?.previewGraph) {
      onApplyGraph && onApplyGraph(previewResult.previewGraph, previewResult.diagramType);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-slate-100">BFOV AI Diagramming Copilot</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm font-bold">
            ✕
          </button>
        </div>

        {/* Engine Status Pill */}
        <div className="flex items-center justify-between text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Bot className="w-3.5 h-3.5 text-sky-400" />
            <span>AI Synthesis Engine:</span>
            <span className="font-semibold text-sky-300 font-mono">
              {aiStatus?.activeEngine || 'NATIVE_SYNTHESIS'}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
            Secure Server-Side
          </span>
        </div>

        {/* Tabs: Generate vs Edit */}
        <div className="flex border-b border-slate-800">
          <button
            type="button"
            onClick={() => { setActiveTab('generate'); setPreviewResult(null); }}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'generate' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Generate New Diagram
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('edit'); setPreviewResult(null); }}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'edit' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            AI-Assisted Editing (Current Canvas)
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-3">
          {activeTab === 'generate' ? (
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Target Diagram Type</label>
              <select
                value={diagramType}
                onChange={(e) => setDiagramType(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                <option value="FLOWCHART">Process Flowchart</option>
                <option value="ARCHITECTURE">Cloud & System Architecture</option>
                <option value="ERD">Entity Relationship (ERD)</option>
                <option value="UML">UML Class Hierarchy</option>
                <option value="NETWORK">Distributed Network Topology</option>
              </select>
            </div>
          ) : null}

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              {activeTab === 'generate' ? 'Describe the diagram you want to create:' : 'Describe changes to make to the current canvas:'}
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTab === 'generate'
                  ? 'e.g. Generate an e-commerce order fulfillment pipeline with customer checkout, inventory reservation, payment processing, fraud check decision, and warehouse dispatch...'
                  : 'e.g. Add a verification step: Send email notification before final confirmation, and highlight success flow in green...'
              }
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-sky-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Preview Banner */}
        {previewResult && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {previewResult.changeSummary || `Synthesized: ${previewResult.diagramType}`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded shadow transition-colors"
              >
                <span>Apply to Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[11px] text-slate-400">
              Generated {previewResult.previewGraph?.nodes?.length || 0} nodes and {previewResult.previewGraph?.edges?.length || 0} connectors.
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={loading || !prompt.trim()}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-lg transition-colors shadow"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            <span>{loading ? 'Synthesizing...' : activeTab === 'generate' ? 'Generate Diagram' : 'Apply AI Edit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

