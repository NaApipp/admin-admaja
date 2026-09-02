import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { withCors, handleOptions } from "@/app/lib/cors";
import { jwtVerify } from "jose";
import { z } from "zod";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> },
) {
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

    const { user_id } = await params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const electionCollection = db.collection("user_member");

    // Support deleting by either MongoDB _id (if valid ObjectId) or user_id string
    let query: any = {};
    if (ObjectId.isValid(user_id)) {
      query = { $or: [{ _id: new ObjectId(user_id) }, { user_id }] };
    } else {
      query = { user_id };
    }

    const result = await electionCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Data User tidak ditemukan" },
          { status: 404 },
        ),
        req,
      );
    }

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Data User Berhasil di hapus",
        },
        { status: 200 },
      ),
      req,
    );
  } catch (error) {
    console.error("Error processing elections deletion:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan saat memproses penghapusan",
        },
        { status: 500 },
      ),
      req,
    );
  }
}

// Schema Zod hanya untuk update status
const updateStatusSchema = z.object({
  status: z.enum(["aktif", "nonaktif", "purna"], {
    message: "Status harus berupa 'aktif', 'nonaktif', atau 'purna'",
  }),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> },
) {
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

    const { user_id } = await params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const electionCollection = db.collection("user_member");

    // Support updating by either MongoDB _id (if valid ObjectId) or user_id string
    let query: any = {};
    if (ObjectId.isValid(user_id)) {
      query = { $or: [{ _id: new ObjectId(user_id) }, { user_id }] };
    } else {
      query = { user_id };
    }

    const body = await req.json();

    // VALIDASI ZOD (Hanya status)
    const parseResult = updateStatusSchema.safeParse(body);

    if (!parseResult.success) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: parseResult.error.issues[0].message,
          },
          { status: 400 },
        ),
        req,
      );
    }

    const { status } = parseResult.data;

    const updateResult = await electionCollection.updateOne(query, {
      $set: {
        status,
        updatedAt: new Date(),
      },
    });

    if (updateResult.matchedCount === 0) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Data user tidak ditemukan" },
          { status: 404 },
        ),
        req,
      );
    }

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Status user berhasil diperbarui",
          data: {
            user_id,
            status,
          },
        },
        { status: 200 },
      ),
      req,
    );
  } catch (error) {
    console.error("Error processing user update:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan saat memproses update",
        },
        { status: 500 },
      ),
      req,
    );
  }
}

export const OPTIONS = handleOptions;
