import './globals.css';

export const metadata = {
  title: 'Trail Performance Team',
  description: 'Plano Tático e Estratégia de Nutrição para Trail Running',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
