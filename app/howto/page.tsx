'use client';

import Header from '../../components/Header';
import { SettingsContext } from '../../components/SettingsProvider';
import { UserContext } from '../../components/UserProvider';
import { useContext } from 'react';

export default function HowToPage() {
  const { settings } = useContext(SettingsContext);
  const { user } = useContext(UserContext);

  return (
    <main className="page-container">
      <Header />
      <section className="card">
        <div className="section-row">
          <h2 className="section-title">使い方</h2>
          <span className="status-pill">{user ? `${user.name} さんでログイン中` : '未ログイン'}</span>
        </div>
        <div className="field-group">
          <p>このアプリでは、以下のように操作します。</p>
          <ol>
            <li>まず画面上部の「Googleでログイン」からログインします。</li>
            <li>次に「新規アイデア」から地図上の場所を追加できます。</li>
            <li>「スレッド一覧」でトピックを作成・閲覧し、コメントを投稿できます。</li>
            <li>「設定」では表示モード・テーマなどを変更できます。</li>
            <li>ページ右上の「使い方」はいつでもこのヘルプを開きます。</li>
          </ol>
          <p>サインイン後は投稿やコメントが Supabase に保存され、他のユーザーとも共有されます。</p>
        </div>
      </section>
    </main>
  );
}
