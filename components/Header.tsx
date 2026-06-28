'use client';

import Link from 'next/link';
import { useContext, useState } from 'react';
import { SettingsContext } from './SettingsProvider';
import { UserContext } from './UserProvider';

export default function Header() {
  const { settings } = useContext(SettingsContext);
  const { user, signInWithEmail, signOut } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      setMessage('メールアドレスを入力してください。');
      return;
    }
    await signInWithEmail(email.trim());
    setMessage('確認メールを送信しました。メールを確認してください。');
  };

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
          <div className="login-input-group">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="メールアドレス"
              className="login-input"
            />
            <button type="button" onClick={handleEmailSignIn}>
              メールでログイン
            </button>
            {message && <div className="small-text" style={{ marginTop: 8 }}>{message}</div>}
          </div>
        )}
      </div>
    </header>
  );
}
