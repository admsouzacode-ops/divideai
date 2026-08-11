export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!login|cadastro|api/auth|_next/static|_next/image|favicon.ico|icon-.*|manifest.json).*)",
  ],
};
