export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!login|cadastro|api/auth|api/pro/webhook|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icon-.*\\.png|apple-touch-icon\\.png|.*\\.svg|.*\\.png|.*\\.ico|.*\\.webmanifest).*)",
  ],
};
