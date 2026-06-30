import Sidebar from "./Sidebar";
import ActiveSessionBanner from "./ActiveSessionBanner";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-[260px] min-h-screen p-4 pt-[72px] md:pt-8 md:p-8 pb-24">
        {children}
      </main>
      <ActiveSessionBanner />
    </div>
  );
}
