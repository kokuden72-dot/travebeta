'use client';

import dynamic from 'next/dynamic';
import { useContext, useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import { SettingsContext } from '../../components/SettingsProvider';
import { UserContext } from '../../components/UserProvider';
import { addIdea, loadIdeas, storeEventTarget } from '../../lib/store';
import { ICON_OPTIONS, DEFAULT_ICON } from '../../lib/icons';
import type { Idea } from '../../lib/types';

const MapSection = dynamic(() => import('../../components/MapSection'), { ssr: false });

export default function OverviewPage() {
  const { settings } = useContext(SettingsContext);
  const { user } = useContext(UserContext);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [message, setMessage] = useState('地図上をクリックするとアイデア投稿ができます。');
  const [pendingLocation, setPendingLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pendingPosName, setPendingPosName] = useState('');
  const [pendingMainTxt, setPendingMainTxt] = useState('');
  const [pendingTagsText, setPendingTagsText] = useState('');
  const [pendingColor, setPendingColor] = useState('#3388ff');
  const [pendingIcon, setPendingIcon] = useState<string>(DEFAULT_ICON);

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
    setPendingLocation({ latitude, longitude });
    setPendingPosName('');
    setPendingMainTxt('');
    setPendingTagsText('');
    setPendingColor('#3388ff');
    setPendingIcon(DEFAULT_ICON);
    setMessage(user ? '投稿内容を入力して保存してください。' : 'ログインすると投稿できます。');
  };

  const cancelPending = () => {
    setPendingLocation(null);
    setMessage('地図上をクリックするとアイデア投稿ができます。');
  };

  const submitPendingIdea = async () => {
    if (!pendingLocation) return;
    if (!pendingPosName.trim() || !pendingMainTxt.trim()) {
      setMessage('場所名と内容は必須です。');
      return;
    }

    const tags = pendingTagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (!user) {
      setMessage('ログインしてから投稿してください。');
      return;
    }

    const newIdea = await addIdea({
      userId: user.id,
      userName: user.name,
      posName: pendingPosName.trim(),
      mainTxt: pendingMainTxt.trim(),
      tags,
      color: pendingColor,
      icon: pendingIcon,
      latitude: pendingLocation.latitude,
      longitude: pendingLocation.longitude,
    });

    setIdeas((prev) => [newIdea, ...prev]);
    setPendingLocation(null);
    setMessage('アイデアを保存しました。');
  };

  return (
    <main className="page-container">
      <Header />
      <div className="overview-grid">
        <section className="card">
          <p className="small-text">{message}</p>
          {pendingLocation && (
            <div className="field-group" style={{ marginBottom: 18 }}>
              <h3 className="section-title">新しいアイデアを投稿</h3>
              <p className="small-text">
                クリック位置: {pendingLocation.latitude.toFixed(5)}, {pendingLocation.longitude.toFixed(5)}
              </p>
              <label>
                場所名
                <input value={pendingPosName} onChange={(event) => setPendingPosName(event.target.value)} />
              </label>
              <label>
                内容
                <textarea value={pendingMainTxt} onChange={(event) => setPendingMainTxt(event.target.value)} />
              </label>
              <label>
                タグ (3個まで、カンマ区切り)
                <input value={pendingTagsText} onChange={(event) => setPendingTagsText(event.target.value)} />
              </label>
              <label>
                ピンの色
                <input type="color" value={pendingColor} onChange={(event) => setPendingColor(event.target.value)} />
              </label>
              <label>
                ピンのアイコン
                <select value={pendingIcon} onChange={(e) => setPendingIcon(e.target.value)}>
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt.split('/').pop()}</option>
                  ))}
                </select>
                <div style={{ marginTop: 8 }}>
                  <img src={pendingIcon} alt="icon preview" style={{ width: 28, height: 28 }} />
                </div>
              </label>
              <div className="action-row">
                <button type="button" className="secondary" onClick={cancelPending}>
                  キャンセル
                </button>
                <button type="button" onClick={submitPendingIdea}>
                  保存する
                </button>
              </div>
            </div>
          )}
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
