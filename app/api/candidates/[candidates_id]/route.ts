import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCorsHeaders, handleOptions } from "@/app/lib/cors";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ candidates_id: string }> },
) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  try {
    const { candidates_id } = await params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const usersCollection = db.collection("candidates");

    // Support deleting by either MongoDB _id (if valid ObjectId) or candidates_id string
    let query: any = {};
    if (ObjectId.isValid(candidates_id)) {
      query = {
        $or: [{ _id: new ObjectId(candidates_id) }, { candidates_id }],
      };
    } else {
      query = { candidates_id };
    }

    const result = await usersCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Data Kandidat tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Kandidat Berhasil di hapus",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error processing candidates deletion:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memproses penghapusan",
      },
      { status: 500 },
    );
  }
}

export const OPTIONS = handleOptions;
