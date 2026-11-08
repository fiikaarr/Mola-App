import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kointhaptzkbqevymyyd.supabase.co';
const supabaseKey = 'sb_publishable_gZwFTZ0TsCteXP0euHUkZw_uQNbnKGp';
const supabase = createClient(supabaseUrl, supabaseKey);

const DataLtv = ({ daftarCabang, daftarKcp }) => {
  const [selectedCabang, setSelectedCabang] = useState('ALL');
  const [selectedKcp, setSelectedKcp] = useState('ALL');
  const [dataLtvList, setDataLtvList] = useState([]);
  const [grandTotal, setGrandTotal] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    tarikSemuaDataLtv();
  }, [selectedCabang, selectedKcp]);

  // Fungsi untuk mengambil seluruh data (20.000+ baris) secara paginasi bertahap
  const tarikSemuaDataLtv = async () => {
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

      // Kelompokkan data per KCP berdasarkan kategori LTV
      const grouped = {};

      semuaData.forEach(item => {
        const kcp = item.nama_kcp || item['Nama KCP'] || 'TANPA KCP';
        if (!grouped[kcp]) {
          grouped[kcp] = {
            namaKcp: kcp,
            ltvAman: 0,     // < 90%
            ltvPadat: 0,    // 90% - 95%
            ltvGukAwal: 0,  // 96% - 100%
            ltvEkstrem: 0,  // > 100%
            totalBjdp: 0,
          };
        }

        const pokokAwal = parseFloat(String(item.pokok_awal || item['Pokok Awal'] || '0').replace(/,/g, '')) || 0;
        const ltvVal = parseFloat(String(item.ltv || item.LTV || '0').replace(/,/g, '')) || 0;

        grouped[kcp].totalBjdp += pokokAwal;

        if (ltvVal < 90) {
          grouped[kcp].ltvAman += pokokAwal;
        } else if (ltvVal >= 90 && ltvVal <= 95) {
          grouped[kcp].ltvPadat += pokokAwal;
        } else if (ltvVal >= 96 && ltvVal <= 100) {
          grouped[kcp].ltvGukAwal += pokokAwal;
        } else if (ltvVal > 100) {
          grouped[kcp].ltvEkstrem += pokokAwal;
        }
      });

      let listHasil = Object.values(grouped);
      listHasil.sort((a, b) => a.namaKcp.localeCompare(b.namaKcp));

      // Hitung Grand Total Nasional terlebih dahulu untuk mendapatkan total keseluruhan BJDP
      let gtAman = 0, gtPadat = 0, gtGukAwal = 0, gtEkstrem = 0, gtTotalBjdp = 0;

      listHasil.forEach(i => {
        gtAman += i.ltvAman;
        gtPadat += i.ltvPadat;
        gtGukAwal += i.ltvGukAwal;
        gtEkstrem += i.ltvEkstrem;
        gtTotalBjdp += i.totalBjdp;
      });

      // Hitung Kontribusi BJDP (%) per KCP terhadap Total BJDP Nasional
      let hasilDenganKontribusi = listHasil.map(item => {
        const kontribusi = gtTotalBjdp > 0 ? (item.totalBjdp / gtTotalBjdp) * 100 : 0;
        return {
          ...item,
          kontribusi,
        };
      });

      setGrandTotal({
        ltvAman: gtAman,
        ltvPadat: gtPadat,
        ltvGukAwal: gtGukAwal,
        ltvEkstrem: gtEkstrem,
        totalBjdp: gtTotalBjdp,
        kontribusi: 100.0,
      });

      setDataLtvList(hasilDenganKontribusi);
    } catch (error) {
      console.error('Gagal menarik data LTV:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(angka);
  };

  return (
    <div style={{ padding: '25px', fontFamily: 'sans-serif', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      
      {/* HEADER & FILTER RATA KIRI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px', textAlign: 'left' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ color: '#111827', margin: 0, fontWeight: '800', fontSize: '22px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📊</span> Data LTV (Loan to Value)
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569', fontWeight: '600', textAlign: 'left' }}>
            Klasifikasi portofolio pembiayaan berdasarkan kategori LTV Aman, Padat, GUK Awal, dan Ekstrem (20rb+ Data)
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
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: '#111827', fontWeight: '600', textAlign: 'left' }}>⏳ Sedang mengkalkulasi seluruh data LTV...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1300px', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#212C5B', color: '#ffffff', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: '800', width: '60px' }}>No</th>
                <th style={{ padding: '14px 12px', fontWeight: '800' }}>Nama KCP</th>
                <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '800' }}>BJDP LTV AMAN (&lt;90%)</th>
                <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '800' }}>BJDP LTV PADAT (90% - 95%)</th>
                <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '800' }}>BJDP LTV GUK AWAL (96% - 100%)</th>
                <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '800' }}>BJDP LTV GUK EKSTREM (&gt;100%)</th>
                <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '800' }}>TOTAL BJDP PER KCP</th>
                <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: '800' }}>KONSTRIBUSI BJDP (%)</th>
              </tr>
            </thead>
            <tbody>
              {dataLtvList.length > 0 ? (
                dataLtvList.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#111827' }}>{idx + 1}</td>
                    <td style={{ padding: '12px', fontWeight: '800', color: '#111827' }}>{item.namaKcp}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatRp(item.ltvAman)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatRp(item.ltvPadat)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatRp(item.ltvGukAwal)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#dc2626' }}>{formatRp(item.ltvEkstrem)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: '#111827' }}>{formatRp(item.totalBjdp)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '800', color: '#0369a1' }}>{item.kontribusi.toFixed(2)}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ padding: '25px', textAlign: 'center', color: '#111827', fontWeight: '700' }}>
                    Tidak ada data LTV ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
            {/* GRAND TOTAL */}
            {dataLtvList.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: '900', borderTop: '3px solid #cbd5e1' }}>
                  <td colSpan="2" style={{ padding: '14px 12px', textAlign: 'left' }}>GRAND TOTAL</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{formatRp(grandTotal.ltvAman || 0)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{formatRp(grandTotal.ltvPadat || 0)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{formatRp(grandTotal.ltvGukAwal || 0)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#fca5a5' }}>{formatRp(grandTotal.ltvEkstrem || 0)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{formatRp(grandTotal.totalBjdp || 0)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'center', color: '#4ade80' }}>100.00%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default DataLtv;