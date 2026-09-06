import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { authenticateAdmin } from "@/app/lib/auth-admin";
import { ObjectId } from "mongodb";
import { z } from "zod";

const updateSessionSchema = z.object({
  nama_kegiatan: z.string().trim().min(3).max(100).optional(),
  desc_kegiatan: z.string().max(500).optional().or(z.literal("")),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Format tanggal harus YYYY-MM-DD",
    })
    .optional(),
  waktu_mulai: z.string().optional().or(z.literal("")),
  waktu_selesai: z.string().optional().or(z.literal("")),
});

/**
 * GET /api/attandance/sessions/[session_id]
 * Mengambil detail sesi beserta daftar member aktif dan status presensi masing-masing.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    const { session_id } = await params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const sessionsCollection = db.collection("sessions");
    const presencesCollection = db.collection("presences");
    const membersCollection = db.collection("user_member");

    let sessionQuery: Record<string, any> = {};
    if (ObjectId.isValid(session_id)) {
      sessionQuery = { $or: [{ _id: new ObjectId(session_id) }, { session_id }] };
    } else {
      sessionQuery = { session_id };
    }

    const session = await sessionsCollection.findOne(sessionQuery);
    if (!session) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Sesi kegiatan tidak ditemukan" },
          { status: 404 }
        ),
        req
      );
    }

    const actualSessionId = session.session_id;

    // 1. Ambil HANYA member yang berstatus "aktif"
    const activeMembers = await membersCollection
      .find({ status: "aktif" })
      .sort({ name: 1 })
      .toArray();

    // 2. Ambil catatan presensi yang sudah tercatat untuk sesi ini
    const presences = await presencesCollection
      .find({ session_id: actualSessionId })
      .toArray();

    const presenceMap = new Map<string, any>();
    presences.forEach((p) => {
      presenceMap.set(p.user_id, p);
    });

    let rekap = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
      belum_absen: 0,
      total_member_aktif: activeMembers.length,
    };

    // Gabungkan data member aktif dengan status presensinya di sesi ini
    const membersWithPresence = activeMembers.map((m) => {
      const recorded = presenceMap.get(m.user_id);
      const status = recorded ? recorded.status : null;
      const keterangan = recorded ? recorded.keterangan || "" : "";

      if (status === "Hadir") rekap.hadir++;
      else if (status === "Izin") rekap.izin++;
      else if (status === "Sakit") rekap.sakit++;
      else if (status === "Alpha") rekap.alpha++;
      else rekap.belum_absen++;

      return {
        user_id: m.user_id,
        name: m.name,
        nisn: m.nisn || "",
        kelas: m.kelas || "",
        angkatan: m.angkatan || "",
        status_member: m.status,
        presence_id: recorded ? recorded.presences_id || recorded._id : null,
        status: status, // "Hadir" | "Izin" | "Sakit" | "Alpha" | null
        keterangan: keterangan,
        updated_at: recorded ? recorded.updated_at : null,
      };
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Detail sesi dan daftar presensi member aktif berhasil diambil",
          data: {
            session: {
              _id: session._id,
              session_id: session.session_id,
              nama_kegiatan: session.nama_kegiatan,
              desc_kegiatan: session.desc_kegiatan || "",
              date: session.date,
              waktu_mulai: session.waktu_mulai || "",
              waktu_selesai: session.waktu_selesai || "",
              created_by: session.created_by,
              created_by_name: session.created_by_name || null,
              created_at: session.created_at,
              updated_at: session.updated_at,
            },
            rekap,
            members: membersWithPresence,
          },
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error("Error fetching single session details:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat mengambil detail sesi",
        },
        { status: 500 }
      ),
      req
    );
  }
}

/**
 * PUT /api/attandance/sessions/[session_id]
 * Memperbarui info sesi kegiatan.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    const { session_id } = await params;
    const body = await req.json();
    const validation = updateSessionSchema.safeParse(body);

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

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const sessionsCollection = db.collection("sessions");

    let query: Record<string, any> = {};
    if (ObjectId.isValid(session_id)) {
      query = { $or: [{ _id: new ObjectId(session_id) }, { session_id }] };
    } else {
      query = { session_id };
    }

    const existing = await sessionsCollection.findOne(query);
    if (!existing) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Sesi kegiatan tidak ditemukan" },
          { status: 404 }
        ),
        req
      );
    }

    const updateFields: Record<string, any> = {
      updated_at: new Date(),
    };

    const { nama_kegiatan, desc_kegiatan, date, waktu_mulai, waktu_selesai } =
      validation.data;
    if (nama_kegiatan) updateFields.nama_kegiatan = nama_kegiatan;
    if (desc_kegiatan !== undefined) updateFields.desc_kegiatan = desc_kegiatan;
    if (date) updateFields.date = date;
    if (waktu_mulai !== undefined) updateFields.waktu_mulai = waktu_mulai;
    if (waktu_selesai !== undefined) updateFields.waktu_selesai = waktu_selesai;

    await sessionsCollection.updateOne(query, { $set: updateFields });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Data sesi kegiatan berhasil diperbarui",
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error("Error updating session:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat memperbarui sesi",
        },
        { status: 500 }
      ),
      req
    );
  }
}

/**
 * DELETE /api/attandance/sessions/[session_id]
 * Menghapus sesi kegiatan dan seluruh catatan presensi di dalamnya.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    const { session_id } = await params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const sessionsCollection = db.collection("sessions");
    const presencesCollection = db.collection("presences");

    let query: Record<string, any> = {};
    if (ObjectId.isValid(session_id)) {
      query = { $or: [{ _id: new ObjectId(session_id) }, { session_id }] };
    } else {
      query = { session_id };
    }

    const session = await sessionsCollection.findOne(query);
    if (!session) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Sesi kegiatan tidak ditemukan" },
          { status: 404 }
        ),
        req
      );
    }

    // Hapus sesi
    await sessionsCollection.deleteOne(query);

    // Hapus presensi terkait sesi ini
    await presencesCollection.deleteMany({ session_id: session.session_id });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Sesi kegiatan dan data presensi terkait berhasil dihapus",
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error("Error deleting session:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat menghapus sesi",
        },
        { status: 500 }
      ),
      req
    );
  }
}

export const OPTIONS = handleOptions;
