export type TransparencyStatus = 
  | 'BERSUMBER' 
  | 'KALIBRASI' 
  | 'ASUMSI' 
  | 'ILUSTRASI' 
  | 'FIKTIF';

export type BwbStatus = 
  | 'AMAN' 
  | 'SIAGA' 
  | 'TERLEWAT' 
  | 'SIAGA_SEBAGIAN';

export interface Region {
  kode_bps: string;
  nama: string;
  provinsi: string;
  penduduk?: number;
  luas_km2?: number;
  lat: number;
  lon: number;
  n_rs: number;
}

export interface Facility {
  kode_rs: string;
  nama: string;
  kode_wilayah: string;
  tipe: string;
  lat: number;
  lon: number;
  tempat_tidur: number;
  tt_isolasi?: number;
  tt_icu?: number;
  kapasitas_oksigen_liter_per_hari?: number;
  stok_apd_n95?: number;
  stok_obat_suportif_dosis?: number;
  tenaga_kesehatan_perawat?: number;
}

export interface LeadTime {
  persiapan: string;
  lead_time_min_hari: number;
  lead_time_max_hari: number;
  dasar: string;
  status_data: TransparencyStatus;
}

export interface BorObs {
  tanggal: string;
  pasien_isolasi: number;
  kapasitas_isolasi: number;
  pasien_icu: number;
  kapasitas_icu: number;
  catatan?: string;
  sumber?: string;
}

export interface Event2021 {
  id: string;
  tanggal: string;
  judul: string;
  deskripsi: string;
  jenis: 'krisis' | 'kebijakan' | 'respons' | 'sinyal';
  dampak_sistem?: string;
}

export interface PathogenProfile {
  nama: string;
  deskripsi: string;
  r_min: number;
  r_nilai: number;
  r_max: number;
  inkubasi_hari: number;
  infeksius_hari: number;
  rasio_okupansi_isolasi: number;
  rasio_okupansi_icu: number;
  kebutuhan_o2_lpm_per_pasien: number;
  jalur_penularan: string;
  tahan_di_permukaan: string;
  ketahanan_lingkungan_catatan: string;
  terapi_dan_alat: string[];
  status_profil: TransparencyStatus;
}

export interface EntryPoint {
  kode: string;
  nama: string;
  jenis: string;
  wilayah: string;
  volume_wisman_per_bulan?: number;
  peringkat?: number;
}

export interface DailyCase {
  tanggal: string;
  kasus: number;
}

export interface BwbItemResult {
  sumberDaya: string;
  penuhDalamMinHari: number;
  penuhDalamMaxHari: number;
  leadTimeMinHari: number;
  leadTimeMaxHari: number;
  tanggalPenuhMin: string;
  tanggalPenuhMax: string;
  bwbMin: string;
  bwbMax: string;
  status: BwbStatus;
  tindakanDisarankan: string;
  adaData: boolean;
}

