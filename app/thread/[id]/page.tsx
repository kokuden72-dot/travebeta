'use client';

import { useContext, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { UserContext } from '../../../components/UserProvider';
import { getThreadById, getThreadComments, addThreadComment, likeThreadComment, updateThread, deleteThread, deleteThreadComment, storeEventTarget } from '../../../lib/store';
import type { ThreadComment, ThreadItem } from '../../../lib/types';

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useContext(UserContext);
  const threadId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [thread, setThread] = useState<ThreadItem | undefined>(undefined);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');

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

  useEffect(() => {
    const onThread = async () => {
      const threadData = await getThreadById(threadId as string);
      setThread(threadData);
    };
    const onComments = async () => {
      const threadComments = await getThreadComments(threadId as string);
      setComments(threadComments);
    };
    storeEventTarget.addEventListener('threadsUpdated', onThread as EventListener);
    storeEventTarget.addEventListener('threadCommentsUpdated', onComments as EventListener);
    return () => {
      storeEventTarget.removeEventListener('threadsUpdated', onThread as EventListener);
      storeEventTarget.removeEventListener('threadCommentsUpdated', onComments as EventListener);
    };
  }, [threadId]);

  useEffect(() => {
    if (thread) {
      setEditTitle(thread.title);
    }
  }, [thread]);

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
      userId: user?.id ?? 'anonymous',
      userName: user?.name ?? 'ゲスト',
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

  const canEdit = user?.id === thread.userId;

  const startEdit = () => {
    setIsEditing(true);
    setEditTitle(thread.title);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setMessage('編集をキャンセルしました。');
  };

  const saveEdit = async () => {
    const updated = await updateThread(thread.id, { title: editTitle });
    if (updated) {
      setThread(updated);
      setIsEditing(false);
      setMessage('スレッドタイトルを更新しました。');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('本当にこのスレッドを削除しますか？')) return;
    await deleteThread(thread.id);
    router.push('/threads');
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
        {canEdit && !isEditing && (
          <div className="action-row" style={{ gap: 10, marginTop: 12 }}>
            <button type="button" className="secondary" onClick={startEdit}>
              編集
            </button>
            <button type="button" className="danger" onClick={handleDelete}>
              削除
            </button>
          </div>
        )}
        {isEditing && (
          <div className="field-group" style={{ marginTop: 16 }}>
            <label>
              タイトル
              <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
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
                  <div className="action-row" style={{ gap: 8 }}>
                    <button type="button" className="secondary" onClick={() => handleLike(comment.id)}>
                      Good {comment.likes}
                    </button>
                    {canDeleteComment && (
                      <button type="button" className="danger" onClick={async () => {
                        if (!window.confirm('本当にこのコメントを削除しますか？')) return;
                        await deleteThreadComment(comment.id);
                        setComments((prev) => prev.filter((item) => item.id !== comment.id));
                        setMessage('コメントを削除しました。');
                      }}>
                        削除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {comments.length === 0 && <p>コメントはまだありません。</p>}
        </div>
      </section>
    </main>
  );
}
