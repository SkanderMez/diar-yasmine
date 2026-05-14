"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/customer/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-charcoal-soft transition-colors hover:border-bougainvillier hover:bg-sand hover:text-bougainvillier"
    >
      <LogOut className="size-3.5" />
      Se déconnecter
    </button>
  );
}
