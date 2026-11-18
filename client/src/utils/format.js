export const money = n => `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;
export const dateFmt = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
export const dateTime = d => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
export const initials = n => (n || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
export const timeAgo = d => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`;
};
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
export const ROLE_LABEL = { admin: 'Admin', warehouseManager: 'Warehouse Manager', supplier: 'Supplier', salesRepresentative: 'Sales Rep' };
export function exportCSV(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = filename; a.click();
}
export function beep() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination); o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(.001, c.currentTime); g.gain.exponentialRampToValueAtTime(.15, c.currentTime + .02); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .35);
    o.start(); o.stop(c.currentTime + .4);
  } catch { /* ignore */ }
}
