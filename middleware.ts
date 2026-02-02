import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // If not configured, don't block (handy locally until you set env vars)
  if (!user || !pass) return NextResponse.next();

  const auth = req.headers.get("authorization");

  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded); // "user:pass"
      const [u, p] = decoded.split(":");
      if (u === user && p === pass) return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="FullmanualSK"',
    },
  });
}

// Protect everything except Next.js assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
