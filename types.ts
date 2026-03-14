
export interface MeetingDetail {
  id: number;
  model: string;
  methods: string[];
}

export interface RPPData {
  satuanPendidikan: string;
  namaGuru: string;
  nipGuru: string;
  namaKepala: string;
  nipKepala: string;
  fase: string;
  kelas: string;
  mapel: string;
  tahunPelajaran: string;
  semester: string;
  kesiapanMurid: string;
  cp: string;
  tp: string;
  topik: string;
  jumlahPertemuan: number;
  pertemuanDetails: MeetingDetail[];
  dimensiProfil: string[];
  topikPancaCinta: string[];
}

export interface GeneratedContent {
  integrasiKBC: string;
  lintasDisiplin: string;
  kemitraan: string;
  lingkungan: string;
  pemanfaatanDigital: string;
  pengalamanBelajar: {
    pertemuan: number;
    memahami: string[];
    mengaplikasi: string[];
    refleksi: string[];
  }[];
  asesmenAwal: string;
  asesmenProses: string;
  asesmenAkhir: string;
  lkpd: {
    pertemuan: number;
    isi: string;
  }[];
}
