import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function ProtectedLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  
  if (!token) {
    redirect('/admin/login');
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="ml-64 min-h-screen p-8 flex-1" style={{ backgroundColor: 'var(--admin-bg)' }}>
        {children}
      </main>
    </div>
  );
}
