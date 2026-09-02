import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { name, password } = await req.json();

    // Validasi input sederhana
    if (!name || !password) {
      return withCors(
        NextResponse.json(
          { message: "Nama dan password harus diisi" },
          { status: 400 },
        ),
        req,
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const usersCollection = db.collection("user_admin");

    // Cari user berdasarkan email
    const user = await usersCollection.findOne({ name });
    if (!user) {
      return withCors(
        NextResponse.json(
          { message: "Nama atau Password salah" },
          { status: 404 },
        ),
        req,
      );
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return withCors(
        NextResponse.json(
          { message: "Username atau Password salah" },
          { status: 401 },
        ),
        req,
      );
    }

    // Validasi status akun (hanya akun 'aktif' yang diizinkan login)
    if (user.status && user.status !== "aktif") {
      const statusMessage =
        user.status === "nonaktif" || user.status === "tidak aktif"
          ? "Akun Anda telah dinonaktifkan. Silakan hubungi Super Admin."
          : user.status === "purna"
            ? "Akun Anda berstatus purna dan tidak memiliki akses login."
            : "Akun Anda tidak aktif.";

      return withCors(
        NextResponse.json(
          {
            success: false,
            message: statusMessage,
          },
          { status: 403 },
        ),
        req,
      );
    }

    // Generate JWT
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default_secret",
    );
    const refreshSecret = new TextEncoder().encode(
      process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
    );
    const token = await new SignJWT({
      user_id: user.user_id || user._id.toString(), // Menggunakan idUser dari DB atau _id sebagai fallback
      name: user.name,
      role: user.role,
      status: user.status || "aktif",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setJti(randomUUID())
      .setExpirationTime("1d") // Token berlaku 1 hari
      .sign(secret);

    const refreshToken = await new SignJWT({
      user_id: user.user_id || user._id.toString(),
      role: user.role,
      status: user.status || "aktif",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("14d")
      .setJti(randomUUID())
      .sign(refreshSecret);

    const response = NextResponse.json(
      {
        success: true,
        message: "Login berhasil",
        user: {
          user_id: user.user_id,
          name: user.name,
          role: user.role,
          status: user.status || "aktif",
        },
        token_set: {
          token: token,
          refreshToken: refreshToken,
        },
      },
      { status: 200 },
    );

    // Set cookies
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14, // 14 hari
    });

    return withCors(response, req);
  } catch (error) {
    console.error("Login error:", error);
    return withCors(
      NextResponse.json(
        {   success: false,
            message: "Terjadi kesalahan server" },
        { status: 500 },
      ),
      req,
    );
  }
}
export const OPTIONS = handleOptions;
