'use client';


import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { UserContext } from '../../../components/UserProvider';
import { addIdea } from '../../../lib/store';

const parseTags = (text: string) =>
  text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 3);

export default function NewIdeaPage() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [posName, setPosName] = useState('');
  const [mainTxt, setMainTxt] = useState('');
  const [tagsText1, setTagsText1] = useState('');
  const [tagsText2, setTagsText2] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setError('ログインしてから投稿してください。');
      return;
    }
    if (!posName.trim() || !mainTxt.trim()) {
      setError('場所名と内容は必須です。');
      return;
    }

    const tags = [...parseTags(tagsText1), ...parseTags(tagsText2)].slice(0, 6);

    const idea = await addIdea({
      userId: user.id,
      userName: user.name,
      posName: posName.trim(),
      mainTxt: mainTxt.trim(),
      tags,
      latitude: 35.681236,
      longitude: 139.767125,
    });

    router.push(`/idea/${idea.id}`);
  };

  return (
    <main className="page-container">
      <Header />
      <section className="card">
        <h2 className="section-title">アイデア新規投稿</h2>
        <form onSubmit={submit} className="field-group">
          <label>
            アイデア名
            <input value={posName} onChange={(event) => setPosName(event.target.value)} />
          </label>
          <label>
            内容
            <textarea value={mainTxt} onChange={(event) => setMainTxt(event.target.value)} />
          </label>
          <label>
            基本情報 (日付,場所名,金額、カンマ区切り。例: 8/15,東京駅,1000円)
            <input value={tagsText1} onChange={(event) => setTagsText1(event.target.value)} />
          </label>
          <label>
            タグ付け (最大3個、カンマ区切り)
            <input value={tagsText2} onChange={(event) => setTagsText2(event.target.value)} />
          </label>
          {error && <div className="small-text" style={{ color: '#c33' }}>{error}</div>}
          <div className="action-row">
            <button type="submit">保存する</button>
          </div>
        </form>
      </section>
    </main>
  );
}
