import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/app/lib/session";

const protectedRoutes = ["/"];
const publicRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);


  const cookie = req.cookies.get("jwt")?.value;
  const session = await decrypt(cookie);

  if (isProtectedRoute && !session?.role) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublicRoute && session?.role && session?.role === "admin") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}