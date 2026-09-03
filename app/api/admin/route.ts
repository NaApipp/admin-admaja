import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";
import z from "zod";
import { jwtVerify } from "jose";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return withCors(
        NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
        req,
      );
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default_secret",
    );
    const { payload } = await jwtVerify(token, secret);

    if (!payload || !payload.user_id) {
      return withCors(
        NextResponse.json({ message: "Invalid user session" }, { status: 401 }),
        req,
      );
    }
    const body = await req.json();

    const registerSchema = z.object({
      // Name
      name: z
        .string()
        .trim()
        .min(1, "Nama depan harus diisi")
        .max(50, "Nama depan maksimal 50 karakter"),
      // .regex(/^[A-Za-zÀ-ÿ\s]+$/, {
      //   message: "Nama depan hanya boleh mengandung huruf dan spasi",
      // }),

      // Angkatan
      angkatan: z
        .string()
        .trim()
        .min(1, "Angkatan harus diisi")
        .regex(/^\d{4}$/, {
          message: "Angkatan harus berupa 4 digit angka",
        }),

      // Validasi Level
      password: z
        .string()
        .min(8, "Password minimal 8 karakter")
        .max(100, "Password maksimal 100 karakter"),

      // Role
      role: z.enum(["admin"], {
        message: "Role tidak valid",
      }),

      // Status
      status: z.enum(["aktif", "nonaktif", "purna"], {
        message: "Status tidak valid",
      }),
    });

    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return withCors(
        NextResponse.json(
          {
            message: validation.error.issues[0].message,
            errors: validation.error.issues,
          },
          { status: 400 },
        ),
        req,
      );
    }

    const { name, angkatan, password, role, status } = validation.data;

    const client = await clientPromise;
    // DB and Colecction Name
    const db = client.db(process.env.MONGODB_DATABASE);
    const usersCollection = db.collection("user_admin");

    //  Vakidation check on db name
    const existingUser = await usersCollection.findOne({
      $or: [{ name }],
    });
    if (existingUser) {
      return withCors(
        NextResponse.json({ message: "Nama sudah terdaftar" }, { status: 400 }),
        req,
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Time Format create Account
    // const formattedDate = formatDateWIB(new Date());
    const now = new Date();
    const formattedDate = now.toDateString();

    // 🆔 Generate ID
    const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const user_id = `USR-ADM-${uniqueId}`;

    // Saving New User
    const result = await usersCollection.insertOne({
      user_id,
      name: name,
      angkatan: angkatan,
      role: role,
      status: status,
      password: hashedPassword,
      createdAt: formattedDate,
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Tambah Data User Admin Berhasil",
          user_id: user_id,
        },
        { status: 201 },
      ),
      req,
    );
  } catch (error) {
    console.error("Registration error:", error);
    return withCors(
      NextResponse.json(
        { success: false, message: "Terjadi kesalahan server" },
        { status: 500 },
      ),
      req,
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return withCors(
        NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
        req,
      );
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default_secret",
    );
    const { payload } = await jwtVerify(token, secret);

    if (!payload || !payload.user_id) {
      return withCors(
        NextResponse.json({ message: "Invalid user session" }, { status: 401 }),
        req,
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const usersCollection = db.collection("user_admin");

    const users = await usersCollection.find({}).toArray();

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Data Admin berhasil diambil",
          data: users,
          total: users.length
        },
        { status: 200 },
      ),
      req,
    );
  } catch (error) {
    console.error("Error processing Admin data:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan saat memproses Admin",
        },
        { status: 500 },
      ),
      req,
    );
  }
}

export const OPTIONS = handleOptions;
