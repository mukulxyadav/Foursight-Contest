import type { NextRequest } from "next/server";

import { apiURL } from "./app/components/apiURL";
export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/dashboard" ||
    request.nextUrl.pathname === "/login"
  ) {
    let currentUser = false;
    let results;

    let token = request.cookies.get("token")?.value;

    try {
      const response = await fetch(apiURL + "/auth/verifyToken", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      if (response.status === 200) {
        currentUser = true;
      } else {
        currentUser = false;
      }
    } catch (err: any) {
      currentUser = false;
    }

    if (currentUser && !request.nextUrl.pathname.startsWith("/dashboard")) {
      return Response.redirect(new URL("/dashboard", request.url));
    }
    if (currentUser && request.nextUrl.pathname.startsWith("/login")) {
      return Response.redirect(new URL("/dashboard", request.url));
    }

    if (!currentUser && !request.nextUrl.pathname.startsWith("/login")) {
      return Response.redirect(new URL("/login", request.url));
    }
  } else if (request.nextUrl.pathname === "/") {
    let token = request.cookies.get("token")?.value;
    if (token) {
      return Response.redirect(new URL("/dashboard", request.url));
    }
  }
}

export const config = {
  matcher: ["/dashboard", "/login", "/", "/portfolio"],
  // /auth/callback is not in matcher, so it won't be processed by middleware
};
