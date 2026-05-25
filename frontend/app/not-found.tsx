import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="page-panel w-full max-w-xl p-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">404</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
          Сторінку не знайдено
        </h1>
        <p className="section-copy mx-auto max-w-md">
          Можливо, посилання застаріло або сторінку вже було переміщено.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/">
            <Button className="rounded-xl">Повернутися на головну</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
