import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppHeightFix from "./app-height-fix";

const SITE_URL = "https://hayparo.net.ar";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
    title: "¿Hay Paro Hoy en Buenos Aires? SÍ o NO: Colectivos, Subte y Trenes",
  description:
        "SÍ o NO al instante: paro de colectivos, subte o trenes hoy en Buenos Aires, con gremio, servicios afectados y horario cuando se confirma.",
  openGraph: {
    title: "¿Hay Paro Hoy en Buenos Aires?",
    description:
      "SÍ o NO, actualizado a diario: paro de colectivos, subte o trenes en Buenos Aires.",
    url: SITE_URL,
    siteName: "¿Hay Paro Hoy?",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "¿Hay Paro Hoy en Buenos Aires?",
    description:
      "SÍ o NO, actualizado a diario: paro de colectivos, subte o trenes en Buenos Aires.",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppHeightFix />
        {children}
      </body>
    </html>
  );
}
