import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { authenticateAdmin } from "@/app/lib/auth-admin";
import { z } from "zod";

const createSessionSchema = z.object({
  nama_kegiatan: z
    .string()
    .trim()
    .min(3, "Nama kegiatan minimal 3 karakter")
    .max(100, "Nama kegiatan maksimal 100 karakter"),
  desc_kegiatan: z
    .string()
    .max(500, "Deskripsi kegiatan maksimal 500 karakter")
    .optional()
    .or(z.literal("")),
  date: z
    .string()
    .trim()
    .min(1, "Tanggal kegiatan wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Format tanggal harus YYYY-MM-DD (contoh: 2026-09-06)",
    }),
  waktu_mulai: z.string().optional().or(z.literal("")),
  waktu_selesai: z.string().optional().or(z.literal("")),
});

/**
 * GET /api/attandance/sessions
 * Mengambil daftar seluruh sesi kegiatan beserta rekap ringkas kehadiran.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const sessionsCollection = db.collection("sessions");
    const presencesCollection = db.collection("presences");
    const membersCollection = db.collection("user_member");

    // Hitung total anggota aktif saat ini
    const totalActiveMembers = await membersCollection.countDocuments({
      status: "aktif",
    });

    const sessions = await sessionsCollection
      .find({})
      .sort({ date: -1, created_at: -1 })
      .toArray();

    // Dapatkan rekap kehadiran untuk setiap sesi
    const sessionIds = sessions.map((s) => s.session_id);
    const presences = await presencesCollection
      .find({ session_id: { $in: sessionIds } })
      .toArray();

    // Kelompokkan per session_id
    const presenceMap: Record<
      string,
      { Hadir: number; Izin: number; Sakit: number; Alpha: number; total: number }
    > = {};

    for (const p of presences) {
      if (!presenceMap[p.session_id]) {
        presenceMap[p.session_id] = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, total: 0 };
      }
      const st = p.status as "Hadir" | "Izin" | "Sakit" | "Alpha";
      if (presenceMap[p.session_id][st] !== undefined) {
        presenceMap[p.session_id][st] += 1;
      }
      presenceMap[p.session_id].total += 1;
    }

    const sessionsWithStats = sessions.map((s) => {
      const stats = presenceMap[s.session_id] || {
        Hadir: 0,
        Izin: 0,
        Sakit: 0,
        Alpha: 0,
        total: 0,
      };

      return {
        _id: s._id,
        session_id: s.session_id,
        nama_kegiatan: s.nama_kegiatan,
        desc_kegiatan: s.desc_kegiatan || "",
        date: s.date,
        waktu_mulai: s.waktu_mulai || "",
        waktu_selesai: s.waktu_selesai || "",
        created_by: s.created_by,
        created_by_name: s.created_by_name || null,
        created_at: s.created_at,
        updated_at: s.updated_at,
        rekap: {
          hadir: stats.Hadir,
          izin: stats.Izin,
          sakit: stats.Sakit,
          alpha: stats.Alpha,
          total_absen: stats.total,
          total_anggota_aktif: totalActiveMembers,
        },
      };
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Daftar sesi absensi berhasil diambil",
          data: sessionsWithStats,
          total: sessionsWithStats.length,
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error("Error fetching attendance sessions:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat mengambil data sesi",
        },
        { status: 500 }
      ),
      req
    );
  }
}

/**
 * POST /api/attandance/sessions
 * Membuat sesi kegiatan baru untuk presensi.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    const body = await req.json();
    const validation = createSessionSchema.safeParse(body);

    if (!validation.success) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: validation.error.issues[0].message,
            errors: validation.error.issues,
          },
          { status: 400 }
        ),
        req
      );
    }

    const { nama_kegiatan, desc_kegiatan, date, waktu_mulai, waktu_selesai } =
      validation.data;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const sessionsCollection = db.collection("sessions");

    // Generate Unique session_id (e.g. SES-K8D3A1)
    const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const session_id = `SES-${uniqueCode}`;
    const now = new Date();

    const newSession = {
      session_id,
      nama_kegiatan,
      desc_kegiatan: desc_kegiatan || "",
      date,
      waktu_mulai: waktu_mulai || "",
      waktu_selesai: waktu_selesai || "",
      created_by: auth.user.user_id,
      created_by_name: auth.user.name || auth.user.username || "Admin",
      created_at: now,
      updated_at: now,
    };

    await sessionsCollection.insertOne(newSession);

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Sesi kegiatan berhasil dibuat. Sekarang dapat dilakukan pengisian presensi.",
          data: newSession,
        },
        { status: 201 }
      ),
      req
    );
  } catch (error) {
    console.error("Error creating attendance session:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat membuat sesi kegiatan",
        },
        { status: 500 }
      ),
      req
    );
  }
}

export const OPTIONS = handleOptions;
