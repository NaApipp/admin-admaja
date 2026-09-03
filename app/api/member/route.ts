import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { jwtVerify } from "jose";
import z from "zod";

function formatDateWIB(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = fmt.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  return `${map.day}/${map.month}/${map.year} ${map.hour}:${map.minute}:${map.second}`;
}

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

      // Kelas
      kelas: z
        .string()
        .trim()
        .min(1, "Kelas harus diisi"),

      // Angkatan
      angkatan: z
        .string()
        .trim()
        .min(1, "Angkatan harus diisi")
        .regex(/^\d{4}$/, {
          message: "Angkatan harus berupa 4 digit angka",
        }),

      // NISN
      nisn: z
        .string()
        .trim()
        .min(1, "NISN harus diisi")
        .regex(/^\d{10}$/, {
          message: "NISN harus berupa 10 digit angka",
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

    const { name, angkatan, nisn, status, kelas } = validation.data;

    const client = await clientPromise;
    // DB and Colecction Name
    const db = client.db(process.env.MONGODB_DATABASE);
    const usersCollection = db.collection("user_member");

    //  Vakidation check on db name
    const existingUser = await usersCollection.findOne({
      $or: [{ name }, { nisn }],
    });
    if (existingUser) {
      return withCors(
        NextResponse.json(
          { message: "Nama atau NISN sudah terdaftar" },
          { status: 400 },
        ),
        req,
      );
    }

    // Time Format create Account
    // const formattedDate = formatDateWIB(new Date());
    const now = new Date();
    const formattedDate = now.toDateString();

    // 🆔 Generate ID
    // const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const user_id = `USR-ANGT-M-${nisn}-${angkatan}`;

    // Saving New User
    const result = await usersCollection.insertOne({
      user_id,
      name: name,
      angkatan: angkatan,
      kelas: kelas,
      nisn: nisn,
      status: "aktif",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Tambah Data Anggota Berhasil",
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
    const usersCollection = db.collection("user_member");

    const users = await usersCollection.find({}).toArray();

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Data Anggota berhasil diambil",
          data: users,
          total: users.length
        },
        { status: 200 },
      ),
      req,
    );
  } catch (error) {
    console.error("Error processing elections:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan saat memproses anggota",
        },
        { status: 500 },
      ),
      req,
    );
  }
}

export const OPTIONS = handleOptions;
