import Sidebar from '@/components/Sidebar';
import { TenantProvider } from '@/context/TenantContext';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TenantProvider>
            <div className="flex h-screen w-screen overflow-hidden bg-white">
                <Sidebar />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 bg-gray-50">
                    {children}
                </main>
            </div>
        </TenantProvider>
    );
}
