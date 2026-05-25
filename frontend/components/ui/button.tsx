import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-[0_16px_28px_rgba(14,165,233,0.26)] hover:-translate-y-0.5 hover:brightness-[1.03]",
        outline:
          "border border-slate-200/90 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50",
        ghost: "bg-transparent text-slate-700 hover:bg-slate-100/80",
        secondary:
          "bg-slate-100 text-slate-800 shadow-sm hover:bg-slate-200/80",
        destructive:
          "bg-rose-600 text-white shadow-[0_14px_24px_rgba(225,29,72,0.24)] hover:bg-rose-700",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3.5 text-[13px]",
        lg: "h-12 px-5",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
