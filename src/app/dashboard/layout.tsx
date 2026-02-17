import { requireSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header userEmail={session.email} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
