import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kointhaptzkbqevymyyd.supabase.co';
const supabaseKey = 'sb_publishable_gZwFTZ0TsCteXP0euHUkZw_uQNbnKGp';
const supabase = createClient(supabaseUrl, supabaseKey);

const DataAging = ({ daftarCabang, daftarKcp }) => {
  const [selectedCabang, setSelectedCabang] = useState('ALL');
  const [selectedKcp, setSelectedKcp] = useState('ALL');
  const [dataAging, setDataAging] = useState([]);
  const [grandTotal, setGrandTotal] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    tarikSemuaDataAging();
  }, [selectedCabang, selectedKcp]);

  // Fungsi untuk menarik seluruh data (20rb+) secara paginasi/looping agar tidak terpotong 1000 baris
  const tarikSemuaDataAging = async () => {
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

      // Kelompokkan seluruh data per KCP
      const grouped = {};

      semuaData.forEach(item => {
        const kcp = item.nama_kcp || item['Nama KCP'] || 'TANPA KCP';
        if (!grouped[kcp]) {
          grouped[kcp] = {
            namaKcp: kcp,
            noaSet: new Set(),
            totalOs: 0,
            osCurrent: 0,
            ovd1_7: 0,
            ovd8_20: 0,
            ovd21_30: 0,
            artNpl: 0,
            totalOsBermasalah: 0,
            estimasiDenda: 0,
          };
        }

        const noSbg = item.no_sbg || item['No SBG'];
        if (noSbg) grouped[kcp].noaSet.add(noSbg);

        const pokokAwal = parseFloat(String(item.pokok_awal || item['Pokok Awal'] || '0').replace(/,/g, '')) || 0;
        const ovdVal = parseFloat(String(item.ovd || item.OVD || '0').replace(/,/g, '')) || 0;

        grouped[kcp].totalOs += pokokAwal;

        if (ovdVal <= 0) {
          grouped[kcp].osCurrent += pokokAwal;
        } else if (ovdVal >= 1 && ovdVal <= 7) {
          grouped[kcp].ovd1_7 += pokokAwal;
        } else if (ovdVal >= 8 && ovdVal <= 20) {
          grouped[kcp].ovd8_20 += pokokAwal;
        } else if (ovdVal >= 21 && ovdVal <= 30) {
          grouped[kcp].ovd21_30 += pokokAwal;
        } else if (ovdVal > 30) {
          grouped[kcp].artNpl += pokokAwal;
        }
      });

      let listHasil = Object.values(grouped).map(item => {
        const totalNoa = item.noaSet.size;
        const totalOs = item.totalOs;
        const osCurrent = item.osCurrent;
        const rasioOsCurrent = totalOs > 0 ? (osCurrent / totalOs) * 100 : 0;
        const gap = 95 - rasioOsCurrent;

        const rasioOvd1_7 = totalOs > 0 ? (item.ovd1_7 / totalOs) * 100 : 0;
        const rasioOvd8_20 = totalOs > 0 ? (item.ovd8_20 / totalOs) * 100 : 0;
        const rasioArt21_30 = totalOs > 0 ? (item.ovd21_30 / totalOs) * 100 : 0;
        
        const totalOsBermasalah = item.ovd1_7 + item.ovd8_20 + item.ovd21_30 + item.artNpl;
        const estimasiDenda = 0.0075 * totalOsBermasalah;
        const rasioNpl = totalOs > 0 ? (item.artNpl / totalOs) * 100 : 0;

        return {
          ...item,
          totalNoa,
          rasioOsCurrent,
          gap,
          rasioOvd1_7,
          rasioOvd8_20,
          rasioArt21_30,
          totalOsBermasalah,
          estimasiDenda,
          rasioNpl,
        };
      });

      listHasil.sort((a, b) => a.namaKcp.localeCompare(b.namaKcp));

      let gtNoa = 0, gtOs = 0, gtOsCurrent = 0, gtOvd1_7 = 0, gtOvd8_20 = 0, gtOvd21_30 = 0, gtArtNpl = 0, gtOsBermasalah = 0, gtDenda = 0;

      listHasil.forEach(i => {
        gtNoa += i.totalNoa;
        gtOs += i.totalOs;
        gtOsCurrent += i.osCurrent;
        gtOvd1_7 += i.ovd1_7;
        gtOvd8_20 += i.ovd8_20;
        gtOvd21_30 += i.ovd21_30;
        gtArtNpl += i.artNpl;
        gtOsBermasalah += i.totalOsBermasalah;
        gtDenda += i.estimasiDenda;
      });

      const gtRasioOsCurrent = gtOs > 0 ? (gtOsCurrent / gtOs) * 100 : 0;
      const gtGap = 95 - gtRasioOsCurrent;
      const gtRasioOvd1_7 = gtOs > 0 ? (gtOvd1_7 / gtOs) * 100 : 0;
      const gtRasioOvd8_20 = gtOs > 0 ? (gtOvd8_20 / gtOs) * 100 : 0;
      const gtRasioArt21_30 = gtOs > 0 ? (gtOvd21_30 / gtOs) * 100 : 0;
      const gtRasioNpl = gtOs > 0 ? (gtArtNpl / gtOs) * 100 : 0;

      setGrandTotal({
        totalNoa: gtNoa,
        totalOs: gtOs,
        osCurrent: gtOsCurrent,
        rasioOsCurrent: gtRasioOsCurrent,
        gap: gtGap,
        ovd1_7: gtOvd1_7,
        rasioOvd1_7: gtRasioOvd1_7,
        ovd8_20: gtOvd8_20,
        rasioOvd8_20: gtRasioOvd8_20,
        ovd21_30: gtOvd21_30,
        rasioArt21_30: gtRasioArt21_30,
        artNpl: gtArtNpl,
        totalOsBermasalah: gtOsBermasalah,
        estimasiDenda: gtDenda,
        rasioNpl: gtRasioNpl,
      });

      setDataAging(listHasil);
    } catch (error) {
      console.error('Gagal menarik semua data aging:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka);
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
            <span>📈</span> Data Aging &amp; NPL
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569', fontWeight: '600', textAlign: 'left' }}>
            Analisis portofolio pembiayaan, aging overdue, rasio lancar, dan NPL per KCP (Seluruh 20rb+ Data)
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
        <p style={{ color: '#111827', fontWeight: '600', textAlign: 'left' }}>⏳ Sedang memproses 20.000+ data transaksi...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1600px', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#212C5B', color: '#ffffff', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '800' }}>No</th>
                <th style={{ padding: '12px 10px', fontWeight: '800' }}>Nama KCP</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800' }}>Total Noa KCP</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800' }}>Total OS KCP</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800' }}>OS Current (Lancar)</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '800', backgroundColor: '#e0f2fe', color: '#0369a1' }}>Rasio OS Current %</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '800', backgroundColor: '#fef08a', color: '#854d0e' }}>GAP</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800' }}>OVD (H1-H7)</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '800', backgroundColor: '#fef08a', color: '#854d0e' }}>Rasio OVD %</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800' }}>OVD (H8-H20)</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '800', backgroundColor: '#fef08a', color: '#854d0e' }}>RASIO OVD (H8-H20)</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800' }}>OVD (H21-H30)</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '800', backgroundColor: '#fca5a5', color: '#7f1d1d' }}>Rasio ART %</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800' }}>ART &amp; NPL (H&gt;30)</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800' }}>Total OS Bermasalah</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800' }}>Estimasi Denda Berjalan</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '800', backgroundColor: '#fca5a5', color: '#7f1d1d' }}>Rasio NPL (%)</th>
              </tr>
            </thead>
            <tbody>
              {dataAging.length > 0 ? (
                dataAging.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: '#111827' }}>{idx + 1}</td>
                    <td style={{ padding: '10px', fontWeight: '800', color: '#111827' }}>{item.namaKcp}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatNoa(item.totalNoa)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatRp(item.totalOs)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatRp(item.osCurrent)}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '800', backgroundColor: '#f0f9ff', color: '#0369a1' }}>{item.rasioOsCurrent.toFixed(2)}%</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '800', backgroundColor: '#fefce8', color: '#854d0e' }}>{item.gap.toFixed(2)}%</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatRp(item.ovd1_7)}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', backgroundColor: '#fefce8', color: '#854d0e' }}>{item.rasioOvd1_7.toFixed(2)}%</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatRp(item.ovd8_20)}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', backgroundColor: '#fefce8', color: '#854d0e' }}>{item.rasioOvd8_20.toFixed(2)}%</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatRp(item.ovd21_30)}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', backgroundColor: '#fee2e2', color: '#991b1b' }}>{item.rasioArt21_30.toFixed(2)}%</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: '#dc2626' }}>{formatRp(item.artNpl)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: '#111827' }}>{formatRp(item.totalOsBermasalah)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: '#047857' }}>{formatRp(item.estimasiDenda)}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '800', backgroundColor: '#fee2e2', color: '#991b1b' }}>{item.rasioNpl.toFixed(2)}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="17" style={{ padding: '25px', textAlign: 'center', color: '#111827', fontWeight: '700' }}>
                    Tidak ada data aging ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
            {/* GRAND TOTAL */}
            {dataAging.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: '900', borderTop: '3px solid #cbd5e1' }}>
                  <td colSpan="2" style={{ padding: '12px 10px', textAlign: 'left' }}>GRAND TOTAL</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>{formatNoa(grandTotal.totalNoa || 0)}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>{formatRp(grandTotal.totalOs || 0)}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>{formatRp(grandTotal.osCurrent || 0)}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', backgroundColor: '#0369a1', color: '#fff' }}>{(grandTotal.rasioOsCurrent || 0).toFixed(2)}%</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', backgroundColor: '#ca8a04', color: '#fff' }}>{(grandTotal.gap || 0).toFixed(2)}%</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>{formatRp(grandTotal.ovd1_7 || 0)}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', backgroundColor: '#ca8a04', color: '#fff' }}>{(grandTotal.rasioOvd1_7 || 0).toFixed(2)}%</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>{formatRp(grandTotal.ovd8_20 || 0)}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', backgroundColor: '#ca8a04', color: '#fff' }}>{(grandTotal.rasioOvd8_20 || 0).toFixed(2)}%</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>{formatRp(grandTotal.ovd21_30 || 0)}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', backgroundColor: '#b91c1c', color: '#fff' }}>{(grandTotal.rasioArt21_30 || 0).toFixed(2)}%</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', color: '#fca5a5' }}>{formatRp(grandTotal.artNpl || 0)}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>{formatRp(grandTotal.totalOsBermasalah || 0)}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', color: '#4ade80' }}>{formatRp(grandTotal.estimasiDenda || 0)}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', backgroundColor: '#b91c1c', color: '#fff' }}>{(grandTotal.rasioNpl || 0).toFixed(2)}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default DataAging;