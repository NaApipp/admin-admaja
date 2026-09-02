import ElectionsReview from "./ElectionsReview";

export const metadata = {
  title: "Review Pemilu & Suara Masuk | Dashboard Admin Admaja",
  description:
    "Audit dan review hasil pemilihan ketua, perolehan suara per kandidat, dan rincian pemilih.",
};

export default function ElectionsReviewPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <ElectionsReview />
    </div>
  );
}
