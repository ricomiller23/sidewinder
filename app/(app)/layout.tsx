import { Sidebar } from "@/components/sidebar";
import { CommandBar } from "@/components/v2/CommandBar";
import { MobileNav } from "@/components/v2/MobileNav";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row">
      <CommandBar />
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#07080B] md:ml-[260px] pb-20 md:pb-0">
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>
      <MobileNav />
    </div>
  );
}
