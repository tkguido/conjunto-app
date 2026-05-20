'use client';

import Link from 'next/link';
import { LogOut, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/');
  };

  return (
    <div>
      <div style={{ backgroundColor: 'white', padding: '1rem', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container" style={{ padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 auto', maxWidth: '1200px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(0,0,0,0.6)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
            ( conjunto )
          </Link>
          
          <button onClick={handleLogout} className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </div>
      <div style={{ padding: '2rem 0' }}>
        {children}
      </div>
    </div>
  );
}
