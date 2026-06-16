import Sidebar from "./Sidebar";

interface AppLayoutProps {
  userEmail: string;
  children: React.ReactNode;
}

export default function AppLayout({ userEmail, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar userEmail={userEmail} />
      <main className="ml-[250px] min-h-screen p-8">{children}</main>
    </div>
  );
}
