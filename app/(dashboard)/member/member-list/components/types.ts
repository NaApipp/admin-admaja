export interface Member {
  _id?: string;
  user_id: string;
  name: string;
  nisn: string;
  angkatan: string;
  kelas: string;
  status: "aktif" | "tidak aktif" | "nonaktif" | "purna";
  createdAt?: string;
  updatedAt?: string;
}

export type StatusFilter = "semua" | "aktif" | "tidak aktif" | "purna";
