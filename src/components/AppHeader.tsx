import Link from "next/link";
import { site } from "@/lib/site";
import { SignOutButton } from "./SignOutButton";

export function AppHeader({ home, label, email }: { home: string; label: string; email: string }) {
  return (
    <header className="bg-pine text-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
        <Link href={home} className="min-w-0">
          <span className="display block text-xl">{site.name}</span>
          <span className="block truncate text-xs text-white/70">{label}: {email}</span>
        </Link>
        <SignOutButton />
      </div>
    </header>
  );
}
