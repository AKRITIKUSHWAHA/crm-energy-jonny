import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Edit2,
  Trash2,
  CornerDownRight,
  User,
  Clock,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { Badge, Button, Input } from '../../../components/ui';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../services/apiClient';

export const ContextCommentPanel = ({
  recordType = 'TASK',
  recordId,
  recordTitle = '',
  onClose,
}) => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [newContent, setNewContent] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const fetchComments = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/rd/collaboration/comments', {
        recordType,
        recordId,
      });
      if (res.success && Array.isArray(res.data)) {
        setComments(res.data);
      }
    } catch (err) {
      console.error('[ContextCommentPanel] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [recordType, recordId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async (parentId = null) => {
    const text = parentId ? replyContent : newContent;
    if (!text || !text.trim()) return;

    try {
      const res = await apiClient.post('/rd/collaboration/comments', {
        recordType,
        recordId,
        content: text.trim(),
        parentCommentId: parentId || null,
        recordTitle,
      });

      if (res.success) {
        addToast({
          title: 'Comment Posted',
          message: 'Your discussion comment has been saved.',
          type: 'success',
        });
        if (parentId) {
          setReplyContent('');
          setReplyingToId(null);
        } else {
          setNewContent('');
        }
        fetchComments();
      }
    } catch (err) {
      addToast({
        title: 'Error Posting Comment',
        message: err.message || 'Failed to post comment.',
        type: 'error',
      });
    }
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent || !editContent.trim()) return;

    try {
      const res = await apiClient.put(`/rd/collaboration/comments/${commentId}`, {
        content: editContent.trim(),
      });
      if (res.success) {
        addToast({ title: 'Comment Updated', message: 'Edit saved.', type: 'success' });
        setEditingId(null);
        setEditContent('');
        fetchComments();
      }
    } catch (err) {
      addToast({ title: 'Edit Failed', message: err.message, type: 'error' });
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to remove this comment?')) return;
    try {
      const res = await apiClient.delete(`/rd/collaboration/comments/${commentId}`);
      if (res.success) {
        addToast({ title: 'Comment Removed', message: 'Comment has been deleted.', type: 'info' });
        fetchComments();
      }
    } catch (err) {
      addToast({ title: 'Delete Failed', message: err.message, type: 'error' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-secondary, rgba(248, 250, 252, 0.5))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={16} color="var(--primary)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Contextual Discussions ({comments.length})
          </span>
          <Badge variant="primary" size="sm">{recordType}</Badge>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Comments List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Loading discussion thread...
          </div>
        ) : comments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            border: '1px dashed var(--border)',
            borderRadius: '10px',
            color: 'var(--text-secondary)',
            fontSize: '12px'
          }}>
            No comments yet on this {recordType.toLowerCase()}. Be the first to start the discussion!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '0.75rem',
                backgroundColor: comment.isDeleted ? 'var(--surface-secondary)' : 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              {/* Author Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    {comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {comment.author?.name || 'Anonymous Researcher'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    • {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {comment.isEdited && (
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      (edited)
                    </span>
                  )}
                </div>

                {/* Actions for comment owner */}
                {!comment.isDeleted && comment.authorId === crmUser?.id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2 }}
                      title="Edit Comment"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', padding: 2 }}
                      title="Delete Comment"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Comment Content */}
              {editingId === comment.id ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--primary)',
                      fontSize: '12px',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <Button size="sm" variant="primary" onClick={() => handleSaveEdit(comment.id)}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              ) : (
                <div style={{
                  fontSize: '12px',
                  color: comment.isDeleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                  fontStyle: comment.isDeleted ? 'italic' : 'normal',
                  lineHeight: '1.4'
                }}>
                  {comment.content}
                </div>
              )}

              {/* Reply Button */}
              {!comment.isDeleted && (
                <div style={{ marginTop: 2 }}>
                  <button
                    onClick={() => {
                      setReplyingToId(replyingToId === comment.id ? null : comment.id);
                      setReplyContent('');
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0
                    }}
                  >
                    <CornerDownRight size={11} /> Reply
                  </button>
                </div>
              )}

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: '1.25rem', marginTop: 4, borderLeft: '2px solid var(--border)', paddingLeft: '0.75rem' }}>
                  {comment.replies.map((reply) => (
                    <div key={reply.id} style={{ fontSize: '11px', color: 'var(--text-primary)', background: 'var(--surface-secondary, rgba(248, 250, 252, 0.4))', padding: '6px 8px', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, marginBottom: 2 }}>
                        <span>{reply.author?.name || 'Researcher'}</span>
                        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 400 }}>
                          • {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>{reply.content}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input Box */}
              {replyingToId === comment.id && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6, marginLeft: '1.25rem' }}>
                  <input
                    type="text"
                    placeholder="Write a reply... (@mention teammate)"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment(comment.id)}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '11px',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <Button size="sm" variant="primary" onClick={() => handlePostComment(comment.id)}>Reply</Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Main Comment Input */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder={`Add a contextual note or comment (@mention to notify)...`}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontSize: '12px',
            background: 'var(--surface)',
            color: 'var(--text-primary)'
          }}
        />
        <Button
          size="sm"
          variant="primary"
          icon={Send}
          onClick={() => handlePostComment()}
          disabled={!newContent.trim()}
        >
          Post
        </Button>
      </div>
    </div>
  );
};

