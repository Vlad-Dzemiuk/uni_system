"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="sheet-overlay fixed inset-0 z-50 bg-slate-950/28 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          "sheet-content fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l border-white/70 bg-white p-6 shadow-[0_32px_60px_rgba(15,23,42,0.18)] outline-none backdrop-blur-xl",
          className
        )}
        {...props}
      >
        <SheetClose className="absolute right-4 top-4 rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Закрити">
          <X className="h-5 w-5" />
        </SheetClose>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-5 space-y-1", className)} {...props} />;
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-xl font-semibold text-slate-900", className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm leading-6 text-slate-500", className)} {...props} />;
}
