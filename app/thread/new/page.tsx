'use client';

import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { UserContext } from '../../../components/UserProvider';
import { addThread } from '../../../lib/store';

export default function NewThreadPage() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setError('ログインしてからスレッドを投稿してください。');
      return;
    }
    if (!title.trim()) {
      setError('スレッド名を入力してください。');
      return;
    }

    const thread = await addThread({
      userId: user.id,
      userName: user.name,
      title: title.trim(),
    });
    router.push(`/thread/${thread.id}`);
  };

  return (
    <main className="page-container">
      <Header />
      <section className="card">
        <h2 className="section-title">スレッド新規投稿</h2>
        <form onSubmit={submit} className="field-group">
          <label>
            スレッド名
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          {error && <div className="small-text" style={{ color: '#c33' }}>{error}</div>}
          <div className="action-row">
            <button type="submit">作成する</button>
          </div>
        </form>
      </section>
    </main>
  );
}
