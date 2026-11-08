import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kointhaptzkbqevymyyd.supabase.co';
const supabaseKey = 'sb_publishable_gZwFTZ0TsCteXP0euHUkZw_uQNbnKGp';
const supabase = createClient(supabaseUrl, supabaseKey);

const PotensiArt = ({ daftarCabang, daftarKcp }) => {
  const [selectedCabang, setSelectedCabang] = useState('ALL');
  const [selectedKcp, setSelectedKcp] = useState('ALL');
  const [dataPotensiArt, setDataPotensiArt] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState('');

  // Paging State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1); // Reset ke halaman 1 saat filter berubah
    tarikSemuaDataPotensiArt();
  }, [selectedCabang, selectedKcp]);

  // Fungsi mengambil seluruh data (20rb+) secara bertahap
  const tarikSemuaDataPotensiArt = async () => {
    try {
      setIsLoading(true);
      let semuaData = [];
      let limit = 1000;
      let offset = 0;
      let adaDataLagi = true;

      while (adaDataLagi) {
        let query = supabase.from('data_transaksi').select('*').range(offset, offset + limit - 1);

        if (selectedCabang !== 'ALL') query = query.eq('nama_cabang', selectedCabang);
        if (selectedKcp !== 'ALL') query = query.eq('nama_kcp', selectedKcp);

        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          semuaData = [...semuaData, ...data];
          offset += limit;
          if (data.length < limit) {
            adaDataLagi = false;
          }
        } else {
          adaDataLagi = false;
        }
      }

      // Filter data dengan OVD >= 15 hari
      const filtered = (semuaData || []).filter(item => {
        const ovdVal = parseFloat(String(item.ovd || item.OVD || '0').replace(/,/g, '')) || 0;
        return ovdVal >= 15;
      });

      // Urutkan berdasarkan hari tunggakan (OVD) terbesar secara descending
      filtered.sort((a, b) => {
        const ovdA = parseFloat(String(a.ovd || a.OVD || '0').replace(/,/g, '')) || 0;
        const ovdB = parseFloat(String(b.ovd || b.OVD || '0').replace(/,/g, '')) || 0;
        return ovdB - ovdA;
      });

      setDataPotensiArt(filtered);
    } catch (error) {
      console.error('Gagal menarik data Potensi ART:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dataTerfilter = dataPotensiArt.filter(item => {
    const cust = item.nama_customer || item['Nama Customer'] || '';
    const sbg = item.no_sbg || item['No SBG'] || '';
    const kcp = item.nama_kcp || item['Nama KCP'] || '';
    const cif = item.cif || item['No CIF'] || '';
    const kw = kataKunci.toLowerCase();
    return cust.toLowerCase().includes(kw) || sbg.toLowerCase().includes(kw) || kcp.toLowerCase().includes(kw) || cif.toLowerCase().includes(kw);
  });

  // Logika Paging (Maksimal 20 baris per halaman)
  const totalPages = Math.ceil(dataTerfilter.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = dataTerfilter.slice(startIndex, startIndex + rowsPerPage);

  const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div style={{ padding: '25px', fontFamily: 'sans-serif', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      
      {/* HEADER & FILTER RATA KIRI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px', textAlign: 'left' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ color: '#111827', margin: 0, fontWeight: '800', fontSize: '22px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> Potensi ART (OVD &ge; 15 Hari)
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569', fontWeight: '600', textAlign: 'left' }}>
            Daftar detail transaksi SBG dengan potensi macet (OVD 15 hari ke atas, kalkulasi penuh 20rb+ data)
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '13px' }}>🏢</span>
            <select 
              value={selectedCabang} 
              onChange={(e) => setSelectedCabang(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: 'bold', color: '#111827', cursor: 'pointer' }}
            >
              <option value="ALL">Semua Cabang</option>
              {daftarCabang.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '13px' }}>🏬</span>
            <select 
              value={selectedKcp} 
              onChange={(e) => setSelectedKcp(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: 'bold', color: '#111827', cursor: 'pointer' }}
            >
              <option value="ALL">Semua KCP</option>
              {daftarKcp.map((k, i) => <option key={i} value={k}>{k}</option>)}
            </select>
          </div>

          <input 
            type="text" 
            placeholder="Cari KCP, CIF, SBG, Nama..." 
            value={kataKunci}
            onChange={(e) => { setKataKunci(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px 12px', width: '220px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#111827', fontWeight: '600' }}
          />
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: '#111827', fontWeight: '600', textAlign: 'left' }}>⏳ Sedang memproses seluruh 20.000+ data transaksi...</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1100px', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#212C5B', color: '#ffffff', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: '800', width: '60px' }}>NO</th>
                  <th style={{ padding: '14px 12px', fontWeight: '800' }}>NAMA KCP</th>
                  <th style={{ padding: '14px 12px', fontWeight: '800' }}>NO CIF</th>
                  <th style={{ padding: '14px 12px', fontWeight: '800' }}>NO SBG</th>
                  <th style={{ padding: '14px 12px', fontWeight: '800' }}>NAMA CUSTOMER</th>
                  <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '800' }}>NILAI UP</th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: '800' }}>HARI TUNGGAKAN</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((item, idx) => {
                    const ovdVal = parseFloat(String(item.ovd || item.OVD || '0').replace(/,/g, '')) || 0;
                    const nilaiUp = parseFloat(String(item.pokok_awal || item['Pokok Awal'] || '0').replace(/,/g, '')) || 0;

                    return (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#111827' }}>
                          {startIndex + idx + 1}
                        </td>
                        <td style={{ padding: '12px', fontWeight: '800', color: '#111827' }}>{item.nama_kcp || item['Nama KCP']}</td>
                        <td style={{ padding: '12px', fontWeight: '700', color: '#111827' }}>{item.cif || item['No CIF'] || item.CIF}</td>
                        <td style={{ padding: '12px', fontWeight: '700', color: '#111827' }}>{item.no_sbg || item['No SBG']}</td>
                        <td style={{ padding: '12px', fontWeight: '800', color: '#111827' }}>{item.nama_customer || item['Nama Customer']}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatRp(nilaiUp)}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '900', color: '#dc2626' }}>{ovdVal}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '25px', textAlign: 'center', color: '#111827', fontWeight: '700' }}>
                      Tidak ada data Potensi ART dengan OVD &ge; 15 hari ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* NAVIGASI PAGING (20 BARIS PER HALAMAN) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: '600' }}>
              Menampilkan {currentData.length > 0 ? startIndex + 1 : 0} - {startIndex + currentData.length} dari total {dataTerfilter.length} data Potensi ART
            </p>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : '#111827',
                  fontWeight: '700',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px'
                }}
              >
                ◀ Sebelumnya
              </button>

              <span style={{ fontSize: '13px', fontWeight: '700', color: '#111827', padding: '0 8px' }}>
                Hal. {currentPage} dari {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : '#111827',
                  fontWeight: '700',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px'
                }}
              >
                Berikutnya ▶
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PotensiArt;