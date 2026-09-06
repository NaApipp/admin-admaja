export type PresenceStatus = "Hadir" | "Izin" | "Sakit" | "Alpha";

export interface SessionRekap {
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  total_absen: number;
  total_anggota_aktif: number;
}

export interface AttendanceSession {
  _id?: string;
  session_id: string;
  nama_kegiatan: string;
  desc_kegiatan: string;
  date: string;
  waktu_mulai: string;
  waktu_selesai: string;
  created_by: string;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
  rekap?: SessionRekap;
}

export interface MemberAttendanceItem {
  user_id: string;
  name: string;
  nisn: string;
  kelas: string;
  angkatan: string;
  status_member: string;
  presence_id: string | null;
  status: PresenceStatus | null;
  keterangan: string;
  updated_at: string | null;
}

export interface SessionDetailRekap {
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  belum_absen: number;
  total_member_aktif: number;
}

export interface AttendanceOverallStats {
  total_presences: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
}

export interface MemberAttendanceHistoryItem {
  presences_id: string;
  session_id: string;
  nama_kegiatan: string;
  date: string;
  status: PresenceStatus;
  keterangan: string;
  updated_at: string;
}
