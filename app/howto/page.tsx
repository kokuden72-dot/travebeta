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
            <li>---操作方法---</li>
            <li>気になるところ・行きたいところをクリック・タップしてピンを打とう</li>
            <li>名前とコメントを入力して、アイデアを共有できるよ</li>
            <li>「スレッド一覧」でトピックを作成・閲覧し、コメントを投稿できます。</li>
            <li>「設定」では表示モード・テーマなどを変更できます。まだ機能しません(・A・)。気が向いたら作るね（笑）</li>
            <li>ページ右上の「使い方」はいつでもこのヘルプを開きます。</li>

            <li>---注意事項---</li>
            <li>このアプリは仮免明け14連勤中の死にかけが作ったアプリです。利用は自己責任でお願いします。</li>
            <li>バグ取り追いついてません。少なくとも２桁はあります。</li>
            <li>ダークテーマ超見づらいです。非推奨。</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
