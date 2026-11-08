import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kointhaptzkbqevymyyd.supabase.co';
const supabaseKey = 'sb_publishable_gZwFTZ0TsCteXP0euHUkZw_uQNbnKGp';
const supabase = createClient(supabaseUrl, supabaseKey);

const SyncData = () => {
  const [status, setStatus] = useState('Menunggu file Excel...');
  const [isLoading, setIsLoading] = useState(false);

  const bersihkanAngka = (nilai) => {
    if (nilai === undefined || nilai === null || nilai === '') return 0;
    const teksAngka = String(nilai).replace(/,/g, '');
    const angka = parseFloat(teksAngka);
    return isNaN(angka) ? 0 : angka;
  };

  const hitungTotalGramasi = (beratBersih) => {
    if (!beratBersih) return 0;
    const arrayBerat = String(beratBersih).split(',');
    const total = arrayBerat.reduce((sum, item) => {
      const angka = parseFloat(item.trim());
      return sum + (isNaN(angka) ? 0 : angka);
    }, 0);
    return Math.round(total * 100) / 100;
  };

  const formatTanggalExcel = (serial) => {
    if (!serial) return null;
    if (typeof serial === 'string') return serial; 
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setStatus('Sedang membaca file Excel...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames.find(name => name === 'Sheet1') || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        
        setStatus(`Berhasil membaca ${rawJson.length} baris. Memetakan data...`);

        const dataSiapUpload = rawJson.map(row => ({
          kode_produk: String(row['Kode Produk'] || ''),
          kode_kcp: String(row['Kode KCP'] || ''),
          nama_kcp: row['Nama KCP'],
          nama_cabang: row['Nama Cabang'],
          nama_wilayah: row['Nama Wilayah'],
          no_sbg: String(row['No SBG'] || ''),
          no_kwitansi_perpanjangan: String(row['No Kwitansi Perpanjangan'] || ''),
          no_sbg_lama: String(row['No SBG Lama'] || ''),
          no_kwitansi_sebelumnya: String(row['No Kwitansi Sebelumnya'] || ''),
          no_transaksi: String(row['No Transaksi'] || ''),
          cif: String(row['CIF'] || ''),
          nama_customer: row['Nama Customer'],
          nama_pekerjaan: row['Nama Pekerjaan'],
          tgl_cair: formatTanggalExcel(row['Tgl Cair']),
          angsuran_ke: bersihkanAngka(row['Angsuran Ke']),
          tgl_jatuh_tempo: formatTanggalExcel(row['Tgl Jatuh Tempo']),
          ovd: bersihkanAngka(row['OVD']),
          tenor: bersihkanAngka(row['Tenor']),
          rate_flat: bersihkanAngka(row['Rate Flat']),
          ltv: bersihkanAngka(row['LTV']),
          pokok_awal: bersihkanAngka(row['Pokok Awal']),
          saldo_pokok: bersihkanAngka(row['Saldo Pokok']),
          saldo_simpan: bersihkanAngka(row['Saldo Simpan']),
          saldo_pinjam_net: bersihkanAngka(row['Saldo Pinjam Net']),
          biaya_admin: bersihkanAngka(row['Biaya Admin']),
          kode_mitra: String(row['Kode Mitra'] || ''),
          nama_mitra: row['Nama Mitra'],
          rate_pendana: bersihkanAngka(row['Rate Pendana']),
          bank_jf: row['Bank JF'],
          porsi_bank: bersihkanAngka(row['Porsi Bank']),
          status_flag: String(row['Status Flag'] || ''),
          status_pinjaman: row['Status Pinjaman'],
          deskripsi_barang: row['Deskripsi'],
          jumlah_barang: bersihkanAngka(row['Jumlah Barang']),
          karat: String(row['Karat'] || ''),
          berat_kotor: String(row['Berat Kotor'] || ''),
          berat_bersih: String(row['Berat Bersih'] || ''),
          status_aplikasi: row['Status Aplikasi'],
          gramasi: hitungTotalGramasi(row['Berat Bersih'])
        })).filter(row => row.no_sbg !== ''); 

        setStatus('Mengirim data lengkap ke Supabase MOLA...');

        const { error } = await supabase
          .from('data_transaksi')
          .upsert(dataSiapUpload, { onConflict: 'no_sbg' });

        if (error) throw error;

        setStatus('✅ Selesai! Data harian berhasil disinkronisasi ke database.');
      } catch (error) {
        console.error(error);
        setStatus('❌ Gagal mengunggah data: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ padding: '25px', fontFamily: 'sans-serif', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#111827', marginTop: 0, fontWeight: '800' }}>⚙️ Sinkronisasi Data Harian MOLA</h2>
      <p style={{ color: '#111827', fontWeight: '600' }}>Pilih file Excel (Data Mentah) hasil tarikan hari ini.</p>
      
      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        onChange={handleFileUpload} 
        disabled={isLoading}
        style={{ marginBottom: '20px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '5px', width: '100%', maxWidth: '400px', color: '#111827', fontWeight: '600' }}
      />
      
      <div style={{ padding: '15px', backgroundColor: '#f0f4f8', borderRadius: '8px', color: '#111827', fontWeight: '700' }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
};

export default SyncData;