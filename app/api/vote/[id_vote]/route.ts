import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { withCors, handleOptions } from "@/app/lib/cors";
import { jwtVerify } from "jose";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id_vote: string }> },
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

    const { id_vote } = await params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const electionCollection = db.collection("votes");

    // Support deleting by either MongoDB _id (if valid ObjectId) or id_vote string
    let query: any = {};
    if (ObjectId.isValid(id_vote)) {
      query = { $or: [{ _id: new ObjectId(id_vote) }, { id_vote }] };
    } else {
      query = { id_vote };
    }

    const result = await electionCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Data Suara tidak ditemukan" },
          { status: 404 },
        ),
        req,
      );
    }

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Data Suara Berhasil di hapus",
        },
        { status: 200 },
      ),
      req,
    );
  } catch (error) {
    console.error("Error processing votes deletion:", error);
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

export const OPTIONS = handleOptions;
