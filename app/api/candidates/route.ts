import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import clientPromise from "@/app/lib/mongodb";
import { z } from "zod";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Schema Zod
const candidateSchema = z.object({
  elections_id: z.string().min(1, "Elections ID wajib diisi"),
  user: z.string().min(1, "Kandidat wajib diisi"),
  vision: z.string().min(1, "Visi wajib diisi"),
  kelas: z.string().min(1, "Kelas wajib diisi"),
  mission: z
    .union([
      z
        .array(z.string().min(1, "Item misi tidak boleh kosong"))
        .min(1, "Minimal 1 misi harus diisi"),
      z
        .string()
        .min(1, "Misi tidak boleh kosong")
        .transform((val) => [val]),
    ])
    .transform((val) => (Array.isArray(val) ? val : [val])),
  image: z.string().min(1, "Foto kandidat wajib diisi"),
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

    const {
      elections_id,
      user,
      kelas,
      vision,
      mission,
      image,
      serial_number,
    } = result.data;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const candidatesCollection = db.collection("candidates");

    // Cek duplikasi kandidat per election (nama atau nomor urut)
    const existing = await candidatesCollection.findOne({
      elections_id,
      $or: [{ user }, { serial_number }],
    });

    if (existing) {
      const duplicateMsg =
        existing.user?.toLowerCase() === user.toLowerCase()
          ? "Nama Kandidat Sudah Terdaftar pada Pemilihan ini"
          : `Nomor urut ${serial_number} sudah digunakan pada pemilihan ini`;

      return withCors(
        NextResponse.json(
          {
            success: false,
            message: duplicateMsg,
          },
          { status: 409 },
        ),
        req,
      );
    }

    // Upload image to Cloudinary
    let imageUrl = image;
    let imagePublicId = "";
    try {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "admaja/candidates",
        resource_type: "image",
      });
      imageUrl = uploadResponse.secure_url;
      imagePublicId = uploadResponse.public_id;
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Gagal mengunggah foto kandidat ke Cloudinary",
          },
          { status: 500 },
        ),
        req,
      );
    }

    const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const candidates_id = `CANDIDATE-${uniqueId}`;

    const candidateDoc = {
      candidates_id: candidates_id,
      elections_id: elections_id,
      serial_number: serial_number,
      user,
      image: imageUrl,
      foto_url: imageUrl,
      image_public_id: imagePublicId,
      candidate_data: {
        name: user,
        foto_url: imageUrl,
        kelas: kelas,
      },
      vision_mission: {
        vision: vision,
        mission: mission,
      },
      visi_misi: {
        visi: vision,
        misi: mission,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await candidatesCollection.insertOne(candidateDoc);

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Kandidat berhasil ditambahkan",
          data: candidateDoc,
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
