import { LogOut, Menu, Truck } from "lucide-react";
import { Link } from "react-router";

import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

import { StaffNavigation } from "./staff-navigation";
import { StoreSwitcher } from "./store-switcher";

import type { ReactNode } from "react";

interface StoreProps {
  stores: { id: string; name: string }[];
  activeId: string | null;
  role?: string | null | undefined;
}
function SidebarContent({ stores, activeId, role }: StoreProps) {
  return (
    <>
      <Link
        to="/inventory"
        className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary"
      >
        <Truck className="size-7" aria-hidden="true" />
        TrailerDesk
      </Link>
      <Separator className="my-6" />
      <StoreSwitcher stores={stores} activeId={activeId} />
      <StaffNavigation role={role} />
      <div className="mt-auto pt-6">
        <Separator className="mb-4" />
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => {
            void authClient.signOut().then(() => {
              window.location.assign("/login");
            });
          }}
        >
          <LogOut aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </>
  );
}
export function StaffShell({
  children,
  role,
  stores,
  activeId,
}: StoreProps & { children: ReactNode }) {
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="fixed inset-y-0 hidden w-[248px] flex-col border-r bg-card p-5 lg:flex">
        <SidebarContent stores={stores} activeId={activeId} role={role} />
      </aside>
      <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card px-5 lg:hidden">
        <Link
          to="/inventory"
          className="flex items-center gap-2 text-lg font-bold text-primary"
        >
          <Truck aria-hidden="true" />
          TrailerDesk
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Open dealership navigation"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader className="sr-only">
              <SheetTitle>Dealership navigation</SheetTitle>
              <SheetDescription>
                Choose your dealership or open a workspace page.
              </SheetDescription>
            </SheetHeader>
            <div className="flex h-full flex-col p-5 pt-12">
              <SidebarContent stores={stores} activeId={activeId} role={role} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="lg:col-start-2">
        <div className="mx-auto max-w-7xl p-5 lg:p-10">{children}</div>
      </div>
    </div>
  );
}
