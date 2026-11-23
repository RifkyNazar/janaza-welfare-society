import { auth } from "@/auth";
import { withEmployeeCookieExpiry } from "@/lib/employee-session-cookie";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";

const continueRequest: (request: NextAuthRequest, event: NextFetchEvent) => Response = () => NextResponse.next();
const authenticate = auth(continueRequest);

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return withEmployeeCookieExpiry(async () => await authenticate(request, event) ?? NextResponse.next());
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/supervisor/:path*"],
};
