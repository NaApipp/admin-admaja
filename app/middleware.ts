import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { withCors } from "@/app/lib/cors"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  // Halaman yang tidak perlu login
  const publicRoutes = ["/login", "/register", "/", "/coming-soon", "/maintenance"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // 1. Jika TIDAK ada token
  if (!token) {
    if (isPublicRoute) {
      return NextResponse.next()
    }
    
    // Proteksi API routes
    if (pathname.startsWith("/api/")) {
      // Kecuali API auth (untuk login itu sendiri)
      if (!pathname.startsWith("/api/auth/")) {
        return withCors(NextResponse.json(
          { message: "Unauthorized: Silakan login" },
          { status: 401 }
        ), request)
      }
      return NextResponse.next()
    }
    
    // Proteksi halaman dashboard/private lainnya
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 2. Jika ADA token, verifikasi validitasnya
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default_secret"
    )
    await jwtVerify(token, secret)

    // Jika token valid dan mencoba akses halaman login/register, lempar ke dashboard
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("JWT Verification failed:", error)
    
    // Token tidak valid atau expired
    if (isPublicRoute) {
      return NextResponse.next()
    }

    // Jika di API, return 401
    if (pathname.startsWith("/api/")) {
      return withCors(NextResponse.json(
        { message: "Token tidak valid, silakan login ulang" },
        { status: 401 }
      ), request)
    }

    // Jika di halaman biasa, hapus cookie dan redirect ke login
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("token")
    return response
  }
}

export const config = {
  matcher: [
    /*
      Middleware akan jalan di semua route
      kecuali static files, image optimization, dan favicon
    */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}