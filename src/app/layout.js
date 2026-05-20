import "./globals.css";

export const metadata = {
  title: "Conjunto App - Aprovação",
  description: "Plataforma de Aprovação da Agência Conjunto",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
