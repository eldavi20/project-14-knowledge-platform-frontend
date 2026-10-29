import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-between bg-zinc-50 font-sans dark:bg-black dark:text-zinc-50 min-h-screen">
      <header className="w-full max-w-5xl flex justify-between items-center py-4 px-6 border-b border-zinc-200 dark:border-zinc-800">
        <span className="font-semibold text-lg tracking-tight">Permission-Aware AI Knowledge Platform</span>
        <nav>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Log in
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-8 py-24 px-16 bg-white dark:bg-black text-center sm:items-start sm:text-left">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Welcome to the Permission-Aware AI Knowledge Platform
          </h1>
          <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
            A secure, permission-aware AI knowledge platform for managing and interacting with enterprise knowledge.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row w-full sm:w-auto">
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 sm:w-[158px]"
            href="/login"
          >
            Log in
          </Link>
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-300 px-5 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900 sm:w-[158px]"
            href="/dashboard"
          >
            Dashboard
          </Link>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-900">
        Permission-Aware Knowledge Agent
      </footer>
    </div>
  );
}
