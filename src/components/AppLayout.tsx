import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-[250px] min-h-screen p-8">{children}</main>
    </div>
  );
}
