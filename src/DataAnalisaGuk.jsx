import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kointhaptzkbqevymyyd.supabase.co';
const supabaseKey = 'sb_publishable_gZwFTZ0TsCteXP0euHUkZw_uQNbnKGp';
const supabase = createClient(supabaseUrl, supabaseKey);

const DataAnalisaGuk = ({ daftarCabang, daftarKcp }) => {
  const [selectedCabang, setSelectedCabang] = useState('ALL');
  const [selectedKcp, setSelectedKcp] = useState('ALL');
  const [dataGukList, setDataGukList] = useState([]);
  const [grandTotal, setGrandTotal] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    tarikSemuaDataGuk();
  }, [selectedCabang, selectedKcp]);

  // Fungsi untuk menarik seluruh data (20.000+ baris) secara bertahap
  const tarikSemuaDataGuk = async () => {
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

      // Kelompokkan data per KCP
      const grouped = {};
      const groupedTotalOsKcp = {}; // Untuk menghitung total OS per KCP secara keseluruhan (sebagai penyebut Rasio GUK)

      semuaData.forEach(item => {
        const kcp = item.nama_kcp || item['Nama KCP'] || 'TANPA KCP';
        if (!grouped[kcp]) {
          grouped[kcp] = {
            namaKcp: kcp,
            noaGukSet: new Set(),
            totalOsGuk: 0,
            osGukLancar: 0,
            osGukBermasalah: 0,
          };
        }
        if (!groupedTotalOsKcp[kcp]) {
          groupedTotalOsKcp[kcp] = 0;
        }

        const pokokAwal = parseFloat(String(item.pokok_awal || item['Pokok Awal'] || '0').replace(/,/g, '')) || 0;
        const ltvVal = parseFloat(String(item.ltv || item.LTV || '0').replace(/,/g, '')) || 0;
        const ovdVal = parseFloat(String(item.ovd || item.OVD || '0').replace(/,/g, '')) || 0;
        const noSbg = item.no_sbg || item['No SBG'];

        // Total OS KCP keseluruhan (semua skema)
        groupedTotalOsKcp[kcp] += pokokAwal;

        // Logika GUK: LTV > 97
        if (ltvVal > 97) {
          if (noSbg) grouped[kcp].noaGukSet.add(noSbg);
          grouped[kcp].totalOsGuk += pokokAwal;

          if (ovdVal <= 0) {
            grouped[kcp].osGukLancar += pokokAwal;
          } else {
            grouped[kcp].osGukBermasalah += pokokAwal;
          }
        }
      });

      let listHasil = Object.values(grouped).map(item => {
        const totalNoaGuk = item.noaGukSet.size;
        const totalOsKcp = groupedTotalOsKcp[item.namaKcp] || 0;
        const rasioGuk = totalOsKcp > 0 ? (item.totalOsGuk / totalOsKcp) * 100 : 0;

        return {
          ...item,
          totalNoaGuk,
          totalOsKcp,
          rasioGuk,
        };
      });

      listHasil.sort((a, b) => a.namaKcp.localeCompare(b.namaKcp));

      // Hitung Grand Total Nasional
      let gtNoaGuk = 0, gtOsGuk = 0, gtLancar = 0, gtBermasalah = 0, gtTotalOsKcpNasional = 0;

      listHasil.forEach(i => {
        gtNoaGuk += i.totalNoaGuk;
        gtOsGuk += i.totalOsGuk;
        gtLancar += i.osGukLancar;
        gtBermasalah += i.osGukBermasalah;
        gtTotalOsKcpNasional += i.totalOsKcp;
      });

      const gtRasioGuk = gtTotalOsKcpNasional > 0 ? (gtOsGuk / gtTotalOsKcpNasional) * 100 : 0;

      setGrandTotal({
        totalNoaGuk: gtNoaGuk,
        totalOsGuk: gtOsGuk,
        osGukLancar: gtLancar,
        osGukBermasalah: gtBermasalah,
        rasioGuk: gtRasioGuk,
      });

      setDataGukList(listHasil);
    } catch (error) {
      console.error('Gagal menarik data analisa GUK:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(angka);
  };

  const formatNoa = (angka) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div style={{ padding: '25px', fontFamily: 'sans-serif', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      
      {/* HEADER & FILTER RATA KIRI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px', textAlign: 'left' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ color: '#111827', margin: 0, fontWeight: '800', fontSize: '22px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📑</span> Data Analisa GUK
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569', fontWeight: '600', textAlign: 'left' }}>
            Analisis portofolio pinjaman berstatus GUK (LTV &gt; 97%), lancar, bermasalah, dan rasio per KCP (20rb+ Data)
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
        <p style={{ color: '#111827', fontWeight: '600', textAlign: 'left' }}>⏳ Sedang mengkalkulasi data Analisa GUK...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1200px', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#212C5B', color: '#ffffff', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: '800', width: '60px' }}>NO</th>
                <th style={{ padding: '14px 12px', fontWeight: '800' }}>NAMA KCP</th>
                <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '800' }}>TOTAL NOA GUK</th>
                <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '800' }}>TOTAL OS GUK (Rp)</th>
                <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '800' }}>OS GUK LANCAR (CURRENT)</th>
                <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '800' }}>OS GUK BERMASALAH</th>
                <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: '800' }}>RASIO GUK (%)</th>
              </tr>
            </thead>
            <tbody>
              {dataGukList.length > 0 ? (
                dataGukList.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#111827' }}>{idx + 1}</td>
                    <td style={{ padding: '12px', fontWeight: '800', color: '#111827' }}>{item.namaKcp}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatNoa(item.totalNoaGuk)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatRp(item.totalOsGuk)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#047857' }}>{formatRp(item.osGukLancar)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#dc2626' }}>{formatRp(item.osGukBermasalah)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '800', color: '#0369a1' }}>{item.rasioGuk.toFixed(2)}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '25px', textAlign: 'center', color: '#111827', fontWeight: '700' }}>
                    Tidak ada data Analisa GUK ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
            {/* GRAND TOTAL */}
            {dataGukList.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: '900', borderTop: '3px solid #cbd5e1' }}>
                  <td colSpan="2" style={{ padding: '14px 12px', textAlign: 'left' }}>GRAND TOTAL</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{formatNoa(grandTotal.totalNoaGuk || 0)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{formatRp(grandTotal.totalOsGuk || 0)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#4ade80' }}>{formatRp(grandTotal.osGukLancar || 0)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#fca5a5' }}>{formatRp(grandTotal.osGukBermasalah || 0)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'center', color: '#38bdf8' }}>{(grandTotal.rasioGuk || 0).toFixed(2)}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default DataAnalisaGuk;