'use client';

import dynamic from 'next/dynamic';
import { useContext, useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import { SettingsContext } from '../../components/SettingsProvider';
import { UserContext } from '../../components/UserProvider';
import { addIdea, loadIdeas, storeEventTarget } from '../../lib/store';
import type { Idea } from '../../lib/types';

const MapSection = dynamic(() => import('../../components/MapSection'), { ssr: false });

export default function OverviewPage() {
  const { settings } = useContext(SettingsContext);
  const { user } = useContext(UserContext);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [message, setMessage] = useState('地図上をクリックするとアイデア投稿ができます。');

  useEffect(() => {
    const load = async () => {
      const loadedIdeas = await loadIdeas();
      setIdeas(loadedIdeas);
    };
    load();
  }, []);

  useEffect(() => {
    const onUpdate = async () => {
      const loadedIdeas = await loadIdeas();
      setIdeas(loadedIdeas);
    };
    storeEventTarget.addEventListener('ideasUpdated', onUpdate as EventListener);
    return () => storeEventTarget.removeEventListener('ideasUpdated', onUpdate as EventListener);
  }, []);

  const sortedIdeas = useMemo(() => [...ideas].sort((a, b) => b.likes - a.likes), [ideas]);

  const handleMapClick = async (latitude: number, longitude: number) => {
    if (!user) {
      setMessage('ログインしてから投稿してください。');
      return;
    }

    const posName = window.prompt('場所の名前を入力してください', '');
    if (!posName) {
      return;
    }
    const mainTxt = window.prompt('内容を入力してください', '');
    if (!mainTxt) {
      return;
    }
    const tagsText = window.prompt('タグを3つまでカンマ区切りで入力してください', '');
    const tags = tagsText ? tagsText.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 3) : [];
    const newIdea = await addIdea({
      userId: user.id,
      userName: user.name,
      posName,
      mainTxt,
      tags,
      latitude,
      longitude,
    });

    setIdeas((prev) => [newIdea, ...prev]);
    setMessage('アイデアを保存しました。');
  };

  return (
    <main className="page-container">
      <Header />
      <div className="overview-grid">
        <section className="card">
          <p className="small-text">{message}</p>
          <div className="map-card">
            <MapSection ideas={ideas} onMapClick={handleMapClick} />
          </div>
        </section>
        <section className="card">
          <div className="section-row">
            <h2 className="section-title">人気アイデア</h2>
            <span className="status-pill">{ideas.length} 件</span>
          </div>
          <div className="list-grid">
            {sortedIdeas.map((idea) => (
              <article key={idea.id} className="card">
                <h3>{idea.posName}</h3>
                <p className="small-text">投稿者: {idea.userName}</p>
                <p>{idea.mainTxt.slice(0, 80)}{idea.mainTxt.length > 80 ? '...' : ''}</p>
                <div className="tag-list">
                  {idea.tags.map((tag) => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>
                <div className="action-row" style={{ marginTop: 10 }}>
                  <span className="status-pill">いいね {idea.likes}</span>
                  <a className="nav-link" href={`/idea/${idea.id}`}>
                    詳細を見る
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
