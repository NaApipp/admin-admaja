import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import clientPromise from "@/app/lib/mongodb";
import { z } from "zod";

// Schema Zod
const electionSchema = z.object({
  name: z
    .string()
    .min(3, "Nama kategori minimal 3 karakter")
    .max(50, "Nama kategori maksimal 50 karakter"),
  tanggal_mulai: z.coerce.date(),
  tanggal_selesai: z.coerce.date(),
  status: z.enum(["draft", "dibuka", "ditutup"]),
});

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

    // VALIDASI ZOD
    const result = electionSchema.safeParse(body);

    if (!result.success) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: result.error.issues[0].message,
          },
          { status: 400 },
        ),
        req,
      );
    }

    const { name, tanggal_mulai, tanggal_selesai, status } = result.data;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const electionCollection = db.collection("elections");

    // Cek duplikasi kategori per user
    const existing = await electionCollection.findOne({
      name,
    });

    if (existing) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Kategori sudah ada" },
          { status: 409 },
        ),
        req,
      );
    }

    const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const elections_id = `ELEC-${uniqueId}`;

    await electionCollection.insertOne({
      elections_id,
      name,
      date: {
        start: tanggal_mulai,
        end: tanggal_selesai,
      },
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Elections berhasil ditambahkan",
          data: {
            elections_id,
            name,
            date: {
              start: tanggal_mulai,
              end: tanggal_selesai,
            },
            status,
          },
        },
        { status: 201 },
      ),
      req,
    );
  } catch (error) {
    console.error("Error processing election:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan saat memproses election",
        },
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
    const electionCollection = db.collection("elections");

    const elections = await electionCollection.find({}).toArray();

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Data Election berhasil diambil",
          data: elections,
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
          message: "Terjadi kesalahan saat memproses elections",
        },
        { status: 500 },
      ),
      req,
    );
  }
}
export const OPTIONS = handleOptions;
