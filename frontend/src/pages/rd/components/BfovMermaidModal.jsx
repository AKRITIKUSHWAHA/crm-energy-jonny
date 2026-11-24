import React, { useState } from 'react';
import { FileCode, AlertCircle, CheckCircle2, Play, ArrowRight } from 'lucide-react';
import { bfovService } from '../../../services/bfovService';

const SAMPLE_MERMAID = `flowchart TD
  A([Start Workflow]) --> B[/Read Specifications/]
  B --> C[Execute Synthesis]
  C --> D{Quality Check?}
  D -->|Pass| E[(Save Database)]
  D -->|Fail| F[Rework & Calibrate]
  F --> C
  E --> G([Release Product])`;

export const BfovMermaidModal = ({ isOpen, onClose, onImportToCanvas }) => {
  const [code, setCode] = useState(SAMPLE_MERMAID);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleValidate = async () => {
    try {
      setIsValidating(true);
      setErrorMsg(null);
      const res = await bfovService.parseMermaid(code);
      if (res?.isValid) {
        setValidationResult(res);
      } else {
        setErrorMsg(res?.errors?.[0]?.message || 'Invalid Mermaid syntax.');
        setValidationResult(null);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.errors?.[0]?.message || err.message);
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleApply = () => {
    if (validationResult && validationResult.graphData) {
      onImportToCanvas && onImportToCanvas(validationResult.graphData, validationResult.diagramType);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-semibold text-slate-100">Import Mermaid Diagram</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm font-bold">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Paste your Mermaid DSL code below. Supported types: <strong>flowchart</strong>, <strong>sequenceDiagram</strong>, <strong>classDiagram</strong>, <strong>erDiagram</strong>, and <strong>stateDiagram</strong>.
        </p>

        {/* Code Editor Area */}
        <div className="relative">
          <textarea
            rows={10}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setValidationResult(null);
              setErrorMsg(null);
            }}
            placeholder="flowchart TD..."
            className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-sky-500 outline-none resize-none"
          />
        </div>

        {/* Validation Status Banner */}
        {errorMsg && (
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Syntax Validation Error</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {validationResult && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                Parsed successfully: <strong>{validationResult.diagramType}</strong> ({validationResult.nodeCount} nodes, {validationResult.edgeCount} connectors)
              </span>
            </div>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded shadow transition-colors"
            >
              <span>Import to Canvas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setCode(SAMPLE_MERMAID)}
            className="text-xs text-slate-500 hover:text-slate-300 underline"
          >
            Load Sample Flowchart
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleValidate}
              disabled={isValidating}
              className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isValidating ? 'Validating...' : 'Validate & Parse'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

