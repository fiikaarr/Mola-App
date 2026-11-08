import React, { useState, useEffect } from 'react';
import SyncData from './SyncData';
import Dashboard from './Dashboard';
import MonitorOverdue from './MonitorOverdue';
import KatalogLelang from './KatalogLelang';
import DataOvdCheck from './DataOvdCheck';
import DataAging from './DataAging';
import DataLtv from './DataLtv';
import DataAnalisaGuk from './DataAnalisaGuk';
import PotensiArt from './PotensiArt';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kointhaptzkbqevymyyd.supabase.co';
const supabaseKey = 'sb_publishable_gZwFTZ0TsCteXP0euHUkZw_uQNbnKGp';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [activeMenu, setActiveMenu] = useState('summary');
  const [sapaan, setSapaan] = useState('');
  
  const [daftarCabang, setDaftarCabang] = useState([]);
  const [daftarKcp, setDaftarKcp] = useState([]);

  useEffect(() => {
    const jam = new Date().getHours();
    if (jam >= 4 && jam < 11) setSapaan('Selamat Pagi');
    else if (jam >= 11 && jam < 15) setSapaan('Selamat Siang');
    else if (jam >= 15 && jam < 18) setSapaan('Selamat Sore');
    else setSapaan('Selamat Malam');

    tarikDataFilter();
  }, []);

  const tarikDataFilter = async () => {
    try {
      const { data, error } = await supabase.from('data_transaksi').select('nama_cabang, nama_kcp');
      if (error) throw error;
      
      const unikCabang = [...new Set(data.map(item => item.nama_cabang))].filter(Boolean).sort();
      const unikKcp = [...new Set(data.map(item => item.nama_kcp))].filter(Boolean).sort();
      
      setDaftarCabang(unikCabang);
      setDaftarKcp(unikKcp);
    } catch (err) {
      console.error('Gagal memuat filter:', err);
    }
  };

  const theme = {
    primaryBlue: '#212C5B', 
    lightBlue: '#48A2D0',   
    accentGold: '#F7B334',  
    bgMain: '#f4f7f9',      
  };

  // Urutan menu dengan Katalog Lelang dipindah ke bawah Monitor Overdue
  const menuItems = [
    { id: 'summary', icon: '📊', label: 'Summary', type: 'main' },
    { id: 'overdue', icon: '🚨', label: 'Monitor Overdue', type: 'main' },
    { id: 'ovd_check', icon: '📋', label: 'Data OVD Check', type: 'sub' },
    { id: 'data_aging', icon: '📈', label: 'Data Aging', type: 'sub' },
    { id: 'data_ltv', icon: '📊', label: 'Data LTV', type: 'sub' },
    { id: 'data_analisa_guk', icon: '📑', label: 'Data Analisa GUK', type: 'sub' },
    { id: 'potensi_art', icon: '⚠️', label: 'Potensi ART', type: 'sub' },
    { id: 'lelang', icon: '💎', label: 'Katalog Lelang (BJDP)', type: 'main' },
    { id: 'sync', icon: '⚙️', label: 'Sinkronisasi Data', type: 'main' },
  ];

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', backgroundColor: theme.bgMain, fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', overflow: 'hidden' }}>
      
      {/* SIDEBAR KIRI (STATIS) */}
      <div style={{ width: '280px', flexShrink: 0, background: `linear-gradient(160deg, ${theme.primaryBlue} 0%, ${theme.lightBlue} 55%, ${theme.accentGold} 100%)`, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 15px rgba(0,0,0,0.15)', zIndex: 10 }}>
        <div style={{ padding: '30px 25px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#ffffff', letterSpacing: '1px' }}>MOLA</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.9)' }}>Monitoring Overdue & Lelang Aset</p>
        </div>

        <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
          {menuItems.map(item => {
            const isActive = activeMenu === item.id;
            const isSub = item.type === 'sub';
            return (
              <div
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                style={{
                  position: 'relative',
                  padding: isSub ? '10px 15px 10px 42px' : '16px 25px',
                  margin: isSub ? '2px 15px 6px 25px' : '8px 15px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(0, 0, 0, 0.25)' : 'transparent',
                  color: '#ffffff',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: isSub ? '13.5px' : '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: isActive ? 'inset 2px 0 0 #ffffff' : 'none'
                }}
              >
                {/* Garis Konektor Estetik untuk Sub-Menu */}
                {isSub && (
                  <div style={{
                    position: 'absolute',
                    left: '16px',
                    top: '-12px',
                    bottom: '50%',
                    width: '10px',
                    borderLeft: '2px solid rgba(255, 255, 255, 0.4)',
                    borderBottom: '2px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '0 0 0 4px'
                  }} />
                )}

                {!isSub && <span style={{ fontSize: '18px' }}>{item.icon}</span>}
                <span style={{ textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.3)' : 'none' }}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: '20px 25px', borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ margin: 0, color: theme.primaryBlue, fontSize: '15px', fontWeight: '800' }}>Gadai Mas Nusantara</p>
          <p style={{ margin: '2px 0 0 0', color: theme.primaryBlue, fontSize: '12px', fontWeight: '600', opacity: 0.85 }}>Branch Finance & Operation</p>
        </div>
      </div>

      {/* AREA KONTEN UTAMA KANAN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* HEADER ATAS */}
        <header style={{ 
          flexShrink: 0, 
          background: 'linear-gradient(135deg, rgba(33, 44, 91, 0.18) 0%, rgba(72, 162, 208, 0.35) 45%, rgba(247, 179, 52, 0.22) 80%, rgba(255, 255, 255, 1) 100%)',
          padding: '22px 30px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid #cbd5e1',
          boxShadow: '0 4px 15px rgba(33, 44, 91, 0.08)', 
          zIndex: 5 
        }}>
          <div>
            <h2 style={{ margin: 0, color: theme.primaryBlue, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
              {sapaan}, Sobat MAS! 👋
            </h2>
            <p style={{ margin: '0px 0 0 0', color: '#475569', fontSize: '13px', fontWeight: '600' }}>
              Semoga Selalu Dalam Kondisi Sehat dan Bersemangat yaa!
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#047857', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
              Sistem Aktif
            </div>

            <div style={{ padding: '8px 16px', backgroundColor: theme.primaryBlue, color: '#ffffff', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* PANEL UTAMA */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '30px' }}>
          {activeMenu === 'summary' && <Dashboard daftarCabang={daftarCabang} daftarKcp={daftarKcp} />}
          {activeMenu === 'overdue' && <MonitorOverdue daftarCabang={daftarCabang} daftarKcp={daftarKcp} />}
          {activeMenu === 'ovd_check' && <DataOvdCheck daftarCabang={daftarCabang} daftarKcp={daftarKcp} />}
          {activeMenu === 'data_aging' && <DataAging daftarCabang={daftarCabang} daftarKcp={daftarKcp} />}
          {activeMenu === 'data_ltv' && <DataLtv daftarCabang={daftarCabang} daftarKcp={daftarKcp} />}
          {activeMenu === 'data_analisa_guk' && <DataAnalisaGuk daftarCabang={daftarCabang} daftarKcp={daftarKcp} />}
          {activeMenu === 'potensi_art' && <PotensiArt daftarCabang={daftarCabang} daftarKcp={daftarKcp} />}
          {activeMenu === 'lelang' && <KatalogLelang daftarCabang={daftarCabang} daftarKcp={daftarKcp} />}
          {activeMenu === 'sync' && <SyncData onDataSynced={tarikDataFilter} />}
        </main>

      </div>
    </div>
  );
}

export default App;