import Link from "next/link";
import { LayoutGrid } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4">
      <Link
        href="/"
        className="absolute left-4 top-4 rounded-md px-3 py-1.5 text-sm text-fg-subtle transition-colors hover:bg-bg-muted hover:text-fg"
      >
        ← Home
      </Link>
      <div className="w-full max-w-sm animate-fade-in">
        <Link
          href="/"
          className="mb-8 flex flex-col items-center text-center"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-bg">
            <LayoutGrid size={22} />
          </div>
          <h1 className="text-xl font-semibold text-fg">TaskFlow</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Real-time collaborative kanban
          </p>
        </Link>
        {children}
      </div>
    </div>
  );
}
