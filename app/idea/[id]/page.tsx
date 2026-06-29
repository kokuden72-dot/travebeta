'use client';

import { useContext, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { UserContext } from '../../../components/UserProvider';
import { getIdeaById, getIdeaComments, addIdeaComment, likeIdea, updateIdea, deleteIdea, deleteIdeaComment, storeEventTarget } from '../../../lib/store';
import { ICON_OPTIONS } from '../../../lib/icons';
import type { Idea, IdeaComment } from '../../../lib/types';

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useContext(UserContext);
  const ideaId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [idea, setIdea] = useState<Idea | undefined>(undefined);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editPosName, setEditPosName] = useState('');
  const [editMainTxt, setEditMainTxt] = useState('');
  const [editTagsText, setEditTagsText] = useState('');
  const [editColor, setEditColor] = useState('#3388ff');
  const [editIcon, setEditIcon] = useState<string | undefined>(undefined);
  const [iconOptions, setIconOptions] = useState<Array<{ filename: string; label: string; r: number; g: number; b: number; path: string }>>([]);
  const [iconDropdownOpen, setIconDropdownOpen] = useState(false);

  useEffect(() => {
    if (!ideaId) return;
    const load = async () => {
      const ideaData = await getIdeaById(ideaId);
      const ideaComments = await getIdeaComments(ideaId);
      setIdea(ideaData);
      setComments(ideaComments);
    };
    load();
  }, [ideaId]);

  useEffect(() => {
    const onIdeas = async () => {
      const ideaData = await getIdeaById(ideaId as string);
      setIdea(ideaData);
    };
    const onComments = async () => {
      const ideaComments = await getIdeaComments(ideaId as string);
      setComments(ideaComments);
    };
    storeEventTarget.addEventListener('ideasUpdated', onIdeas as EventListener);
    storeEventTarget.addEventListener('ideaCommentsUpdated', onComments as EventListener);
    return () => {
      storeEventTarget.removeEventListener('ideasUpdated', onIdeas as EventListener);
      storeEventTarget.removeEventListener('ideaCommentsUpdated', onComments as EventListener);
    };
  }, [ideaId]);

  useEffect(() => {
    if (!idea) return;
    setEditPosName(idea.posName);
    setEditMainTxt(idea.mainTxt);
    setEditTagsText(idea.tags.join(', '));
    setEditColor(idea.color || '#3388ff');
    setEditIcon(idea.icon);
  }, [idea]);

  useEffect(() => {
    const loadCsv = async () => {
      try {
        const res = await fetch('/materials/icon/icons.csv');
        if (!res.ok) return;
        const text = await res.text();
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        const parsed: Array<any> = [];
        // assume header present
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim());
          if (parts.length >= 5) {
            const [filename, label, r, g, b] = parts;
            parsed.push({ filename, label, r: Number(r), g: Number(g), b: Number(b), path: `/materials/icon/${filename}` });
          }
        }
        setIconOptions(parsed);
      } catch (e) {
        console.error('icons.csv load failed', e);
      }
    };
    loadCsv();
  }, []);

  if (!idea) {
    return (
      <main className="page-container">
        <Header />
        <section className="card">
          <h2 className="section-title">アイデアが見つかりません</h2>
          <p>存在しないアイデアIDです。</p>
        </section>
      </main>
    );
  }

  const sendComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentText.trim()) {
      setMessage('コメントを入力してください。');
      return;
    }
    const newComment = await addIdeaComment({
      ideaId: idea.id,
      userId: user?.id ?? 'anonymous',
      userName: user?.name ?? 'ゲスト',
      comTxt: commentText.trim(),
    });
    setComments((prev) => [newComment, ...prev]);
    setCommentText('');
    setMessage('コメントを追加しました。');
  };

  const handleLike = async () => {
    if (!idea) return;
    await likeIdea(idea.id);
    setIdea((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : prev));
    setMessage('いいねしました。');
  };

  const canEdit = user?.id === idea.userId;

  const startEdit = () => {
    setIsEditing(true);
    setEditPosName(idea.posName);
    setEditMainTxt(idea.mainTxt);
    setEditTagsText(idea.tags.join(', '));
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setMessage('編集をキャンセルしました。');
  };

  const saveEdit = async () => {
    const tags = editTagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 3);
    const updated = await updateIdea(idea.id, {
      posName: editPosName,
      mainTxt: editMainTxt,
      tags,
      color: editColor,
      icon: editIcon,
    });
    if (updated) {
      setIdea(updated);
      setMessage('アイデアを更新しました。');
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('本当にこのアイデアを削除しますか？')) return;
    await deleteIdea(idea.id);
    router.push('/overview');
  };

  return (
    <main className="page-container">
      <Header />
      <section className="card">
        <div className="section-row">
          <h2 className="section-title">{idea.posName}</h2>
          <span className="status-pill">いいね {idea.likes}</span>
        </div>
        <p className="small-text">投稿者: {idea.userName}</p>
        {canEdit && !isEditing && (
          <div className="action-row" style={{ gap: 10, marginBottom: 16 }}>
            <button type="button" className="secondary" onClick={startEdit}>
              編集
            </button>
            <button type="button" className="danger" onClick={handleDelete}>
              削除
            </button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          {idea.icon ? (
            <img src={idea.icon} alt="icon" style={{ width: 16, height: 16 }} />
          ) : (
            <span style={{ width: 16, height: 16, borderRadius: '50%', background: idea.color, border: '1px solid rgba(0,0,0,0.12)' }} />
          )}
          <span className="small-text">ピンの色: {idea.color}</span>
        </div>
        {isEditing ? (
          <div className="field-group">
            <label>
              アイデア名
              <input value={editPosName} onChange={(event) => setEditPosName(event.target.value)} />
            </label>
            <label>
              内容
              <textarea value={editMainTxt} onChange={(event) => setEditMainTxt(event.target.value)} />
            </label>
            <label>
              タグ (3個まで、カンマ区切り)
              <input value={editTagsText} onChange={(event) => setEditTagsText(event.target.value)} />
            </label>
            <label>
              ピンの色
              <input type="color" value={editColor} onChange={(event) => setEditColor(event.target.value)} />
            </label>
            <label>
              ピンのアイコン
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button type="button" className="secondary" onClick={() => setIconDropdownOpen((s) => !s)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {editIcon ? <img src={editIcon} alt="icon" style={{ width: 20, height: 20 }} /> : <span style={{ width: 20, height: 20, display: 'inline-block' }} />}
                  <span>{editIcon ? editIcon.split('/').pop() : '(なし)'}</span>
                </button>
                {iconDropdownOpen && (
                  <div style={{ position: 'absolute', zIndex: 30, background: '#fff', border: '1px solid #ddd', marginTop: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
                    <div style={{ padding: 6 }}>
                      <button type="button" onClick={() => { setEditIcon(undefined); setIconDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', background: 'transparent', border: 'none' }}>（なし）</button>
                      {iconOptions.map((opt) => (
                        <button key={opt.filename} type="button" onClick={() => { setEditIcon(opt.path); setIconDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                          <span style={{ width: 18, height: 18, borderRadius: 4, background: `rgb(${opt.r}, ${opt.g}, ${opt.b})`, display: 'inline-block', border: '1px solid rgba(0,0,0,0.08)' }} />
                          <img src={opt.path} alt={opt.label} style={{ width: 18, height: 18 }} />
                          <span style={{ marginLeft: 8 }}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                {editIcon ? <img src={editIcon} alt="icon preview" style={{ width: 28, height: 28 }} /> : null}
              </div>
            </label>
            <label>
              ピンの色
              <input type="color" value={editColor} onChange={(event) => setEditColor(event.target.value)} />
            </label>
            <div className="action-row">
              <button type="button" className="secondary" onClick={cancelEdit}>
                キャンセル
              </button>
              <button type="button" onClick={saveEdit}>
                保存
              </button>
            </div>
          </div>
        ) : (
          <>
            <p>{idea.mainTxt}</p>
            <div className="tag-list">
              {idea.tags.map((tag) => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
            <div className="action-row" style={{ marginTop: 18 }}>
              <button type="button" onClick={handleLike}>
                Good
              </button>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h3 className="section-title">コメント</h3>
        <form onSubmit={sendComment} className="field-group">
          <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="コメントを入力" />
          <div className="action-row">
            <button type="submit">投稿</button>
          </div>
        </form>
        {message && <p className="small-text">{message}</p>}
        <div className="comment-box">
          {comments.map((comment) => {
            const canDeleteComment = user?.id === comment.userId;
            return (
              <div key={comment.id} className="comment-item">
                <strong>{comment.userName}</strong>
                <p>{comment.comTxt}</p>
                <div className="action-row" style={{ justifyContent: 'space-between', gap: 8 }}>
                  <span className="small-text">{new Date(comment.createdAt).toLocaleString()}</span>
                  {canDeleteComment && (
                    <button type="button" className="danger" onClick={async () => {
                      if (!window.confirm('本当にこのコメントを削除しますか？')) return;
                      try {
                        await deleteIdeaComment(comment.id);
                        setComments((prev) => prev.filter((item) => item.id !== comment.id));
                        setMessage('コメントを削除しました。');
                      } catch (error) {
                        console.error('コメント削除に失敗しました:', error);
                        setMessage('コメントの削除中にエラーが発生しました。');
                      }
                    }}>
                      削除
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
