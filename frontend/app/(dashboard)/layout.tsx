"use client";

import { RequireAuth } from "@/providers/auth-providers";
import { Header } from "@/components/app/Header";
import { Sidebar } from "@/components/app/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#edf4fb]">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <Header />
            <main className="fade-in p-4 md:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
