import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, JWTPayload } from "jose";
import clientPromise from "@/app/lib/mongodb";
import { encryptPassword, decryptPassword } from "@/app/lib/crypto";
import { z } from "zod";
import { ObjectId } from "mongodb";

// Schema validasi pembuatan kredensial baru
const createVaultSchema = z.object({
  account_name: z
    .string()
    .trim()
    .min(2, "Nama akun minimal 2 karakter")
    .max(100, "Nama akun maksimal 100 karakter"),
  platform: z
    .string()
    .trim()
    .min(2, "Platform minimal 2 karakter")
    .max(50, "Platform maksimal 50 karakter"),
  username: z
    .string()
    .trim()
    .min(1, "Username / Email minimal 1 karakter")
    .max(100, "Username / Email maksimal 100 karakter"),
  password: z
    .string()
    .min(1, "Password minimal 1 karakter")
    .max(255, "Password maksimal 255 karakter"),
  notes: z
    .string()
    .max(500, "Catatan maksimal 500 karakter")
    .optional()
    .or(z.literal("")),
});

// Schema validasi update kredensial
const updateVaultSchema = z.object({
  id: z.string().optional(),
  vault_id: z.string().optional(),
  account_name: z.string().trim().min(2).max(100).optional(),
  platform: z.string().trim().min(2).max(50).optional(),
  username: z.string().trim().min(1).max(100).optional(),
  password: z.string().min(1).max(255).optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

interface SuperAdminUser {
  user_id: string;
  name?: string;
  username?: string;
  role: string;
}

type AuthResult =
  | { success: false; error: string; status: number }
  | { success: true; user: SuperAdminUser };

/**
 * Helper untuk verifikasi sesi dan otorisasi Super Admin
 */
async function authenticateSuperAdmin(req: NextRequest): Promise<AuthResult> {
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return { success: false, error: "Unauthorized: Silakan login terlebih dahulu", status: 401 };
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default_secret"
    );
    const { payload } = await jwtVerify(token, secret);

    if (!payload || !payload.user_id) {
      return { success: false, error: "Sesi tidak valid, silakan login ulang", status: 401 };
    }

    // RBAC: Hanya role super_admin yang diizinkan mengakses vault
    if (payload.role !== "super_admin") {
      return {
        success: false,
        error:
          "Forbidden: Anda tidak memiliki wewenang untuk mengakses Password Saver (Khusus Super Admin)",
        status: 403,
      };
    }

    return {
      success: true,
      user: {
        user_id: String(payload.user_id),
        name: typeof payload.name === "string" ? payload.name : undefined,
        username: typeof payload.username === "string" ? payload.username : undefined,
        role: String(payload.role),
      },
    };
  } catch (error) {
    console.error("JWT verification error in vault:", error);
    return { success: false, error: "Token tidak valid atau telah kedaluwarsa", status: 401 };
  }
}

/**
 * GET /api/vault
 * Mengambil seluruh data kredensial di Password Saver (Khusus Super Admin).
 * Mendukung filter query:
 * - ?type=audit -> Mengambil riwayat audit log vault
 * - ?search=... -> Mencari berdasarkan nama akun / platform / username
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateSuperAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type");

    // Jika meminta riwayat audit log
    if (type === "audit" || type === "logs") {
      const auditCollection = db.collection("vault_audit_logs");
      const logs = await auditCollection
        .find({})
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();

      return withCors(
        NextResponse.json(
          {
            success: true,
            message: "Riwayat audit log vault berhasil diambil",
            data: logs,
            total: logs.length,
          },
          { status: 200 }
        ),
        req
      );
    }

    // Default: Ambil daftar kredensial
    const vaultCollection = db.collection("vault_credentials");
    const search = searchParams.get("search");

    let query: Record<string, any> = {};
    if (search) {
      query = {
        $or: [
          { account_name: { $regex: search, $options: "i" } },
          { platform: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ],
      };
    }

    const items = await vaultCollection
      .find(query)
      .sort({ updated_at: -1, created_at: -1 })
      .toArray();

    // Dekripsi password untuk masing-masing kredensial agar dapat dilihat Super Admin
    const decryptedItems = items.map((item) => {
      const plainPassword = item.encrypted_password
        ? decryptPassword(item.encrypted_password)
        : "";

      return {
        id: item.vault_id || item._id.toString(),
        vault_id: item.vault_id || item._id.toString(),
        _id: item._id,
        account_name: item.account_name,
        platform: item.platform,
        username: item.username,
        password: plainPassword,
        notes: item.notes || "",
        created_by: item.created_by,
        created_by_name: item.created_by_name || null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Data vault credentials berhasil diambil",
          data: decryptedItems,
          total: decryptedItems.length,
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error("Error fetching vault credentials:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat mengambil data vault",
        },
        { status: 500 }
      ),
      req
    );
  }
}

/**
 * POST /api/vault
 * Menambahkan kredensial baru dengan enkripsi simetris AES-256-GCM.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateSuperAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    const body = await req.json();
    const validation = createVaultSchema.safeParse(body);

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

    const { account_name, platform, username, password, notes } = validation.data;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const vaultCollection = db.collection("vault_credentials");
    const auditCollection = db.collection("vault_audit_logs");

    // Cek duplikasi platform & username
    const existing = await vaultCollection.findOne({
      platform: { $regex: `^${platform.trim()}$`, $options: "i" },
      username: username.trim(),
    });

    if (existing) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: `Kredensial untuk akun '${username}' di platform '${platform}' sudah tersimpan`,
          },
          { status: 409 }
        ),
        req
      );
    }

    // Enkripsi password menggunakan AES-256-GCM
    const encryptedPassword = encryptPassword(password);

    const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const vault_id = `VAULT-${uniqueId}`;
    const now = new Date();

    const newCredential = {
      vault_id,
      account_name,
      platform,
      username,
      encrypted_password: encryptedPassword,
      notes: notes || "",
      created_by: auth.user.user_id,
      created_by_name: auth.user.name || auth.user.username || "Super Admin",
      created_at: now,
      updated_at: now,
    };

    await vaultCollection.insertOne(newCredential);

    // Catat ke audit log
    await auditCollection.insertOne({
      audit_id: `AUDIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      vault_id,
      action: "CREATE",
      performed_by: auth.user.user_id,
      performed_by_name: auth.user.name || auth.user.username || "Super Admin",
      details: `Menambahkan kredensial akun: ${account_name} (${platform})`,
      timestamp: now,
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Kredensial berhasil disimpan dengan aman ke Password Saver",
          data: {
            id: vault_id,
            vault_id,
            account_name,
            platform,
            username,
            notes: notes || "",
            created_at: now,
          },
        },
        { status: 201 }
      ),
      req
    );
  } catch (error) {
    console.error("Error creating vault credential:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat menyimpan kredensial",
        },
        { status: 500 }
      ),
      req
    );
  }
}

/**
 * PUT /api/vault
 * Memperbarui data kredensial vault yang ada.
 */
