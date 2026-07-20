import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
        <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Notas
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-neutral-500 dark:text-neutral-400 sm:inline">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
