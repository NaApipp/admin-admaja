import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import clientPromise from "@/app/lib/mongodb";
import { z } from "zod";

// Schema Zod
const candidateSchema = z.object({
  elections_id: z.string().min(1, "Elections ID wajib diisi"),
  user: z.string().min(1, "Kandidat wajib diisi"),
  vision: z.string().min(1, "Visi wajib diisi"),
  mission: z
    .union([
      z.array(z.string().min(1, "Item misi tidak boleh kosong")).min(1, "Minimal 1 misi harus diisi"),
      z.string().min(1, "Misi tidak boleh kosong").transform((val) => [val]),
    ])
    .transform((val) => (Array.isArray(val) ? val : [val])),
  serial_number: z.union([
    z.number(),
    z.string().min(1, "Nomor urut wajib diisi"),
  ]),
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
    const result = candidateSchema.safeParse(body);

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

    const { elections_id, user, vision, mission, serial_number } =
      result.data;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const candidatesCollection = db.collection("candidates");

    // Cek duplikasi kandidat per election
    const existing = await candidatesCollection.findOne({
      user,
    });

    if (existing) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Nama Kandidat Sudah Terdaftar pada Pemilihan ini" },
          { status: 409 },
        ),
        req,
      );
    }

    const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const candidates_id = `CANDIDATE-${uniqueId}`;

    await candidatesCollection.insertOne({
      candidates_id: candidates_id,
      elections_id: elections_id,
      serial_number: serial_number,
      user,
      vision_mission: {
        vision: vision,
        mission: mission,
      },
      
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Kandidat berhasil ditambahkan",
          data: {
            candidates_id,
            elections_id,
            serial_number,
            user,
            vision_mission: {
              vision: vision,
              mission: mission,
            },
          },
        },
        { status: 201 },
      ),
      req,
    );
  } catch (error) {
    console.error("Error processing candidate:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan saat memproses kandidat",
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
    const electionCollection = db.collection("candidates");

    const elections = await electionCollection.find({}).toArray();

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Data Kandidat berhasil diambil",
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
