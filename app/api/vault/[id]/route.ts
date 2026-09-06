import { withCors, handleOptions } from "@/app/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import clientPromise from "@/app/lib/mongodb";
import { encryptPassword, decryptPassword } from "@/app/lib/crypto";
import { ObjectId } from "mongodb";
import { z } from "zod";

const updateVaultSchema = z.object({
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
    console.error("JWT verification error in vault/[id]:", error);
    return { success: false, error: "Token tidak valid atau telah kedaluwarsa", status: 401 };
  }
}

/**
 * GET /api/vault/[id]
 * Mengambil detail kredensial tunggal dan mendekripsi passwordnya.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateSuperAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const vaultCollection = db.collection("vault_credentials");

    let query: Record<string, any> = {};
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { vault_id: id }] };
    } else {
      query = { vault_id: id };
    }

    const item = await vaultCollection.findOne(query);
    if (!item) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Kredensial tidak ditemukan" },
          { status: 404 }
        ),
        req
      );
    }

    const plainPassword = item.encrypted_password
      ? decryptPassword(item.encrypted_password)
      : "";

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Detail kredensial berhasil diambil",
          data: {
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
          },
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error("Error fetching single vault item:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan server saat mengambil detail kredensial",
        },
        { status: 500 }
      ),
      req
    );
  }
}

/**
 * PUT /api/vault/[id]
 * Memperbarui kredensial berdasarkan ID pada URL path.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateSuperAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    const { id } = await params;
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

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const vaultCollection = db.collection("vault_credentials");
    const auditCollection = db.collection("vault_audit_logs");

    let query: Record<string, any> = {};
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { vault_id: id }] };
    } else {
      query = { vault_id: id };
    }

    const existing = await vaultCollection.findOne(query);
    if (!existing) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Kredensial tidak ditemukan" },
          { status: 404 }
        ),
        req
      );
    }

    const { account_name, platform, username, password, notes } = validation.data;
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

    await auditCollection.insertOne({
      audit_id: `AUDIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      vault_id: existing.vault_id || id,
      action: "UPDATE",
      performed_by: auth.user.user_id,
      performed_by_name: auth.user.name || auth.user.username || "Super Admin",
      details: `Memperbarui kredensial: ${account_name || existing.account_name} (${platform || existing.platform})`,
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
    console.error("Error updating vault item:", error);
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
 * DELETE /api/vault/[id]
 * Menghapus kredensial berdasarkan ID pada URL path.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateSuperAdmin(req);
  if (!auth.success) {
    return withCors(
      NextResponse.json({ success: false, message: auth.error }, { status: auth.status }),
      req
    );
  }

  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const vaultCollection = db.collection("vault_credentials");
    const auditCollection = db.collection("vault_audit_logs");

    let query: Record<string, any> = {};
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { vault_id: id }] };
    } else {
      query = { vault_id: id };
    }

    const existing = await vaultCollection.findOne(query);
    if (!existing) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Kredensial tidak ditemukan" },
          { status: 404 }
        ),
        req
      );
    }

    await vaultCollection.deleteOne(query);

    await auditCollection.insertOne({
      audit_id: `AUDIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      vault_id: existing.vault_id || id,
      action: "DELETE",
      performed_by: auth.user.user_id,
      performed_by_name: auth.user.name || auth.user.username || "Super Admin",
      details: `Menghapus kredensial: ${existing.account_name} (${existing.platform})`,
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
    console.error("Error deleting vault item:", error);
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
