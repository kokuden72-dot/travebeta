'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../components/Header';
import { getIdeaById, getIdeaComments, addIdeaComment, likeIdea } from '../../../lib/store';
import type { Idea, IdeaComment } from '../../../lib/types';

export default function IdeaDetailPage() {
  const params = useParams();
  const ideaId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [idea, setIdea] = useState<Idea | undefined>(undefined);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [message, setMessage] = useState('');

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
      userId: 'anonymous',
      userName: 'ゲスト',
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

  return (
    <main className="page-container">
      <Header />
      <section className="card">
        <div className="section-row">
          <h2 className="section-title">{idea.posName}</h2>
          <span className="status-pill">いいね {idea.likes}</span>
        </div>
        <p className="small-text">投稿者: {idea.userName}</p>
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
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <strong>{comment.userName}</strong>
              <p>{comment.comTxt}</p>
              <span className="small-text">{new Date(comment.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
