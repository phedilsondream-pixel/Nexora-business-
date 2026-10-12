import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nexora Business Suite',
  description: 'Plataforma SaaS empresarial — Angola (AOA)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
