import React, { useState, useEffect } from 'react';
import { Users, UserPlus, MessageSquare, Trash2, CheckCircle2, Shield, Send } from 'lucide-react';
import { bfovService } from '../../../services/bfovService';

export const BfovShareModal = ({ isOpen, diagramId, onClose }) => {
  const [activeTab, setActiveTab] = useState('shares'); // 'shares' | 'comments'
  const [shares, setShares] = useState([]);
  const [comments, setComments] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('EDITOR');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen && diagramId) {
      loadData();
    }
  }, [isOpen, diagramId]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [sharesRes, commentsRes] = await Promise.all([
        bfovService.listShares(diagramId),
        bfovService.listComments(diagramId)
      ]);
      if (sharesRes?.shares) setShares(sharesRes.shares);
      if (commentsRes?.comments) setComments(commentsRes.comments);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleAddShare = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      await bfovService.addShare(diagramId, {
        sharedWithEmail: newEmail.trim(),
        role: newRole
      });
      setNewEmail('');
      loadData();
    } catch (e) {
      setErrorMsg(e.response?.data?.error || e.message);
    }
  };

  const handleRemoveShare = async (shareId) => {
    try {
      await bfovService.removeShare(shareId);
      loadData();
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await bfovService.addComment(diagramId, { content: newComment.trim() });
      setNewComment('');
      loadData();
    } catch (e) {
      setErrorMsg(e.response?.data?.error || e.message);
    }
  };

  const handleResolveComment = async (commentId, isResolved) => {
    try {
      await bfovService.resolveComment(commentId, isResolved);
      loadData();
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-semibold text-slate-100">Collaboration & Access</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm font-bold">
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('shares')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'shares' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Access Permissions ({shares.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'comments' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Discussion & Comments ({comments.length})
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Shares Tab */}
        {activeTab === 'shares' && (
          <div className="space-y-4">
            <form onSubmit={handleAddShare} className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="collaborator@tenant.com"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-sky-500 outline-none"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
              <button
                type="submit"
                className="flex items-center space-x-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            </form>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {shares.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No explicit collaborators added yet. Only tenant project members can access.
                </div>
              ) : (
                shares.map((s) => (
                  <div key={s.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-200 block">{s.sharedWithEmail || s.sharedWithUser?.email}</span>
                      <span className="text-[10px] text-slate-500">Role: {s.role}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveShare(s.id)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="Remove access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-3">
            <div className="max-h-56 overflow-y-auto space-y-2">
              {comments.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No comments yet. Start a discussion on this architecture diagram!
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      c.isResolved ? 'bg-slate-950/30 border-slate-800/50 opacity-60' : 'bg-slate-950/70 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sky-400">{c.author?.name || 'Architect'}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleTimeString()}</span>
                        <button
                          type="button"
                          onClick={() => handleResolveComment(c.id, !c.isResolved)}
                          title={c.isResolved ? 'Re-open' : 'Mark Resolved'}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            c.isResolved ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {c.isResolved ? 'Resolved' : 'Resolve'}
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 text-xs">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post architecture feedback or review note..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-sky-500 outline-none"
              />
              <button
                type="submit"
                className="flex items-center space-x-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

