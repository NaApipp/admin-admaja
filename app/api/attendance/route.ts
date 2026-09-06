import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { authenticateAdmin } from "@/app/lib/auth-admin";
import { z } from "zod";

const presenceStatusEnum = z.enum(["Hadir", "Izin", "Sakit", "Alpha"], {
  message: "Status presensi harus berupa: Hadir, Izin, Sakit, atau Alpha",
});

const singleAttendanceSchema = z.object({
  session_id: z.string().trim().min(1, "ID Sesi wajib diisi"),
  user_id: z.string().trim().min(1, "ID Member wajib diisi"),
  status: presenceStatusEnum,
  keterangan: z.string().max(255).optional().or(z.literal("")),
});

const bulkAttendanceItemSchema = z.object({
  user_id: z.string().trim().min(1, "ID Member wajib diisi"),
  status: presenceStatusEnum,
  keterangan: z.string().max(255).optional().or(z.literal("")),
});

const bulkAttendanceSchema = z.object({
  session_id: z.string().trim().min(1, "ID Sesi wajib diisi"),
  attendances: z
    .array(bulkAttendanceItemSchema)
    .min(1, "Daftar kehadiran minimal berisi 1 anggota"),
});

/**
 * GET /api/attandance
 * Mengambil data presensi berdasarkan parameter query:
 * - ?session_id=... -> Mengambil semua catatan presensi pada sesi tersebut
 * - ?user_id=...    -> Mengambil riwayat kehadiran member tertentu
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
    const { searchParams } = req.nextUrl;
    const session_id = searchParams.get("session_id");
    const user_id = searchParams.get("user_id");

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const presencesCollection = db.collection("presences");
    const membersCollection = db.collection("user_member");
    const sessionsCollection = db.collection("sessions");

    // Skenario 1: Ambil presensi per sesi tertentu
    if (session_id) {
      const presences = await presencesCollection
        .find({ session_id })
        .toArray();

      const memberIds = presences.map((p) => p.user_id);
      const members = await membersCollection
        .find({ user_id: { $in: memberIds } })
        .toArray();

      const memberMap = new Map(members.map((m) => [m.user_id, m]));

      const data = presences.map((p) => {
        const member = memberMap.get(p.user_id);
        return {
          presences_id: p.presences_id || p._id,
          session_id: p.session_id,
          user_id: p.user_id,
          name: member?.name || "Tidak Diketahui",
          kelas: member?.kelas || "",
          angkatan: member?.angkatan || "",
          nisn: member?.nisn || "",
          status: p.status,
          keterangan: p.keterangan || "",
          updated_at: p.updated_at,
          updated_by: p.updated_by || null,
        };
      });

      return withCors(
        NextResponse.json(
          {
            success: true,
            message: "Data presensi sesi berhasil diambil",
            data,
            total: data.length,
          },
          { status: 200 }
        ),
        req
      );
    }

    // Skenario 2: Ambil riwayat presensi member tertentu
    if (user_id) {
      const presences = await presencesCollection
        .find({ user_id })
        .sort({ updated_at: -1 })
        .toArray();

      const sessionIds = presences.map((p) => p.session_id);
      const sessions = await sessionsCollection
        .find({ session_id: { $in: sessionIds } })
        .toArray();

      const sessionMap = new Map(sessions.map((s) => [s.session_id, s]));

      const history = presences.map((p) => {
        const s = sessionMap.get(p.session_id);
        return {
          presences_id: p.presences_id || p._id,
          session_id: p.session_id,
          nama_kegiatan: s?.nama_kegiatan || "Sesi Kegiatan",
          date: s?.date || "",
          status: p.status,
          keterangan: p.keterangan || "",
          updated_at: p.updated_at,
        };
      });

      return withCors(
        NextResponse.json(
          {
            success: true,
            message: "Riwayat kehadiran anggota berhasil diambil",
            data: history,
            total: history.length,
          },
          { status: 200 }
        ),
        req
      );
    }

    // Default: Ambil statistik keseluruhan presensi
    const totalPresences = await presencesCollection.countDocuments({});
    const hadirCount = await presencesCollection.countDocuments({ status: "Hadir" });
    const izinCount = await presencesCollection.countDocuments({ status: "Izin" });
    const sakitCount = await presencesCollection.countDocuments({ status: "Sakit" });
    const alphaCount = await presencesCollection.countDocuments({ status: "Alpha" });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Statistik kehadiran berhasil diambil",
          data: {
            total_presences: totalPresences,
            hadir: hadirCount,
            izin: izinCount,
            sakit: sakitCount,
            alpha: alphaCount,
          },
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error("Error fetching presences:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat mengambil data presensi",
        },
        { status: 500 }
      ),
      req
    );
  }
}

/**
 * POST /api/attandance
 * Input / Update catatan kehadiran untuk suatu sesi kegiatan.
 * Mendukung Single Input maupun Bulk / Batch Input.
 * Syarat:
 * 1. Sesi kegiatan (session_id) harus sudah dibuat terlebih dahulu.
 * 2. Hanya anggota yang berstatus 'aktif' yang dapat diabsen.
 * 3. Idempotent: Mengupdate jika sudah ada (mencegah duplikat sesi + user_id).
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
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const sessionsCollection = db.collection("sessions");
    const presencesCollection = db.collection("presences");
    const membersCollection = db.collection("user_member");

    // Format BATCH / BULK: jika terdapat array "attendances"
    if (Array.isArray(body.attendances)) {
      const bulkValidation = bulkAttendanceSchema.safeParse(body);
      if (!bulkValidation.success) {
        return withCors(
          NextResponse.json(
            {
              success: false,
              message: bulkValidation.error.issues[0].message,
              errors: bulkValidation.error.issues,
            },
            { status: 400 }
          ),
          req
        );
      }

      const { session_id, attendances } = bulkValidation.data;

      // 1. Verifikasi keberadaan sesi
      const session = await sessionsCollection.findOne({ session_id });
      if (!session) {
        return withCors(
          NextResponse.json(
            {
              success: false,
              message: `Sesi kegiatan dengan ID '${session_id}' tidak ditemukan. Harap buat sesi terlebih dahulu.`,
            },
            { status: 404 }
          ),
          req
        );
      }

      // 2. Ambil seluruh data member yang akan diabsen
      const inputUserIds = attendances.map((a) => a.user_id);
      const members = await membersCollection
        .find({ user_id: { $in: inputUserIds } })
        .toArray();

      const memberMap = new Map(members.map((m) => [m.user_id, m]));

      let processedCount = 0;
      let rejectedMembers: { user_id: string; reason: string }[] = [];
      const now = new Date();

      for (const item of attendances) {
        const member = memberMap.get(item.user_id);

        // Validasi: Member harus ada
        if (!member) {
          rejectedMembers.push({
            user_id: item.user_id,
            reason: "Anggota tidak terdaftar",
          });
          continue;
        }

        // Validasi: Status member WAJIB 'aktif'
        if (member.status !== "aktif") {
          rejectedMembers.push({
            user_id: item.user_id,
            reason: `Status anggota '${member.name}' adalah '${member.status}' (hanya anggota aktif yang dapat diabsen)`,
          });
          continue;
        }

        // Upsert kehadiran (idempotent, no duplicates)
        const uniquePresencesId = `PRS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        await presencesCollection.updateOne(
          { session_id, user_id: item.user_id },
          {
            $set: {
              status: item.status,
              keterangan: item.keterangan || "",
              updated_at: now,
              updated_by: auth.user.user_id,
            },
            $setOnInsert: {
              presences_id: uniquePresencesId,
              session_id,
              user_id: item.user_id,
              created_at: now,
            },
          },
          { upsert: true }
        );

        processedCount++;
      }

      return withCors(
        NextResponse.json(
          {
            success: true,
            message: `Presensi berhasil disimpan: ${processedCount} anggota berhasil dicatat.`,
            processed_count: processedCount,
            rejected_count: rejectedMembers.length,
            rejected_members: rejectedMembers.length > 0 ? rejectedMembers : undefined,
          },
          { status: 200 }
        ),
        req
      );
    }

    // Format SINGLE: satu anggota per request
    const singleValidation = singleAttendanceSchema.safeParse(body);
    if (!singleValidation.success) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: singleValidation.error.issues[0].message,
            errors: singleValidation.error.issues,
          },
          { status: 400 }
        ),
        req
      );
    }

    const { session_id, user_id, status, keterangan } = singleValidation.data;

    // 1. Verifikasi keberadaan sesi
    const session = await sessionsCollection.findOne({ session_id });
    if (!session) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: `Sesi kegiatan dengan ID '${session_id}' tidak ditemukan. Harap buat sesi terlebih dahulu.`,
          },
          { status: 404 }
        ),
        req
      );
    }

    // 2. Verifikasi member dan status aktif
    const member = await membersCollection.findOne({ user_id });
    if (!member) {
      return withCors(
        NextResponse.json(
          { success: false, message: `Anggota dengan ID '${user_id}' tidak ditemukan` },
          { status: 404 }
        ),
        req
      );
    }

    // SYARAT KHUSUS: Hanya member aktif yang bisa diabsen
    if (member.status !== "aktif") {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: `Gagal mencatat presensi: Anggota '${member.name}' berstatus '${member.status}'. Hanya anggota yang berstatus 'aktif' yang dapat diabsen.`,
          },
          { status: 400 }
        ),
        req
      );
    }

    // 3. Upsert record presensi
    const now = new Date();
    const uniquePresencesId = `PRS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const updateResult = await presencesCollection.updateOne(
      { session_id, user_id },
      {
        $set: {
          status,
          keterangan: keterangan || "",
          updated_at: now,
          updated_by: auth.user.user_id,
        },
        $setOnInsert: {
          presences_id: uniquePresencesId,
          session_id,
          user_id,
          created_at: now,
        },
      },
      { upsert: true }
    );

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: `Presensi anggota '${member.name}' berhasil dicatat sebagai '${status}'`,
          data: {
            session_id,
            user_id,
            member_name: member.name,
            status,
            keterangan: keterangan || "",
            updated_at: now,
          },
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error("Error processing attendance submission:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat memproses presensi",
        },
        { status: 500 }
      ),
      req
    );
  }
}

/**
 * DELETE /api/attandance
 * Membatalkan / menghapus catatan presensi tertentu (?session_id=...&user_id=...)
 */
export async function DELETE(req: NextRequest) {
  const auth = await authenticateAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    const { searchParams } = req.nextUrl;
    const session_id = searchParams.get("session_id");
    const user_id = searchParams.get("user_id");

    if (!session_id || !user_id) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Parameter 'session_id' dan 'user_id' wajib disertakan",
          },
          { status: 400 }
        ),
        req
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const presencesCollection = db.collection("presences");

    const result = await presencesCollection.deleteOne({ session_id, user_id });

    if (result.deletedCount === 0) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Catatan presensi tidak ditemukan" },
          { status: 404 }
        ),
        req
      );
    }

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Catatan presensi berhasil direset / dibatalkan",
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error("Error deleting attendance record:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat membatalkan presensi",
        },
        { status: 500 }
      ),
      req
    );
  }
}

export const OPTIONS = handleOptions;
