'use client';

import { useContext } from 'react';
import Header from '../../components/Header';
import { SettingsContext } from '../../components/SettingsProvider';
import { UserContext } from '../../components/UserProvider';

export default function SettingPage() {
  const { settings, setName, setTheme, setDisplayMode } = useContext(SettingsContext);
  const { user } = useContext(UserContext);

  return (
    <main className="page-container">
      <Header />
      <section className="card">
        <h2 className="section-title">設定</h2>
        <div className="field-group">
          <label>
            表示名
            <input
              type="text"
              value={settings.name}
              onChange={(event) => setName(event.target.value)}
              placeholder={user?.name || '旅人'}
            />
          </label>
          <label>
            テーマ
            <select value={settings.theme} onChange={(event) => setTheme(event.target.value as 'light' | 'dark')}>
              <option value="light">ライトテーマ</option>
              <option value="dark">ダークテーマ</option>
            </select>
          </label>
          <label>
            表示モード
            <select value={settings.displayMode} onChange={(event) => setDisplayMode(event.target.value as 'desktop' | 'mobile')}>
              <option value="desktop">PC版</option>
              <option value="mobile">スマホ版</option>
            </select>
          </label>
        </div>
        <p className="footer-note">設定はローカルに保存され、全ページに適用されます。</p>
      </section>
    </main>
  );
}