export async function PUT(req: NextRequest) {
  const auth = await authenticateSuperAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    const body = await req.json();
    const validation = updateVaultSchema.safeParse(body);

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

    const { id, vault_id, account_name, platform, username, password, notes } = validation.data;
    const targetId = vault_id || id || req.nextUrl.searchParams.get("id") || req.nextUrl.searchParams.get("vault_id");

    if (!targetId) {
      return withCors(
        NextResponse.json(
          { success: false, message: "ID kredensial wajib disertakan" },
          { status: 400 }
        ),
        req
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const vaultCollection = db.collection("vault_credentials");
    const auditCollection = db.collection("vault_audit_logs");

    let query: Record<string, any> = {};
    if (ObjectId.isValid(targetId)) {
      query = { $or: [{ _id: new ObjectId(targetId) }, { vault_id: targetId }] };
    } else {
      query = { vault_id: targetId };
    }

    const existing = await vaultCollection.findOne(query);
    if (!existing) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Data kredensial tidak ditemukan" },
          { status: 404 }
        ),
        req
      );
    }

    const updateFields: Record<string, any> = {
      updated_at: new Date(),
    };

    if (account_name) updateFields.account_name = account_name;
    if (platform) updateFields.platform = platform;
    if (username) updateFields.username = username;
    if (notes !== undefined) updateFields.notes = notes;
    if (password) {
      updateFields.encrypted_password = encryptPassword(password);
    }

    await vaultCollection.updateOne(query, { $set: updateFields });

    // Catat ke audit log
    await auditCollection.insertOne({
      audit_id: `AUDIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      vault_id: existing.vault_id || targetId,
      action: "UPDATE",
      performed_by: auth.user.user_id,
      performed_by_name: auth.user.name || auth.user.username || "Super Admin",
      details: `Memperbarui kredensial akun: ${account_name || existing.account_name} (${platform || existing.platform})`,
      timestamp: new Date(),
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Data kredensial berhasil diperbarui",
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error("Error updating vault credential:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat memperbarui kredensial",
        },
        { status: 500 }
      ),
      req
    );
  }
}

/**
 * DELETE /api/vault
 * Menghapus data kredensial vault (menerima ?id=... atau { id: "..." } di body).
 */
export async function DELETE(req: NextRequest) {
  const auth = await authenticateSuperAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    let targetId = req.nextUrl.searchParams.get("id") || req.nextUrl.searchParams.get("vault_id");

    if (!targetId) {
      try {
        const body = await req.json();
        targetId = body.id || body.vault_id;
      } catch {
        // Body opsional jika sudah ada di searchParams
      }
    }

    if (!targetId) {
      return withCors(
        NextResponse.json(
          { success: false, message: "ID kredensial wajib disertakan untuk penghapusan" },
          { status: 400 }
        ),
        req
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const vaultCollection = db.collection("vault_credentials");
    const auditCollection = db.collection("vault_audit_logs");

    let query: Record<string, any> = {};
    if (ObjectId.isValid(targetId)) {
      query = { $or: [{ _id: new ObjectId(targetId) }, { vault_id: targetId }] };
    } else {
      query = { vault_id: targetId };
    }

    const existing = await vaultCollection.findOne(query);
    if (!existing) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Data kredensial tidak ditemukan" },
          { status: 404 }
        ),
        req
      );
    }

    await vaultCollection.deleteOne(query);

    // Catat ke audit log
    await auditCollection.insertOne({
      audit_id: `AUDIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      vault_id: existing.vault_id || targetId,
      action: "DELETE",
      performed_by: auth.user.user_id,
      performed_by_name: auth.user.name || auth.user.username || "Super Admin",
      details: `Menghapus kredensial akun: ${existing.account_name} (${existing.platform})`,
      timestamp: new Date(),
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Kredensial berhasil dihapus dari Password Saver",
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error("Error deleting vault credential:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat menghapus kredensial",
        },
        { status: 500 }
      ),
      req
    );
  }
}

export const OPTIONS = handleOptions;