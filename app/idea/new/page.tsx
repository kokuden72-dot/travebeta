'use client';


import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { UserContext } from '../../../components/UserProvider';
import { addIdea } from '../../../lib/store';
import { DEFAULT_ICON } from '../../../lib/icons';

export default function NewIdeaPage() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [posName, setPosName] = useState('');
  const [mainTxt, setMainTxt] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [color, setColor] = useState('#3388ff');
  const [icon, setIcon] = useState<string | undefined>(DEFAULT_ICON);
  const [iconOptions, setIconOptions] = useState<Array<{ filename: string; label: string; r: number; g: number; b: number; path: string }>>([]);
  const [iconDropdownOpen, setIconDropdownOpen] = useState(false);

  useEffect(() => {
    const loadCsv = async () => {
      try {
        const res = await fetch('/materials/icon/icons.csv');
        if (!res.ok) return;
        const text = await res.text();
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        const parsed: Array<any> = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim());
          if (parts.length >= 5) {
            const [filename, label, r, g, b] = parts;
            parsed.push({ filename, label, r: Number(r), g: Number(g), b: Number(b), path: `/materials/icon/${filename}` });
          }
        }
        setIconOptions(parsed);
      } catch (e) {
        console.error('icons.csv load failed', e);
      }
    };
    loadCsv();
  }, []);
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

    const tags = tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 3);

    const idea = await addIdea({
      userId: user.id,
      userName: user.name,
      posName: posName.trim(),
      mainTxt: mainTxt.trim(),
      tags,
      color,
      icon,
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
            タグ付け (3個まで、カンマ区切り)
            <input value={tagsText} onChange={(event) => setTagsText(event.target.value)} />
          </label>
          <label>
            ピンの色
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          </label>
          <label>
            ピンのアイコン
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button type="button" className="secondary" onClick={() => setIconDropdownOpen((s) => !s)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {icon ? <img src={icon} alt="icon" style={{ width: 20, height: 20 }} /> : <span style={{ width: 20, height: 20, display: 'inline-block' }} />}
                <span>{icon ? icon.split('/').pop() : '(なし)'}</span>
              </button>
              {iconDropdownOpen && (
                <div style={{ position: 'absolute', zIndex: 30, background: '#fff', border: '1px solid #ddd', marginTop: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
                  <div style={{ padding: 6 }}>
                    <button type="button" onClick={() => { setIcon(undefined); setIconDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', background: 'transparent', border: 'none' }}>（なし）</button>
                    {iconOptions.map((opt) => (
                      <button key={opt.filename} type="button" onClick={() => { setIcon(opt.path); setIconDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <span style={{ width: 18, height: 18, borderRadius: 4, background: `rgb(${opt.r}, ${opt.g}, ${opt.b})`, display: 'inline-block', border: '1px solid rgba(0,0,0,0.08)' }} />
                        <img src={opt.path} alt={opt.label} style={{ width: 18, height: 18 }} />
                        <span style={{ marginLeft: 8 }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 8 }}>
              {icon ? <img src={icon} alt="icon preview" style={{ width: 28, height: 28 }} /> : null}
            </div>
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
