import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kointhaptzkbqevymyyd.supabase.co';
const supabaseKey = 'sb_publishable_gZwFTZ0TsCteXP0euHUkZw_uQNbnKGp';
const supabase = createClient(supabaseUrl, supabaseKey);

const Dashboard = ({ daftarCabang, daftarKcp }) => {
  const [selectedCabang, setSelectedCabang] = useState('ALL');
  const [selectedKcp, setSelectedKcp] = useState('ALL');
  const [metrik, setMetrik] = useState({ nasabahOvd: 0, saldoOvd: 0, jumlahBjdp: 0, gramasiBjdp: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    tarikDataDashboard();
  }, [selectedCabang, selectedKcp]);

  const tarikDataDashboard = async () => {
    try {
      setIsLoading(true);
      let query = supabase.from('data_transaksi').select('nama_cabang, nama_kcp, ovd, saldo_pokok, status_pinjaman, gramasi');
      
      if (selectedCabang && selectedCabang !== 'ALL') {
        query = query.eq('nama_cabang', selectedCabang);
      }
      if (selectedKcp && selectedKcp !== 'ALL') {
        query = query.eq('nama_kcp', selectedKcp);
      }

      const { data, error } = await query;
      if (error) throw error;

      let nasabahOvd = 0;
      let saldoOvd = 0;
      let jumlahBjdp = 0;
      let gramasiBjdp = 0;

      data.forEach(item => {
        if (item.ovd > 0) {
          nasabahOvd++;
          saldoOvd += Number(item.saldo_pokok) || 0;
        }
        if (item.status_pinjaman === 'BJDP') {
          jumlahBjdp++;
          gramasiBjdp += Number(item.gramasi) || 0;
        }
      });

      setMetrik({ nasabahOvd, saldoOvd, jumlahBjdp, gramasiBjdp });
    } catch (error) {
      console.error('Gagal menarik data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  if (isLoading) return <div style={{ padding: '20px', color: '#111827', fontWeight: '700' }}>⏳ Memuat data ringkasan MOLA...</div>;

  return (
    <div style={{ padding: '25px', fontFamily: 'sans-serif', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      
      {/* JUDUL DAN FILTER SEJAJAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ margin: 0, color: '#111827', fontWeight: '800' }}>📊 Summary</h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Filter Cabang */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '13px' }}>🏢</span>
            <select 
              value={selectedCabang} 
              onChange={(e) => setSelectedCabang(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: 'bold', color: '#111827', cursor: 'pointer' }}
            >
              <option value="ALL">Semua Cabang</option>
              {daftarCabang.map((cabang, idx) => (
                <option key={idx} value={cabang}>{cabang}</option>
              ))}
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
              {daftarKcp.map((kcp, idx) => (
                <option key={idx} value={kcp}>{kcp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ backgroundColor: '#fee2e2', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #ef4444' }}>
          <p style={{ margin: 0, color: '#111827', fontSize: '14px', fontWeight: '800' }}>Total Nasabah Overdue</p>
          <h3 style={{ margin: '10px 0 0 0', color: '#111827', fontSize: '28px', fontWeight: '900' }}>{metrik.nasabahOvd} <span style={{ fontSize: '16px', fontWeight: '700' }}>Nasabah</span></h3>
        </div>
        <div style={{ backgroundColor: '#ffedd5', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #f97316' }}>
          <p style={{ margin: 0, color: '#111827', fontSize: '14px', fontWeight: '800' }}>Total Saldo Pokok Overdue</p>
          <h3 style={{ margin: '10px 0 0 0', color: '#111827', fontSize: '24px', fontWeight: '900' }}>{formatRp(metrik.saldoOvd)}</h3>
        </div>
        <div style={{ backgroundColor: '#f3e8ff', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #a855f7' }}>
          <p style={{ margin: 0, color: '#111827', fontSize: '14px', fontWeight: '800' }}>Barang Jaminan Siap Jual (BJDP)</p>
          <h3 style={{ margin: '10px 0 0 0', color: '#111827', fontSize: '28px', fontWeight: '900' }}>{metrik.jumlahBjdp} <span style={{ fontSize: '16px', fontWeight: '700' }}>Item</span></h3>
        </div>
        <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #f59e0b' }}>
          <p style={{ margin: 0, color: '#111827', fontSize: '14px', fontWeight: '800' }}>Total Gramasi Siap Lelang</p>
          <h3 style={{ margin: '10px 0 0 0', color: '#111827', fontSize: '28px', fontWeight: '900' }}>{metrik.gramasiBjdp.toFixed(2)} <span style={{ fontSize: '16px', fontWeight: '700' }}>Gram</span></h3>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;