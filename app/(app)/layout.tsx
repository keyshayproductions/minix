import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
