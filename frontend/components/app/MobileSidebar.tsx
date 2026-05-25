"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { SidebarNav } from "./SidebarNav";

export function MobileSidebar() {
  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="rounded-2xl">
            <Menu className="h-4 w-4" />
            Меню
          </Button>
        </SheetTrigger>
        <SheetContent className="max-w-[340px] bg-white p-0 text-slate-900">
          <SheetHeader className="border-b border-slate-200 p-5 pb-4">
            <SheetTitle className="text-slate-900">Навігація</SheetTitle>
          </SheetHeader>
          <SidebarNav compact />
        </SheetContent>
      </Sheet>
    </div>
  );
}
