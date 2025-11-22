import Sidebar from '@/components/Sidebar';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-white">
            <Sidebar />
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    );
}
