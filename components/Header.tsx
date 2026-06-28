'use client';

import Link from 'next/link';
import { useContext } from 'react';
import { SettingsContext } from './SettingsProvider';
import { UserContext } from './UserProvider';

export default function Header() {
  const { settings } = useContext(SettingsContext);
  const { user, signInWithGoogle, signOut } = useContext(UserContext);

  return (
    <header className="app-header page-container">
      <div>
        <div className="app-title">TraveAgent</div>
        <div className="small-text">{settings.theme === 'dark' ? 'ダークテーマ' : 'ライトテーマ'} / {settings.displayMode === 'desktop' ? 'PC版' : 'スマホ版'}</div>
      </div>
      <nav className="nav-links">
        <Link className="nav-link" href="/overview">
          Overview
        </Link>
        <Link className="nav-link" href="/idea/new">
          新規アイデア
        </Link>
        <Link className="nav-link" href="/threads">
          スレッド一覧
        </Link>
        <Link className="nav-link" href="/setting">
          設定
        </Link>
        <Link className="nav-link" href="/howto">
          使い方
        </Link>
      </nav>
      <div className="action-row">
        <div className="status-pill">
          {user ? `${user.name} さんでログイン中` : '未ログイン'}
        </div>
        {user ? (
          <button className="secondary" type="button" onClick={signOut}>
            ログアウト
          </button>
        ) : (
          <button type="button" onClick={signInWithGoogle}>
            Googleでログイン
          </button>
        )}
      </div>
    </header>
  );
}
