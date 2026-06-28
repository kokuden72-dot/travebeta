import Link from 'next/link';
import Header from '../components/Header';

export default function HomePage() {
  return (
    <main className="page-container">
      <Header />
      <section className="card">
        <h1 className="section-title">TraveAgent</h1>
        <p>地図上でアイデアを共有し、旅行プランを整理するアプリケーションです。</p>
        <div className="action-row" style={{ marginTop: 24 }}>
          <Link className="nav-link" href="/overview">
            地図をみる
          </Link>
          <Link className="nav-link" href="/idea/new">
            新しいアイデアを追加
          </Link>
          <Link className="nav-link" href="/threads">
            スレッド一覧
          </Link>
        </div>
      </section>
    </main>
  );
}
