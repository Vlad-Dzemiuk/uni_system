"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const go = (nextPage: number) => onPageChange(Math.min(Math.max(nextPage, 1), pageCount));
  const numbers = (() => {
    const out: number[] = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(pageCount, page + 1);
    for (let index = start; index <= end; index += 1) out.push(index);
    return out;
  })();

  return (
    <div className={cn("mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="text-sm text-slate-500">
        Сторінка <span className="font-semibold text-slate-900">{page}</span> із{" "}
        <span className="font-semibold text-slate-900">{pageCount}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => go(page - 1)} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4" />
          Назад
        </Button>

        {page > 2 ? (
          <Button variant="ghost" size="sm" onClick={() => go(1)}>
            1
          </Button>
        ) : null}

        {numbers.map((number) => (
          <Button
            key={number}
            variant={number === page ? "default" : "ghost"}
            size="sm"
            onClick={() => go(number)}
          >
            {number}
          </Button>
        ))}

        {page < pageCount - 1 ? (
          <Button variant="ghost" size="sm" onClick={() => go(pageCount)}>
            {pageCount}
          </Button>
        ) : null}

        <Button variant="outline" size="sm" onClick={() => go(page + 1)} disabled={page === pageCount}>
          Далі
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
