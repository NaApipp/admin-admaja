import clientPromise from "@/app/lib/mongodb";
import z from "zod";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/app/lib/cors";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    let uploadedImageUrl = "";

    // validasi & upload image jika ada
    if (imageFile && imageFile.name && imageFile.type.startsWith("image/")) {
      if (imageFile.size > 2 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: "Ukuran gambar maksimal 2MB" }, { status: 400 });
      }

      // convert ke buffer
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // upload ke cloudinary
      const upload = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "content_admaja" }, (err, result) => {
            if (err) reject(err);
            resolve(result);
          })
          .end(buffer);
      });

      if (!upload) {
        throw new Error("Cloudinary upload failed: No result");
      }
      uploadedImageUrl = upload.secure_url;
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const collection = db.collection("content");

    // Ambil field lain dari formData, bukan request.json()
    const body = {
      title: formData.get("title")?.toString() || "",
      content: formData.get("content")?.toString() || "",
      label: formData.get("label")?.toString() || "",
      image: uploadedImageUrl || formData.get("image")?.toString() || "",
      author: formData.get("author")?.toString() || "",
    };

    const schema = z.object({
      title: z
        .string()
        .min(3, "Title minimal 3 karakter")
        .max(150, "Title maksimal 150 karakter"),
     
      content: z
        .string()
        .min(3, "Content minimal 3 karakter")
        .max(150, "Content maksimal 150 karakter"),
     
      label: z
        .string()
        .min(1, "Label minimal 3 karakter")
        .max(150, "Label maksimal 150 karakter"),
     
      author: z
        .string()
        .min(1, "Author minimal 3 karakter")
        .max(150, "Author maksimal 150 karakter"),
      image: z
        .string()
        .min(1, "Author minimal 3 karakter")
        .max(150, "Author maksimal 150 karakter"),
     
    });

    const validation = schema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json({ success: false, errors }, { status: 422 });
    }

    const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const content_id = `ADMJ-CONTENT-${uniqueId}`;

    const {
      title,
      content,
      label,
      author,
      image,
    } = validation.data;

    const result = await collection.insertOne({
      content_id,
      title,
      content,
      label,
      image,
      times: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      relation: {
        author,
      },
    });

    return Response.json({ success: true, data: result}, {headers: corsHeaders});
  } catch (error) {
    console.error("Error adding news:", error);
    return Response.json({ success: false, error: "Failed to add news" });
  }
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const collection = db.collection("content");

    // const result = await collection.find({}).toArray();

    // return Response.json({ success: true, data: result });

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "12")); // cap max limit
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

     // 4. Bangun filter query
    const filter: Record<string, any> = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ];
    }

    // 5. Query dengan pagination + exclude field sensitif
    const [items, total] = await Promise.all([
      collection
        .find(filter, { projection: { password: 0 } }) // jangan expose password
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    // 6. Response konsisten
    return NextResponse.json({
      message: "Data berhasil diambil",
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("Error getting news:", error);
    return Response.json({ success: false, error: "Failed to get news" });
  }
}