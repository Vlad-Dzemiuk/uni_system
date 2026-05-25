"use client";

import { SidebarNav } from "./SidebarNav";

export function Sidebar() {
  return (
    <aside className="hidden w-[286px] shrink-0 border-r border-slate-200/80 bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
        <SidebarNav />
      </div>
    </aside>
  );
}
