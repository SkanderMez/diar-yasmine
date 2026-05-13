import type { Session } from "next-auth";
import { LogOut, Search } from "lucide-react";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { QuickBookTriggerButton } from "@/components/admin/quick-book/trigger-button";

type TopbarProps = {
  user: NonNullable<Session["user"]>;
};

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled
          className="gap-2 text-muted-foreground"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Recherche…</span>
        </Button>
        <QuickBookTriggerButton />
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="hidden sm:inline text-sm">
                {user.name ?? user.email}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase">
                {user.role.toLowerCase()}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled
              className="text-xs text-muted-foreground"
            >
              {user.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/signin" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <LogOut className="size-4" />
                Déconnexion
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
