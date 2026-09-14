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
    <div className="flex h-screen overflow-x-hidden">
      <AdminSidebar />
      <main className="ml-16 min-h-screen p-8 flex-1 lg:ml-64" style={{ backgroundColor: 'var(--admin-bg)' }}>
        {children}
      </main>
    </div>
  );
}
