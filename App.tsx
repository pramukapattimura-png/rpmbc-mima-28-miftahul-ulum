
import React, { useState } from 'react';
import { RPPData, GeneratedContent } from './types';
import { MODEL_PEMBELAJARAN, METODE_PEMBELAJARAN, DIMENSI_PROFIL, PANCA_CINTA, MATA_PELAJARAN } from './constants';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, Loader2, Download, ChevronRight, ChevronLeft, CheckCircle2, FileText } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [methodSearchQuery, setMethodSearchQuery] = useState<{ [key: number]: string }>({});
  
  const [formData, setFormData] = useState<RPPData>({
    satuanPendidikan: '',
    namaGuru: '',
    nipGuru: '',
    namaKepala: '',
    nipKepala: '',
    fase: 'A',
    kelas: '1',
    mapel: MATA_PELAJARAN[0],
    tahunPelajaran: '2025/2026',
    semester: 'Ganjil',
    kesiapanMurid: '',
    cp: '',
    tp: '',
    topik: '',
    jumlahPertemuan: 1,
    pertemuanDetails: [{ id: 1, model: 'LOK-R', methods: ['Metode Ceramah'] }],
    dimensiProfil: [],
    topikPancaCinta: []
  });

  const [generated, setGenerated] = useState<GeneratedContent | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (name: 'dimensiProfil' | 'topikPancaCinta', value: string) => {
    setFormData(prev => {
      const current = prev[name] || [];
      const next = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [name]: next };
    });
  };

  const handlePertemuanCountChange = (count: number) => {
    const safeCount = Math.max(1, count);
    setFormData(prev => {
      const newDetails = [...(prev.pertemuanDetails || [])];
      if (safeCount > newDetails.length) {
        for (let i = newDetails.length; i < safeCount; i++) {
          newDetails.push({ id: i + 1, model: 'LOK-R', methods: ['Metode Ceramah'] });
        }
      } else {
        newDetails.length = safeCount;
      }
      return { ...prev, jumlahPertemuan: safeCount, pertemuanDetails: newDetails };
    });
  };

  const updateMeetingModel = (index: number, value: string) => {
    setFormData(prev => {
      const newDetails = [...(prev.pertemuanDetails || [])];
      if (newDetails[index]) {
        newDetails[index] = { ...newDetails[index], model: value };
      }
      return { ...prev, pertemuanDetails: newDetails };
    });
  };

  const toggleMeetingMethod = (index: number, method: string) => {
    setFormData(prev => {
      const newDetails = [...(prev.pertemuanDetails || [])];
      if (!newDetails[index]) return prev;
      
      const currentMethods = newDetails[index].methods || [];
      const nextMethods = currentMethods.includes(method)
        ? currentMethods.filter(m => m !== method)
        : [...currentMethods, method];
      
      if (nextMethods.length === 0 && currentMethods.length > 0) return prev;

      newDetails[index] = { ...newDetails[index], methods: nextMethods };
      return { ...prev, pertemuanDetails: newDetails };
    });
  };

  const generateRPP = async () => {
    if (!formData.satuanPendidikan || !formData.namaGuru || !formData.mapel) {
      alert("Mohon lengkapi data Identitas terlebih dahulu.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Buatkan konten RPP MI detail untuk data berikut:
        Mapel: ${formData.mapel}, Topik: ${formData.topik}, CP: ${formData.cp}, TP: ${formData.tp}
        Jumlah Pertemuan: ${formData.jumlahPertemuan}
        Dimensi Profil Lulusan: ${(formData.dimensiProfil || []).join(', ')}
        Topik Panca Cinta: ${(formData.topikPancaCinta || []).join(', ')}
        Data per Pertemuan:
        ${(formData.pertemuanDetails || []).map((p, i) => `Pertemuan ${i+1}: Model ${p.model}, Metode: ${(p.methods || []).join(', ')}`).join('\n')}
        
        Berikan JSON dengan struktur berikut:
        {
          "integrasiKBC": "uraian materi integrasi KBC yang relevan",
          "lintasDisiplin": "uraian lintas disiplin ilmu",
          "kemitraan": "rekomendasi kemitraan pembelajaran",
          "lingkungan": "rekomendasi lingkungan pembelajaran",
          "pemanfaatanDigital": "daftar tools online relevan (misal: Canva, Quizizz)",
          "pengalamanBelajar": [
            {
              "pertemuan": 1,
              "memahami": ["langkah 1", "langkah 2", "langkah 3", "langkah 4", "langkah 5"],
              "mengaplikasi": ["langkah 1", "...", "langkah 20"],
              "refleksi": ["langkah 1", "langkah 2", "langkah 3", "langkah 4", "langkah 5"]
            }
          ],
          "asesmenAwal": "deskripsi singkat instrumen (misal: tes tulis pilihan ganda)",
          "asesmenProses": "deskripsi singkat instrumen (misal: observasi/LKPD)",
          "asesmenAkhir": "deskripsi singkat instrumen (misal: tes tulis/produk)",
          "asesmenAwalKonten": "konten lengkap instrumen asesmen awal (soal/rubrik/checklist) yang siap pakai",
          "asesmenProsesKonten": "konten lengkap instrumen asesmen proses (observasi/rubrik/LKPD) yang siap pakai",
          "asesmenAkhirKonten": "konten lengkap instrumen asesmen akhir (20 soal PG, 10 isian, 5 uraian + kunci jawaban) yang siap pakai",
          "lkpd": [
            {
              "pertemuan": 1,
              "isi": "Konten Lembar Kerja Peserta Didik (LKPD) yang SANGAT LENGKAP. WAJIB mencakup: 1. MATERI PEMBELAJARAN MENDALAM (Minimal 1000 kata, terstruktur dengan sub-bab, penjelasan detail, contoh konkret, dan ilustrasi kontekstual), 2. Instruksi tugas/aktivitas siswa yang menantang, 3. Rubrik Penilaian yang jelas. Sesuaikan konten dengan TP: ${formData.tp}, Model Pembelajaran: ${formData.pertemuanDetails[0]?.model}, dan Metode: ${formData.pertemuanDetails[0]?.methods.join(', ')}"
            }
          ]
        }
        PENTING: 
        1. Buat array "lkpd" sesuai jumlah pertemuan (${formData.jumlahPertemuan}). Setiap item harus disesuaikan dengan model dan metode pertemuan masing-masing.
        2. Integrasikan secara eksplisit nilai-nilai dari Dimensi Profil Lulusan (${(formData.dimensiProfil || []).join(', ')}) dan Topik Panca Cinta (${(formData.topikPancaCinta || []).join(', ')}) ke dalam setiap langkah "pengalamanBelajar" (Memahami, Mengaplikasi, Refleksi) agar pembelajaran lebih berkarakter, bermakna, dan sesuai dengan identitas madrasah.
        3. Untuk bagian "asesmenAwal", "asesmenProses", dan "asesmenAkhir", berikan DESKRIPSI UMUM SAJA (jangan terlalu detail) untuk ditampilkan di tabel utama RPP.
        4. Untuk bagian "asesmenAwalKonten", "asesmenProsesKonten", dan "asesmenAkhirKonten", berikan KONTEN LENGKAP DAN DETAIL (khusus asesmenAkhirKonten: 20 PG, 10 Isian, 5 Uraian + Kunci) untuk ditampilkan di bagian Lampiran. 
        PENTING: Gunakan judul bagian berikut untuk Asesmen Akhir:
        - "I. Pilihlah salah satu jawaban yang paling benar dengan memberi tanda silang !" (untuk Pilihan Ganda)
        - "II. Isilah titik - titik dibawah ini dengan jawaban yang benar !" (untuk Isian)
        - "III. Jawablah pertanyaan dibawah ini dengan benar !" (untuk Uraian)
        
        FORMAT KHUSUS ASESMEN AKHIR:
        - Opsi pilihan ganda (A, B, C, D) WAJIB diletakkan di baris baru (line break) di bawah teks soal. Tidak boleh menyambung di baris yang sama dengan soal.
        - Kunci Jawaban WAJIB dibuat terpisah di bagian paling bawah dengan urutan: 
          1. Kunci Jawaban Pilihan Ganda (List nomor 1-20 ke bawah)
          2. Kunci Jawaban Isian (List nomor 1-10 ke bawah)
          3. Kunci Jawaban Uraian (List nomor 1-5 ke bawah)
        
        5. WAJIB: Bagian "isi" pada "lkpd" harus berisi MATERI YANG SANGAT LENGKAP DAN MENDALAM (minimal 1000 kata per pertemuan). Gunakan sub-heading, poin-poin, dan penjelasan yang komprehensif agar guru memiliki bahan ajar yang utuh.
        6. WAJIB: Setiap rubrik penilaian HARUS disajikan dalam bentuk TABEL MARKDOWN dengan garis pembatas yang jelas.
        7. Gunakan format Markdown (seperti tabel, list, bold) di dalam string JSON untuk mempercantik tampilan konten. Pastikan tabel menggunakan format Markdown standar agar dapat dibaca dengan baik.
        8. Pastikan seluruh konten ditulis dengan lengkap tanpa terpotong (no truncation).
        Bahasa Indonesia formal, terstruktur, bermakna dan menggembirakan.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || '{}';
      
      // Robust JSON extraction: find the first '{' and last '}'
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      
      let cleanJson = text;
      if (startIdx !== -1 && endIdx !== -1) {
        cleanJson = text.substring(startIdx, endIdx + 1);
      }

      const result = JSON.parse(cleanJson);
      
      const safeResult: GeneratedContent = {
        integrasiKBC: result.integrasiKBC || '',
        lintasDisiplin: result.lintasDisiplin || '',
        kemitraan: result.kemitraan || '',
        lingkungan: result.lingkungan || '',
        pemanfaatanDigital: result.pemanfaatanDigital || '',
        pengalamanBelajar: Array.isArray(result.pengalamanBelajar) ? result.pengalamanBelajar.map((pb: any) => ({
          pertemuan: pb.pertemuan || 1,
          memahami: Array.isArray(pb.memahami) ? pb.memahami : [],
          mengaplikasi: Array.isArray(pb.mengaplikasi) ? pb.mengaplikasi : [],
          refleksi: Array.isArray(pb.refleksi) ? pb.refleksi : []
        })) : [],
        asesmenAwal: result.asesmenAwal || '',
        asesmenProses: result.asesmenProses || '',
        asesmenAkhir: result.asesmenAkhir || '',
        asesmenAwalKonten: result.asesmenAwalKonten || '',
        asesmenProsesKonten: result.asesmenProsesKonten || '',
        asesmenAkhirKonten: result.asesmenAkhirKonten || '',
        lkpd: Array.isArray(result.lkpd) ? result.lkpd.map((l: any) => ({
          pertemuan: l.pertemuan || 1,
          isi: l.isi || ''
        })) : []
      };

      setGenerated(safeResult);
      setStep(3);
    } catch (error) {
      console.error("Error generating RPP:", error);
      alert("Gagal membuat RPP. Silakan periksa koneksi atau API Key.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWord = () => {
    const content = document.getElementById('rpp-printable')?.innerHTML;
    if (!content) return;

    const styles = `
      <style>
        @page {
          size: A4;
          margin: 1.5cm 1.5cm 1.5cm 2cm;
        }
        body { 
          font-family: 'Arial', sans-serif; 
          font-size: 11pt; 
          color: #000; 
          line-height: 1.0;
        }
        h3 { font-size: 14pt; margin: 0 0 5px 0; text-align: center; }
        p, li { margin: 0; padding: 0; margin-bottom: 1px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 10px; table-layout: fixed; }
        th, td { border: 1px solid #000; padding: 3px 5px; vertical-align: top; word-wrap: break-word; }
        .no-border { border: none !important; }
        .bg-green-800 { background-color: #064e3b !important; color: white !important; font-weight: bold; }
        .bg-slate-50 { background-color: #f8fafc !important; }
        .font-bold { font-weight: bold; }
        .text-center { text-align: center; }
        .uppercase { text-transform: uppercase; }
        .underline { text-decoration: underline; }
        .italic { font-style: italic; }
        .text-gray { color: #64748b !important; }
        .page-break { page-break-before: always; }
        .spacer { height: 1.5cm; }
        .signature-table td { border: none !important; padding: 5px 0; }
        ol, ul { margin-top: 1px; margin-bottom: 2px; padding-left: 18px; }
        .markdown-body ul { list-style-type: disc; margin-left: 20px; }
        .markdown-body ol { list-style-type: decimal; margin-left: 20px; }
        .markdown-body table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
        .markdown-body th, .markdown-body td { border: 1px solid #000; padding: 3px 5px; }
      </style>
    `;

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>MIMA 28 MIFTAHUL ULUM</title>${styles}</head>
      <body>${content}</body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RPP_${(formData.mapel || 'Mapel').replace(/\s+/g, '_')}_${(formData.namaGuru || 'Guru').replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 green-gradient text-white shadow-lg no-print">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">MIMA 28 MIFTAHUL ULUM</h1>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <span className="text-sm font-medium opacity-90">Generator RPMBC</span>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {loading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 text-green-800 animate-spin" />
            <div className="text-center">
              <p className="text-lg font-bold text-green-900">Sedang Merancang RPP...</p>
              <p className="text-sm text-slate-500">Kecerdasan Buatan sedang menyusun strategi pembelajaran terbaik untuk Anda.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="h-1 bg-slate-100 no-print">
            <div 
              className="h-full green-primary transition-all duration-500" 
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          <div className="p-6 md:p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-full green-primary text-white flex items-center justify-center font-bold">1</div>
                  <h2 className="text-xl font-bold text-slate-800">Identitas Satuan & Informasi Mapel</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Nama Satuan Pendidikan" name="satuanPendidikan" value={formData.satuanPendidikan} onChange={handleInputChange} placeholder="MI ..." />
                    <Select label="Tahun Pelajaran" name="tahunPelajaran" value={formData.tahunPelajaran} onChange={handleInputChange} options={['2024/2025', '2025/2026', '2026/2027']} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Nama Guru" name="namaGuru" value={formData.namaGuru} onChange={handleInputChange} placeholder="Masukkan nama lengkap guru" />
                    <Input label="NIP Guru" name="nipGuru" value={formData.nipGuru} onChange={handleInputChange} placeholder="Masukkan NIP/NUPTK" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Nama Kepala Madrasah" name="namaKepala" value={formData.namaKepala} onChange={handleInputChange} placeholder="Masukkan nama kepala madrasah" />
                    <Input label="NIP Kepala Madrasah" name="nipKepala" value={formData.nipKepala} onChange={handleInputChange} placeholder="Masukkan NIP Kepala" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
                    <div className="md:col-span-1">
                      <Select label="Mata Pelajaran" name="mapel" value={formData.mapel} onChange={handleInputChange} options={MATA_PELAJARAN} />
                    </div>
                    <Select label="Fase" name="fase" value={formData.fase} onChange={handleInputChange} options={['A', 'B', 'C']} />
                    <Select label="Kelas" name="kelas" value={formData.kelas} onChange={handleInputChange} options={['1', '2', '3', '4', '5', '6']} />
                    <Select label="Semester" name="semester" value={formData.semester} onChange={handleInputChange} options={['Ganjil', 'Genap']} />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button onClick={() => setStep(2)} className="flex items-center gap-2 px-6 py-3 green-gradient hover:opacity-90 text-white rounded-xl font-semibold transition-all shadow-md active:scale-95">Selanjutnya <ChevronRight size={20} /></button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-full green-primary text-white flex items-center justify-center font-bold">2</div>
                  <h2 className="text-xl font-bold text-slate-800">Konten & Strategi Pembelajaran</h2>
                </div>

                <TextArea label="Capaian Pembelajaran (CP)" name="cp" value={formData.cp} onChange={handleInputChange} placeholder="Salin CP dari kurikulum..." />
                <TextArea label="Tujuan Pembelajaran (TP)" name="tp" value={formData.tp} onChange={handleInputChange} placeholder="TP yang terintegrasi dengan DPL dan DPC..." />
                <Input label="Topik Pembelajaran" name="topik" value={formData.topik} onChange={handleInputChange} placeholder="Sub bab / Topik materi" />
                <TextArea label="Kesiapan Murid" name="kesiapanMurid" value={formData.kesiapanMurid} onChange={handleInputChange} placeholder="Deskripsikan kesiapan murid secara umum..." />

                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <label className="block text-sm font-bold text-green-800 mb-4 uppercase tracking-wider">Dimensi Profil Lulusan (Multi-pilih)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {DIMENSI_PROFIL.map(d => (
                      <button key={d} onClick={() => handleMultiSelect('dimensiProfil', d)} className={`text-xs p-2 rounded-lg border transition-all text-left flex items-center gap-2 ${formData.dimensiProfil?.includes(d) ? 'bg-green-800 text-white border-green-800 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-green-400'}`}>
                        {formData.dimensiProfil?.includes(d) && <CheckCircle2 size={12} />} {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <label className="block text-sm font-bold text-green-800 mb-4 uppercase tracking-wider">Topik Panca Cinta (Multi-pilih)</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {PANCA_CINTA.map(p => (
                      <button key={p} onClick={() => handleMultiSelect('topikPancaCinta', p)} className={`text-xs p-2 rounded-lg border transition-all text-left flex items-center gap-2 ${formData.topikPancaCinta?.includes(p) ? 'bg-green-800 text-white border-green-800 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-green-400'}`}>
                        {formData.topikPancaCinta?.includes(p) && <CheckCircle2 size={12} />} {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">Jumlah Pertemuan</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handlePertemuanCountChange(formData.jumlahPertemuan - 1)} className="p-1 rounded bg-slate-200 hover:bg-slate-300 transition-colors"><ChevronLeft size={16}/></button>
                      <span className="font-bold w-8 text-center">{formData.jumlahPertemuan}</span>
                      <button onClick={() => handlePertemuanCountChange(formData.jumlahPertemuan + 1)} className="p-1 rounded bg-slate-200 hover:bg-slate-300 transition-colors"><ChevronRight size={16}/></button>
                    </div>
                  </div>

                  {(formData.pertemuanDetails || []).map((p, idx) => (
                    <div key={p.id} className="p-4 border border-slate-200 rounded-xl space-y-4 bg-slate-50 border-l-4 border-l-green-600">
                      <h4 className="font-bold text-green-800 flex items-center gap-2">Pertemuan ke-{idx + 1}</h4>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Model Pembelajaran</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {MODEL_PEMBELAJARAN.map(model => (
                            <button key={model} onClick={() => updateMeetingModel(idx, model)} className={`text-xs p-2 rounded-lg border transition-all text-center ${p.model === model ? 'bg-green-900 text-white border-green-900 shadow-md font-bold' : 'bg-white text-slate-600 border-slate-200 hover:border-green-400'}`}>
                              {model}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Metode Pembelajaran (Bisa Multi-pilih)</label>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" placeholder="Cari metode..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-shadow" value={methodSearchQuery[p.id] || ''} onChange={(e) => setMethodSearchQuery(prev => ({ ...prev, [p.id]: e.target.value }))} />
                          </div>
                          <div className="max-h-48 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {METODE_PEMBELAJARAN.filter(m => m.toLowerCase().includes((methodSearchQuery[p.id] || '').toLowerCase())).map(m => (
                              <button key={m} onClick={() => toggleMeetingMethod(idx, m)} className={`text-left text-xs p-2 rounded border transition-all flex items-center justify-between ${p.methods?.includes(m) ? 'bg-green-900 text-white border-green-900 font-bold' : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-green-300'}`}>
                                {m} {p.methods?.includes(m) && <CheckCircle2 size={12} />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-6">
                  <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-all">Kembali</button>
                  <button onClick={generateRPP} className="flex items-center gap-2 px-8 py-3 green-gradient hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95">GENERATE RPP <FileText size={20} /></button>
                </div>
              </div>
            )}

            {step === 3 && generated && (
              <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex justify-between items-center no-print border-b border-slate-100 pb-4">
                  <h2 className="text-2xl font-bold text-slate-800">Review Output RPP</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setStep(2)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50">Edit Input</button>
                    <button onClick={handleDownloadWord} className="flex items-center gap-2 px-6 py-2 green-gradient hover:opacity-90 text-white rounded-lg text-sm font-bold shadow-md"><Download size={18} /> DOWNLOAD WORD</button>
                  </div>
                </div>

                <div id="rpp-printable" className="print-page border-2 border-green-900 p-8 bg-white text-[11pt] leading-tight shadow-sm">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold uppercase underline">RENCANA PELAKSANAAN PEMBELAJARAN (RPP)</h3>
                    <p className="font-semibold text-lg">{formData.satuanPendidikan}</p>
                  </div>

                  {/* I. IDENTITAS */}
                  <table className="w-full border-collapse mb-1">
                    <thead>
                      <tr><th colSpan={2} className="bg-green-800 text-white p-2 text-left border border-green-900 uppercase">I. IDENTITAS</th></tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-slate-300 p-1 w-[35%] bg-slate-50 font-semibold">Nama Guru</td><td className="border border-slate-300 p-1">{formData.namaGuru}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Nama Satuan Pendidikan</td><td className="border border-slate-300 p-1">{formData.satuanPendidikan}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Mata Pelajaran</td><td className="border border-slate-300 p-1">{formData.mapel}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Topik Pembelajaran</td><td className="border border-slate-300 p-1">{formData.topik}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Fase/Kelas/Semester</td><td className="border border-slate-300 p-1">{formData.fase} / {formData.kelas} / {formData.semester}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Tahun Pelajaran</td><td className="border border-slate-300 p-1">{formData.tahunPelajaran}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Durasi Pertemuan</td><td className="border border-slate-300 p-1">2 x 35 menit</td></tr>
                    </tbody>
                  </table>

                  {/* II. IDENTIFIKASI */}
                  <table className="w-full border-collapse mb-1">
                    <thead>
                      <tr><th colSpan={2} className="bg-green-800 text-white p-2 text-left border border-green-900 uppercase">II. IDENTIFIKASI</th></tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-slate-300 p-1 w-[35%] bg-slate-50 font-semibold">Kesiapan Murid</td><td className="border border-slate-300 p-1 text-justify">{formData.kesiapanMurid}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Dimensi Profil Lulusan</td><td className="border border-slate-300 p-1">{(formData.dimensiProfil || []).join(', ')}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Topik Panca Cinta</td><td className="border border-slate-300 p-1">{(formData.topikPancaCinta || []).join(', ')}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Integrasi KBC</td><td className="border border-slate-300 p-1 italic">{generated.integrasiKBC}</td></tr>
                    </tbody>
                  </table>

                  {/* III. DESAIN PEMBELAJARAN */}
                  <table className="w-full border-collapse mb-1">
                    <thead>
                      <tr><th colSpan={2} className="bg-green-800 text-white p-2 text-left border border-green-900 uppercase">III. DESAIN PEMBELAJARAN</th></tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-slate-300 p-1 w-[35%] bg-slate-50 font-semibold">Capaian Pembelajaran (CP)</td><td className="border border-slate-300 p-1 text-justify">{formData.cp}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Tujuan Pembelajaran (TP)</td><td className="border border-slate-300 p-1 text-justify">{formData.tp}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Lintas Disiplin Ilmu</td><td className="border border-slate-300 p-1">{generated.lintasDisiplin}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Topik Pembelajaran</td><td className="border border-slate-300 p-1">{formData.topik}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Praktik Pedagogis</td><td className="border border-slate-300 p-1">{(formData.pertemuanDetails || []).map((p, i) => `P${i+1}: ${p.model} (${(p.methods || []).join(', ')})`).join('; ')}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Kemitraan Pembelajaran</td><td className="border border-slate-300 p-1">{generated.kemitraan}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Lingkungan Pembelajaran</td><td className="border border-slate-300 p-1">{generated.lingkungan}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Pemanfaatan Digital</td><td className="border border-slate-300 p-1">{generated.pemanfaatanDigital}</td></tr>
                    </tbody>
                  </table>

                  {/* IV. PENGALAMAN BELAJAR */}
                  <table className="w-full border-collapse mb-1">
                    <thead>
                      <tr><th colSpan={2} className="bg-green-800 text-white p-2 text-left border border-green-900 uppercase">IV. PENGALAMAN BELAJAR</th></tr>
                    </thead>
                    <tbody>
                      {(generated.pengalamanBelajar || []).map((p, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-300 p-1 w-[35%] bg-slate-50 font-semibold">Pertemuan Ke-{p.pertemuan}</td>
                          <td className="border border-slate-300 p-1">
                            <div className="space-y-1">
                              <div><p className="font-bold italic underline">a. Memahami (Awal)</p><ol className="list-decimal ml-5">{(p.memahami || []).map((step, i) => <li key={i}>{step}</li>)}</ol></div>
                              <div><p className="font-bold italic underline">b. Mengaplikasi (Inti)</p><ol className="list-decimal ml-5">{(p.mengaplikasi || []).map((step, i) => <li key={i}>{step}</li>)}</ol></div>
                              <div><p className="font-bold italic underline">c. Refleksi (Penutup)</p><ol className="list-decimal ml-5">{(p.refleksi || []).map((step, i) => <li key={i}>{step}</li>)}</ol></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* V. ASESMEN PEMBELAJARAN */}
                  <table className="w-full border-collapse mb-1">
                    <thead>
                      <tr><th colSpan={2} className="bg-green-800 text-white p-2 text-left border border-green-900 uppercase">V. ASESMEN PEMBELAJARAN</th></tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-slate-300 p-1 w-[35%] bg-slate-50 font-semibold">Asesmen Awal (Diagnostik)</td><td className="border border-slate-300 p-1 text-sm">{generated.asesmenAwal}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Asesmen Proses (Formatif)</td><td className="border border-slate-300 p-1 text-sm">{generated.asesmenProses}</td></tr>
                      <tr><td className="border border-slate-300 p-1 bg-slate-50 font-semibold">Asesmen Akhir (Sumatif)</td><td className="border border-slate-300 p-1 text-sm">{generated.asesmenAkhir}</td></tr>
                    </tbody>
                  </table>

                  {/* SIGNATURES */}
                  <table className="w-full no-border signature-table mt-4">
                    <tbody>
                      <tr>
                        <td className="text-center no-border" width="50%"><p>Mengetahui,</p><p className="mb-12">Kepala Madrasah</p><p className="font-bold underline">{formData.namaKepala || '..............................'}</p><p>NIP: {formData.nipKepala || '..............................'}</p></td>
                        <td className="text-center no-border" width="50%"><p>Ambulu, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p className="mb-12">Guru Mata Pelajaran</p><p className="font-bold underline">{formData.namaGuru || '..............................'}</p><p>NIP: {formData.nipGuru || '..............................'}</p></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* APPENDICES */}
                  <div className="page-break"></div>
                  <div className="text-center mt-6">
                    <h3 className="text-xl font-bold uppercase underline">LAMPIRAN - LAMPIRAN</h3>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-bold uppercase">LAMPIRAN 1 : ASESSMEN AWAL</h4>
                    <div className="p-4 border border-slate-200 bg-slate-50 text-justify text-sm rounded-lg mt-2">
                      <div className="markdown-body">
                        <Markdown remarkPlugins={[remarkGfm]}>{generated.asesmenAwalKonten}</Markdown>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-bold uppercase">LAMPIRAN 2 : ASESSMEN PROSES</h4>
                    <div className="p-4 border border-slate-200 bg-slate-50 text-justify text-sm rounded-lg mt-2">
                      <div className="markdown-body">
                        <Markdown remarkPlugins={[remarkGfm]}>{generated.asesmenProsesKonten}</Markdown>
                      </div>
                      
                      <div className="mt-4">
                        <p className="font-bold mb-2">Lembar Observasi Aktivitas Murid:</p>
                        <table className="w-full border-collapse border border-slate-400">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-400 p-1 w-[8%] text-center text-[9pt]">No</th>
                              <th className="border border-slate-400 p-1 w-[42%] text-center text-[9pt]">Nama Murid</th>
                              <th className="border border-slate-400 p-1 w-[10%] text-center text-[9pt]">K1</th>
                              <th className="border border-slate-400 p-1 w-[10%] text-center text-[9pt]">K2</th>
                              <th className="border border-slate-400 p-1 w-[10%] text-center text-[9pt]">K3</th>
                              <th className="border border-slate-400 p-1 w-[20%] text-center text-[9pt]">Catatan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 10 }, (_, i) => (
                              <tr key={i}>
                                <td className="border border-slate-400 p-1 text-center text-[9pt]">{i + 1}</td>
                                <td className="border border-slate-400 p-1 h-5"></td>
                                <td className="border border-slate-400 p-1 h-5"></td>
                                <td className="border border-slate-400 p-1 h-5"></td>
                                <td className="border border-slate-400 p-1 h-5"></td>
                                <td className="border border-slate-400 p-1 h-5"></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-[8pt] mt-1 italic">*K1-K3: Kriteria Penilaian (sesuaikan dengan rubrik di atas)</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-bold uppercase">LAMPIRAN 3 : ASESSMEN AKHIR</h4>
                    <div className="p-4 border border-slate-200 bg-slate-50 text-justify text-sm rounded-lg mt-2">
                      <div className="markdown-body">
                        <Markdown remarkPlugins={[remarkGfm]}>{generated.asesmenAkhirKonten}</Markdown>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-bold uppercase">LAMPIRAN 4 : LKPD DAN RUBRIK</h4>
                    {generated.lkpd.map((item, idx) => (
                      <div key={idx} className="mt-4 border-l-4 border-green-800 pl-4 bg-slate-50 p-4 rounded-r-lg shadow-sm">
                        <h5 className="font-bold text-green-900 border-b mb-2 pb-1">LKPD Pertemuan Ke-{item.pertemuan}</h5>
                        <p className="text-[10pt] mb-2 italic text-slate-600">Disesuaikan dengan Model: {formData.pertemuanDetails[idx]?.model || '-'} & Metode: {(formData.pertemuanDetails[idx]?.methods || []).join(', ')}</p>
                        <div className="markdown-body text-sm">
                          <Markdown remarkPlugins={[remarkGfm]}>{item.isi}</Markdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 z-50 green-gradient text-white h-[30px] flex items-center justify-center text-[10px] sm:text-xs shadow-inner no-print">
        <p>copyright@muhammad imam syafi’i 2026</p>
      </footer>
    </div>
  );
};

interface InputProps { label: string; name: string; value: any; onChange: (e: any) => void; placeholder?: string; type?: string; }
const Input: React.FC<InputProps> = ({ label, name, value, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-1">
    <label className="block text-sm font-semibold text-slate-700">{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm" />
  </div>
);

interface TextAreaProps { label: string; name: string; value: string; onChange: (e: any) => void; placeholder?: string; }
const TextArea: React.FC<TextAreaProps> = ({ label, name, value, onChange, placeholder }) => (
  <div className="space-y-1">
    <label className="block text-sm font-semibold text-slate-700">{label}</label>
    <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3} className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm resize-none" />
  </div>
);

interface SelectProps { label: string; name?: string; value: string; onChange: (e: any) => void; options: string[]; }
const Select: React.FC<SelectProps> = ({ label, name, value, onChange, options }) => (
  <div className="space-y-1">
    <label className="block text-sm font-semibold text-slate-700">{label}</label>
    <select name={name} value={value} onChange={onChange} className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm bg-white">{options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select>
  </div>
);

export default App;
