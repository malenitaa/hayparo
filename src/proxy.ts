import { NextResponse, type NextRequest } from "next/server";

// CSP con nonce por request, como en la guía de Next
// (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
// Next lee el nonce de este header y se lo pone a sus propios <script>; un
// <script> inyectado (por ejemplo desde el JSON-LD, #6) no lo tiene y el
// navegador no lo ejecuta.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Estilos: el CSS de Tailwind es un archivo propio; 'unsafe-inline' cubre
    // los <style> que mete Next sin nonce. Un estilo inyectado no ejecuta
    // código, así que el riesgo es bajo.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Todo menos los archivos estáticos de Next.
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
