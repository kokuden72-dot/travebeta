import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SettingsProvider } from '../components/SettingsProvider';
import { UserProvider } from '../components/UserProvider';

export const metadata: Metadata = {
  title: 'TraveAgent',
  description: '旅行計画を共有する地図コメントアプリケーション',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <UserProvider>
          <SettingsProvider>{children}</SettingsProvider>
        </UserProvider>
      </body>
    </html>
  );
}
