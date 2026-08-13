import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    isPro?: boolean;
    proExpiresAt?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isPro?: boolean;
      proExpiresAt?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isPro?: boolean;
    proExpiresAt?: string | null;
  }
}
