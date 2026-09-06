import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export interface AdminUser {
  user_id: string;
  name?: string;
  username?: string;
  role: "admin" | "super_admin" | string;
}

export type AdminAuthResult =
  | { success: false; error: string; status: number }
  | { success: true; user: AdminUser };

/**
 * Helper untuk verifikasi sesi dan otorisasi Admin atau Super Admin
 */
export async function authenticateAdmin(req: NextRequest): Promise<AdminAuthResult> {
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return { success: false, error: "Unauthorized: Silakan login terlebih dahulu", status: 401 };
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default_secret"
    );
    const { payload } = await jwtVerify(token, secret);

    if (!payload || !payload.user_id) {
      return { success: false, error: "Sesi tidak valid, silakan login ulang", status: 401 };
    }

    const role = String(payload.role || "");
    if (role !== "admin" && role !== "super_admin") {
      return {
        success: false,
        error: "Forbidden: Hanya Admin atau Super Admin yang berhak mengelola absensi",
        status: 403,
      };
    }

    return {
      success: true,
      user: {
        user_id: String(payload.user_id),
        name: typeof payload.name === "string" ? payload.name : undefined,
        username: typeof payload.username === "string" ? payload.username : undefined,
        role,
      },
    };
  } catch (error) {
    console.error("JWT verification error in admin auth:", error);
    return { success: false, error: "Token tidak valid atau telah kedaluwarsa", status: 401 };
  }
}
