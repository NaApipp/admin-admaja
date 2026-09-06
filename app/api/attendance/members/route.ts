import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { authenticateAdmin } from "@/app/lib/auth-admin";

/**
 * GET /api/attandance/members
 * Mengambil daftar seluruh anggota yang berstatus "aktif" saja.
 * Jika parameter ?session_id=... disertakan, status presensi pada sesi tersebut akan dilampirkan.
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

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const membersCollection = db.collection("user_member");
    const presencesCollection = db.collection("presences");

    // Filter KHUSUS: Hanya yang berstatus "aktif"
    const activeMembers = await membersCollection
      .find({ status: "aktif" })
      .sort({ name: 1 })
      .toArray();

    // Jika ada session_id, ambil presensi yang sudah tercatat
    let presenceMap = new Map<string, any>();
    if (session_id) {
      const presences = await presencesCollection
        .find({ session_id })
        .toArray();
      presences.forEach((p) => {
        presenceMap.set(p.user_id, p);
      });
    }

    const data = activeMembers.map((m) => {
      const rec = session_id ? presenceMap.get(m.user_id) : null;
      return {
        user_id: m.user_id,
        name: m.name,
        nisn: m.nisn || "",
        kelas: m.kelas || "",
        angkatan: m.angkatan || "",
        status_member: m.status,
        status: rec ? rec.status : null,
        keterangan: rec ? rec.keterangan || "" : "",
        updated_at: rec ? rec.updated_at : null,
      };
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Daftar anggota aktif untuk presensi berhasil diambil",
          data,
          total: data.length,
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error("Error fetching active members for attendance:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat mengambil data anggota aktif",
        },
        { status: 500 }
      ),
      req
    );
  }
}

export const OPTIONS = handleOptions;
