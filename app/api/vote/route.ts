import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/app/lib/mongodb";
import { withCors, handleOptions } from "@/app/lib/cors";

interface VoteRequestBody {
  elections_id: string;
  candidates_id: string;
  voter_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: VoteRequestBody = await req.json();
    const { elections_id, candidates_id, voter_id } = body;

    // 1. Validasi field wajib
    if (!elections_id || !candidates_id || !voter_id) {
      return withCors(
        NextResponse.json(
          { error: "elections_id, candidates_id, dan voter_id wajib diisi" },
          { status: 400 },
        ),
        req,
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);

    // Query helper untuk ID custom atau MongoDB ObjectId
    const electionQuery = ObjectId.isValid(elections_id)
      ? { $or: [{ _id: new ObjectId(elections_id) }, { elections_id }] }
      : { elections_id };

    // 2. Validasi periode pemilihan ada & berstatus dibuka
    const election = await db
      .collection("elections")
      .findOne(electionQuery);

    if (!election) {
      return withCors(
        NextResponse.json(
          { error: "Periode pemilihan tidak ditemukan" },
          { status: 404 },
        ),
        req,
      );
    }

    if (election.status !== "dibuka") {
      return withCors(
        NextResponse.json(
          { error: "Periode pemilihan belum dibuka atau sudah ditutup" },
          { status: 403 },
        ),
        req,
      );
    }

    // Query helper untuk candidate
    const candidateQuery = ObjectId.isValid(candidates_id)
      ? {
          $or: [{ _id: new ObjectId(candidates_id) }, { candidates_id }],
          elections_id: election.elections_id || elections_id,
        }
      : {
          candidates_id,
          elections_id: election.elections_id || elections_id,
        };

    // 3. Validasi kandidat ada & terdaftar di election ini
    const candidate = await db.collection("candidates").findOne(candidateQuery);

    if (!candidate) {
      return withCors(
        NextResponse.json(
          { error: "Kandidat tidak ditemukan pada periode pemilihan ini" },
          { status: 404 },
        ),
        req,
      );
    }

    // Query helper untuk voter
    const voterQuery = ObjectId.isValid(voter_id)
      ? { $or: [{ _id: new ObjectId(voter_id) }, { user_id: voter_id }] }
      : { user_id: voter_id };

    // 4. Validasi voter ada & berstatus aktif
    const voter = await db
      .collection("user_member")
      .findOne(voterQuery);

    if (!voter) {
      return withCors(
        NextResponse.json(
          { error: "Anggota (voter) tidak ditemukan" },
          { status: 404 },
        ),
        req,
      );
    }

    if (voter.status !== "aktif") {
      return withCors(
        NextResponse.json(
          { error: "Hanya anggota aktif yang berhak memilih" },
          { status: 403 },
        ),
        req,
      );
    }

    const resolvedElectionId = election.elections_id || elections_id;
    const resolvedCandidateId = candidate.candidates_id || candidates_id;
    const resolvedVoterId = voter.user_id || voter_id;

    // 5. Validasi belum pernah vote di periode ini
    const existingVote = await db.collection("votes").findOne({
      elections_id: resolvedElectionId,
      voter_id: resolvedVoterId,
    });

    if (existingVote) {
      return withCors(
        NextResponse.json(
          { error: "Anda sudah memilih pada periode pemilihan ini" },
          { status: 409 },
        ),
        req,
      );
    }

    // 6. Simpan suara
    try {
      const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const id_vote = `VOTE-${uniqueId}`;

      const result = await db.collection("votes").insertOne({
        id_vote: id_vote,
        elections_id: resolvedElectionId,
        candidates_id: resolvedCandidateId,
        voter_id: resolvedVoterId,
        waktu_vote: new Date(),
      });

      return withCors(
        NextResponse.json(
          {
            success: true,
            message: "Suara berhasil disimpan",
            data: {
              id_vote,
              elections_id: resolvedElectionId,
              candidates_id: resolvedCandidateId,
              voter_id: resolvedVoterId,
            },
          },
          { status: 201 },
        ),
        req,
      );
    } catch (err: unknown) {
      // Lapisan pengaman terakhir race condition (duplicate key error)
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === 11000
      ) {
        return withCors(
          NextResponse.json(
            { error: "Anda sudah memilih pada periode pemilihan ini" },
            { status: 409 },
          ),
          req,
        );
      }
      throw err;
    }
  } catch (error) {
    console.error("Error saat submit vote:", error);
    return withCors(
      NextResponse.json(
        { error: "Terjadi kesalahan pada server" },
        { status: 500 },
      ),
      req,
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const elections_id = searchParams.get("elections_id");
    const candidates_id = searchParams.get("candidates_id");

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const votesCollection = db.collection("votes");
    const candidatesCollection = db.collection("candidates");
    const electionsCollection = db.collection("elections");

    // Jika difilter berdasarkan elections_id
    if (elections_id) {
      // 1. Ambil info pemilihan
      const election = await electionsCollection.findOne({ elections_id });

      // 2. Ambil semua kandidat untuk election ini
      const candidates = await candidatesCollection
        .find({ elections_id })
        .sort({ serial_number: 1 })
        .toArray();

      // 3. Ambil suara untuk election ini
      const voteQuery: { elections_id: string; candidates_id?: string } = {
        elections_id,
      };
      if (candidates_id) {
        voteQuery.candidates_id = candidates_id;
      }
      const rawVotes = await votesCollection.find(voteQuery).toArray();
      const totalVotesInElection = await votesCollection.countDocuments({ elections_id });

      // Ambil detail voter untuk setiap suara dari collection user_member
      const voterIds = rawVotes.map((v) => v.voter_id).filter(Boolean);
      const voters = await db
        .collection("user_member")
        .find({
          $or: [
            { user_id: { $in: voterIds } },
            ...voterIds
              .filter((id) => ObjectId.isValid(id))
              .map((id) => ({ _id: new ObjectId(id) })),
          ],
        })
        .toArray();

      const voterMap = new Map();
      voters.forEach((voter) => {
        if (voter.user_id) voterMap.set(String(voter.user_id), voter);
        if (voter._id) voterMap.set(String(voter._id), voter);
      });

      const enrichedVotes = rawVotes.map((v) => {
        const voterData = voterMap.get(String(v.voter_id));
        return {
          id_vote: v.id_vote,
          elections_id: v.elections_id,
          candidates_id: v.candidates_id,
          voter_id: v.voter_id,
          waktu_vote: v.waktu_vote,
          voter: voterData
            ? {
                name: voterData.name || voterData.nama || "Tanpa Nama",
                nipd: voterData.nipd || "-",
                kelas: voterData.kelas || "-",
                angkatan: voterData.angkatan || "-",
                status: voterData.status || "aktif",
              }
            : null,
        };
      });

      // 4. Hitung suara dan daftar pemilih per kandidat
      const candidateStats = candidates.map((cand) => {
        const candidateVotes = enrichedVotes.filter(
          (v) => v.candidates_id === cand.candidates_id,
        );
        const candidateVotesCount = candidateVotes.length;

        const percentage =
          totalVotesInElection > 0
            ? `${((candidateVotesCount / totalVotesInElection) * 100).toFixed(1)}%`
            : "0%";

        return {
          candidates_id: cand.candidates_id,
          serial_number: cand.serial_number,
          user: cand.user || cand.candidate_data?.name || "Kandidat",
          kelas: cand.kelas || cand.candidate_data?.kelas || "-",
          foto_url: cand.image || cand.foto_url || cand.candidate_data?.foto_url || "",
          vision_mission: cand.vision_mission || cand.visi_misi || null,
          total_votes: candidateVotesCount,
          percentage,
          voters: candidateVotes.map((cv) => ({
            id_vote: cv.id_vote,
            voter_id: cv.voter_id,
            waktu_vote: cv.waktu_vote,
            name: cv.voter?.name || "Anggota",
            nipd: cv.voter?.nipd || "-",
            kelas: cv.voter?.kelas || "-",
            angkatan: cv.voter?.angkatan || "-",
          })),
        };
      });

      // Jika ada filter spesifik kandidat
      if (candidates_id) {
        const selectedCandidate = candidateStats.find(
          (c) => c.candidates_id === candidates_id,
        );

        return withCors(
          NextResponse.json(
            {
              success: true,
              message: "Data suara kandidat berhasil diambil",
              data: {
                elections_id,
                election_name: election?.name || null,
                election_status: election?.status || null,
                candidate: selectedCandidate || null,
                total_votes_candidate: rawVotes.length,
                total_votes_election: totalVotesInElection,
                votes: enrichedVotes,
              },
            },
            { status: 200 },
          ),
          req,
        );
      }

      // Rekap seluruh kandidat dalam pemilihan tersebut
      return withCors(
        NextResponse.json(
          {
            success: true,
            message: "Rekap data suara pemilihan berhasil diambil",
            data: {
              elections_id,
              election_name: election?.name || null,
              election_status: election?.status || null,
              total_votes: totalVotesInElection,
              candidate_results: candidateStats,
              votes: enrichedVotes,
            },
          },
          { status: 200 },
        ),
        req,
      );
    }

    // Jika tidak ada query param elections_id (ambil semua data suara umum)
    const allVotes = await votesCollection.find({}).toArray();
    const totalAllVotes = allVotes.length;

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Semua data suara berhasil diambil",
          data: {
            total_votes: totalAllVotes,
            votes: allVotes,
          },
        },
        { status: 200 },
      ),
      req,
    );
  } catch (error) {
    console.error("Error retrieving votes stats:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Terjadi kesalahan saat mengambil statistik suara",
        },
        { status: 500 },
      ),
      req,
    );
  }
}

export const OPTIONS = handleOptions;