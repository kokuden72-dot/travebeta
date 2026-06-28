'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { loadThreads, storeEventTarget } from '../../lib/store';
import type { ThreadItem } from '../../lib/types';

export default function ThreadsPage() {
  const [threads, setThreads] = useState<ThreadItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const loadedThreads = await loadThreads();
      setThreads(loadedThreads);
    };
    load();
  }, []);

  useEffect(() => {
    const onUpdate = async () => {
      const loadedThreads = await loadThreads();
      setThreads(loadedThreads);
    };
    storeEventTarget.addEventListener('threadsUpdated', onUpdate as EventListener);
    return () => storeEventTarget.removeEventListener('threadsUpdated', onUpdate as EventListener);
  }, []);

  const sortedThreads = useMemo(
    () => [...threads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [threads],
  );

  return (
    <main className="page-container">
      <Header />
      <section className="card">
        <div className="section-row">
          <h2 className="section-title">スレッド一覧</h2>
          <Link className="nav-link" href="/thread/new">
            新規スレッド作成
          </Link>
        </div>
        <div className="list-grid">
          {sortedThreads.map((thread) => (
            <article key={thread.id} className="card">
              <h3>{thread.title}</h3>
              <p className="small-text">作成者: {thread.userName}</p>
              <p className="small-text">{new Date(thread.createdAt).toLocaleString()}</p>
              <Link className="nav-link" href={`/thread/${thread.id}`}>
                詳細を見る
              </Link>
            </article>
          ))}
          {sortedThreads.length === 0 && <p>まだスレッドがありません。</p>}
        </div>
      </section>
    </main>
  );
}
