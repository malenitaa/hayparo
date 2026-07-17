import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://www.hayparo.net.ar";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "¿Hay Paro Hoy en Buenos Aires? Colectivos, Subte y Trenes",
  description:
    "Respuesta rápida y actualizada: ¿hay paro de transporte público hoy en Buenos Aires? Colectivos, subte y trenes, con gremio, servicios afectados y horario cuando se confirma un paro.",
  openGraph: {
    title: "¿Hay Paro Hoy en Buenos Aires?",
    description:
      "SÍ o NO, actualizado a diario: paro de colectivos, subte o trenes en Buenos Aires.",
    url: SITE_URL,
    siteName: "¿Hay Paro Hoy?",
    locale: "es_AR",
    type: "website",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
