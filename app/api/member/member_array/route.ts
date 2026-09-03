import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { jwtVerify } from "jose";
import z from "zod";

const memberItemSchema = z.object({
  // Name
  name: z
    .string()
    .trim()
    .min(1, "Nama harus diisi")
    .max(100, "Nama maksimal 100 karakter"),

  // Kelas
  kelas: z
    .string()
    .trim()
    .min(1, "Kelas harus diisi"),

  // Angkatan (menerima "2026" maupun 2026)
  angkatan: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .refine((v) => /^\d{4}$/.test(v), {
      message: "Angkatan harus berupa 4 digit angka",
    }),

  // NISN (menerima "1234567890" maupun 1234567890)
  nisn: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .refine((v) => /^\d{10}$/.test(v), {
      message: "NISN harus berupa 10 digit angka",
    }),

  // Status
  status: z.enum(["aktif", "nonaktif", "purna"], {
    message: "Status tidak valid",
  }),
});

const arrayMemberSchema = z
  .array(memberItemSchema)
  .min(1, "Array data anggota tidak boleh kosong");

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Unauthorized: Token tidak ditemukan (login diperlukan)",
          },
          { status: 401 },
        ),
        req,
      );
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default_secret",
    );
    const { payload } = await jwtVerify(token, secret);

    if (!payload || !payload.user_id) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Invalid user session" },
          { status: 401 },
        ),
        req,
      );
    }

    const body = await req.json();

    // Mendukung direct array [...] ataupun wrapped { data: [...] } / { members: [...] }
    const rawList = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.members)
          ? body.members
          : [body];

    const validation = arrayMemberSchema.safeParse(rawList);

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

    const memberList = validation.data;

    // Cek duplikasi NISN di dalam array request
    const seenNisns = new Set<string>();
    for (const item of memberList) {
      if (seenNisns.has(item.nisn)) {
        return withCors(
          NextResponse.json(
            {
              success: false,
              message: `NISN duplikat ditemukan di dalam request payload: ${item.nisn}`,
            },
            { status: 400 },
          ),
          req,
        );
      }
      seenNisns.add(item.nisn);
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const usersCollection = db.collection("user_member");

    // Cek apakah NISN sudah ada di database
    const nisnList = memberList.map((m) => m.nisn);
    const existingUsers = await usersCollection
      .find({ nisn: { $in: nisnList } })
      .toArray();

    if (existingUsers.length > 0) {
      const duplicateList = existingUsers
        .map((u: any) => `${u.name} (NISN: ${u.nisn})`)
        .join(", ");
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: `Data sudah terdaftar di database: ${duplicateList}`,
          },
          { status: 400 },
        ),
        req,
      );
    }

    const now = new Date();
    const documents = memberList.map((item) => ({
      user_id: `USR-ANGT-M-${item.nisn}-${item.angkatan}`,
      name: item.name,
      angkatan: item.angkatan,
      kelas: item.kelas,
      nisn: item.nisn,
      status: item.status,
      createdAt: now,
      updatedAt: now,
    }));

    await usersCollection.insertMany(documents);

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: `Berhasil menambahkan ${documents.length} data anggota`,
          count: documents.length,
          data: documents,
        },
        { status: 201 },
      ),
      req,
    );
  } catch (error: any) {
    console.error("Bulk registration error:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: error?.message || "Terjadi kesalahan server",
        },
        { status: 500 },
      ),
      req,
    );
  }
}

export const OPTIONS = handleOptions;
