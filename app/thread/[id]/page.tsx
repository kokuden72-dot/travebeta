'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../components/Header';
import { getThreadById, getThreadComments, addThreadComment, likeThreadComment } from '../../../lib/store';
import type { ThreadComment, ThreadItem } from '../../../lib/types';

export default function ThreadDetailPage() {
  const params = useParams();
  const threadId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [thread, setThread] = useState<ThreadItem | undefined>(undefined);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!threadId) return;
    const load = async () => {
      const threadData = await getThreadById(threadId);
      const threadComments = await getThreadComments(threadId);
      setThread(threadData);
      setComments(threadComments);
    };
    load();
  }, [threadId]);

  if (!thread) {
    return (
      <main className="page-container">
        <Header />
        <section className="card">
          <h2 className="section-title">スレッドが見つかりません</h2>
          <p>存在しないスレッドIDです。</p>
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
    const newComment = await addThreadComment({
      threadId: thread.id,
      userId: 'anonymous',
      userName: 'ゲスト',
      comTxt: commentText.trim(),
    });
    setComments((prev) => [newComment, ...prev]);
    setCommentText('');
    setMessage('コメントを追加しました。');
  };

  const handleLike = async (commentId: string) => {
    await likeThreadComment(commentId);
    setComments((prev) => prev.map((comment) => comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment));
  };

  return (
    <main className="page-container">
      <Header />
      <section className="card">
        <div className="section-row">
          <h2 className="section-title">{thread.title}</h2>
          <span className="status-pill">作成者: {thread.userName}</span>
        </div>
        <p className="small-text">{new Date(thread.createdAt).toLocaleString()}</p>
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
              <div className="action-row" style={{ justifyContent: 'space-between' }}>
                <span className="small-text">{new Date(comment.createdAt).toLocaleString()}</span>
                <button type="button" className="secondary" onClick={() => handleLike(comment.id)}>
                  Good {comment.likes}
                </button>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p>コメントはまだありません。</p>}
        </div>
      </section>
    </main>
  );
}
