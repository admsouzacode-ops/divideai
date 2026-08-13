export { default } from "next-auth/middleware";

// Não proteger arquivos estáticos do PWA, auth e assets do Next
export const config = {
  matcher: [
    "/((?!login|cadastro|api/auth|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icon-.*\\.png|apple-touch-icon\\.png|.*\\.svg|.*\\.png|.*\\.ico|.*\\.webmanifest).*)",
  ],
};
