import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kointhaptzkbqevymyyd.supabase.co';
const supabaseKey = 'sb_publishable_gZwFTZ0TsCteXP0euHUkZw_uQNbnKGp';
const supabase = createClient(supabaseUrl, supabaseKey);

const DataOvdCheck = ({ daftarCabang, daftarKcp }) => {
  const [selectedCabang, setSelectedCabang] = useState('ALL');
  const [selectedKcp, setSelectedKcp] = useState('ALL');
  const [dataOvdCheck, setDataOvdCheck] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState('');

  // State untuk Sorting (Kolom aktif & Arah Ascending/Descending)
  const [sortConfig, setSortConfig] = useState({ key: 'ovd', direction: 'desc' });

  // Paging State (Maksimal 20 baris per halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1); // Reset ke halaman 1 saat filter berubah
    tarikSemuaDataOvdCheck();
  }, [selectedCabang, selectedKcp]);

  // Fungsi menarik seluruh data (20rb+) secara bertahap
  const tarikSemuaDataOvdCheck = async () => {
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

      // Filter OVD > 0
      const dataSaringOvd = (semuaData || []).filter(item => {
        const nilaiOvd = parseFloat(String(item.ovd || item.OVD || '0').replace(/,/g, ''));
        return !isNaN(nilaiOvd) && nilaiOvd > 0;
      });

      setDataOvdCheck(dataSaringOvd);
    } catch (error) {
      console.error('Gagal menarik data OVD Check:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk menangani klik sort pada header kolom
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Proses Sorting Data
  const sortedData = [...dataOvdCheck].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let valA, valB;

    if (sortConfig.key === 'status_pinjaman') {
      valA = (a.status_pinjaman || a['Status Pinjaman'] || '').toLowerCase();
      valB = (b.status_pinjaman || b['Status Pinjaman'] || '').toLowerCase();
    } else if (sortConfig.key === 'ltv') {
      valA = parseFloat(String(a.ltv || a.LTV || '0').replace(/,/g, '')) || 0;
      valB = parseFloat(String(b.ltv || b.LTV || '0').replace(/,/g, '')) || 0;
    } else if (sortConfig.key === 'ovd') {
      valA = parseFloat(String(a.ovd || a.OVD || '0').replace(/,/g, '')) || 0;
      valB = parseFloat(String(b.ovd || b.OVD || '0').replace(/,/g, '')) || 0;
    } else if (sortConfig.key === 'skema_pinjaman') {
      const ltvA = parseFloat(String(a.ltv || a.LTV || '0').replace(/,/g, '')) || 0;
      const ltvB = parseFloat(String(b.ltv || b.LTV || '0').replace(/,/g, '')) || 0;
      valA = ltvA > 97 ? 'GUK' : 'Reguler';
      valB = ltvB > 97 ? 'GUK' : 'Reguler';
    } else if (sortConfig.key === 'status_ovd') {
      valA = (parseFloat(String(a.ovd || a.OVD || '0').replace(/,/g, '')) || 0) > 0 ? 1 : 0;
      valB = (parseFloat(String(b.ovd || b.OVD || '0').replace(/,/g, '')) || 0) > 0 ? 1 : 0;
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const dataTerfilter = sortedData.filter(item => {
    const cust = item.nama_customer || item['Nama Customer'] || '';
    const sbg = item.no_sbg || item['No SBG'] || '';
    const kcp = item.nama_kcp || item['Nama KCP'] || '';
    const kw = kataKunci.toLowerCase();
    return cust.toLowerCase().includes(kw) || sbg.toLowerCase().includes(kw) || kcp.toLowerCase().includes(kw);
  });

  // Kalkulasi Paging (Maksimal 20 baris per halaman)
  const totalPages = Math.ceil(dataTerfilter.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = dataTerfilter.slice(startIndex, startIndex + rowsPerPage);

  const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka);
  };

  // Komponen Helper untuk render ikon panah sorting
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <span style={{ opacity: 0.4, fontSize: '11px', marginLeft: '4px' }}>↕</span>;
    return <span style={{ color: '#F7B334', fontSize: '11px', marginLeft: '4px' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div style={{ padding: '25px', fontFamily: 'sans-serif', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      
      {/* HEADER MODUL & FILTER SEJAJAR RATA KIRI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px', textAlign: 'left' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ color: '#111827', margin: 0, fontWeight: '800', fontSize: '22px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> Data OVD Check
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569', fontWeight: '600', textAlign: 'left' }}>
            Menampilkan daftar transaksi dengan nilai OVD &gt; 0 hari (Kalkulasi penuh 20rb+ data)
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filter Cabang */}
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

          {/* Filter KCP */}
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

          {/* Kolom Pencarian */}
          <input 
            type="text" 
            placeholder="Cari KCP, No SBG, Nama..." 
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1200px' }}>
              <thead>
                <tr style={{ backgroundColor: '#212C5B', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '14px 16px', color: '#ffffff', fontWeight: '800', fontSize: '13px', width: '50px', textAlign: 'center' }}>NO</th>
                  <th style={{ padding: '14px 16px', color: '#ffffff', fontWeight: '800', fontSize: '13px' }}>NAMA KCP</th>
                  <th style={{ padding: '14px 16px', color: '#ffffff', fontWeight: '800', fontSize: '13px' }}>NO SBG</th>
                  <th style={{ padding: '14px 16px', color: '#ffffff', fontWeight: '800', fontSize: '13px' }}>NAMA CUSTOMER</th>
                  <th style={{ padding: '14px 16px', color: '#ffffff', fontWeight: '800', fontSize: '13px', textAlign: 'right' }}>POKOK AWAL</th>
                  
                  {/* Kolom dengan Sortable */}
                  <th 
                    onClick={() => handleSort('status_pinjaman')} 
                    style={{ padding: '14px 16px', color: '#ffffff', fontWeight: '800', fontSize: '13px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    STATUS PINJAMAN {renderSortIcon('status_pinjaman')}
                  </th>
                  <th 
                    onClick={() => handleSort('ltv')} 
                    style={{ padding: '14px 16px', color: '#ffffff', fontWeight: '800', fontSize: '13px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    LTV {renderSortIcon('ltv')}
                  </th>
                  <th 
                    onClick={() => handleSort('ovd')} 
                    style={{ padding: '14px 16px', color: '#ffffff', fontWeight: '800', fontSize: '13px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    OVD (Hari) {renderSortIcon('ovd')}
                  </th>
                  
                  <th style={{ padding: '14px 16px', color: '#ffffff', fontWeight: '800', fontSize: '13px' }}>CIF</th>
                  
                  <th 
                    onClick={() => handleSort('skema_pinjaman')} 
                    style={{ padding: '14px 16px', color: '#ffffff', fontWeight: '800', fontSize: '13px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    SKEMA PINJAMAN {renderSortIcon('skema_pinjaman')}
                  </th>
                  <th 
                    onClick={() => handleSort('status_ovd')} 
                    style={{ padding: '14px 16px', color: '#ffffff', fontWeight: '800', fontSize: '13px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    STATUS OVD {renderSortIcon('status_ovd')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((item, idx) => {
                    const ovdVal = parseFloat(String(item.ovd || item.OVD || '0').replace(/,/g, '')) || 0;
                    const ltvVal = parseFloat(String(item.ltv || item.LTV || '0').replace(/,/g, '')) || 0;
                    const skemaPinjaman = ltvVal > 97 ? 'GUK' : 'Reguler';
                    const isJatuhTempo = ovdVal > 0;

                    return (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: '#111827', fontSize: '13px' }}>
                          {startIndex + idx + 1}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#111827', fontWeight: '700', fontSize: '13px' }}>{item.nama_kcp || item['Nama KCP']}</td>
                        <td style={{ padding: '14px 16px', color: '#111827', fontWeight: '700', fontSize: '13px' }}>{item.no_sbg || item['No SBG']}</td>
                        <td style={{ padding: '14px 16px', color: '#111827', fontWeight: '800', fontSize: '13px' }}>{item.nama_customer || item['Nama Customer']}</td>
                        <td style={{ padding: '14px 16px', color: '#111827', fontWeight: '700', fontSize: '13px', textAlign: 'right' }}>{formatRp(item.pokok_awal || item['Pokok Awal'] || 0)}</td>
                        <td style={{ padding: '14px 16px', color: '#111827', fontWeight: '700', fontSize: '13px', textAlign: 'center' }}>{item.status_pinjaman || item['Status Pinjaman'] || 'Aktif'}</td>
                        <td style={{ padding: '14px 16px', color: '#0369a1', fontWeight: '800', fontSize: '13px', textAlign: 'center' }}>{ltvVal ? ltvVal.toFixed(2) : '0'}</td>
                        <td style={{ padding: '14px 16px', color: '#dc2626', fontWeight: '900', fontSize: '14px', textAlign: 'center' }}>{ovdVal}</td>
                        <td style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', fontSize: '13px' }}>{item.cif || item.CIF || '-'}</td>
                        <td style={{ padding: '14px 16px', color: '#111827', fontWeight: '700', fontSize: '13px', textAlign: 'center' }}>{skemaPinjaman}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{ 
                            backgroundColor: isJatuhTempo ? '#fee2e2' : '#dcfce7', 
                            color: isJatuhTempo ? '#991b1b' : '#166534', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '12px', 
                            fontWeight: '800',
                            display: 'inline-block'
                          }}>
                            {isJatuhTempo ? 'Jatuh Tempo' : 'Belum Jatuh Tempo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="11" style={{ padding: '25px', textAlign: 'center', color: '#111827', fontWeight: '700' }}>
                      Tidak ada data dengan OVD &gt; 0 ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* NAVIGASI PAGING (20 BARIS PER HALAMAN) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: '600' }}>
              Menampilkan {currentData.length > 0 ? startIndex + 1 : 0} - {startIndex + currentData.length} dari total {dataTerfilter.length} data OVD Check
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

export default DataOvdCheck;