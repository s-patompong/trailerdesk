import {
  ContactRound,
  Files,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Truck,
} from "lucide-react";
import { NavLink } from "react-router";

import { Button } from "../ui/button";

const navigation = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/inventory", label: "Inventory", icon: Truck },
  { path: "/leads", label: "Leads", icon: MessageSquare },
  { path: "/customers", label: "Customers", icon: ContactRound },
  { path: "/deals", label: "Quotes & deals", icon: Handshake },
  { path: "/documents", label: "Documents", icon: Files },
  { path: "/ask", label: "Ask", icon: Sparkles },
  { path: "/staff", label: "Staff", icon: ContactRound },
  { path: "/failed-jobs", label: "Failed jobs", icon: Files },
  { path: "/settings", label: "Settings", icon: Settings },
];
export function StaffNavigation({ role }: { role: string | null | undefined }) {
  return (
    <nav aria-label="Main navigation" className="mt-6 flex flex-col gap-1">
      {navigation
        .filter((item) =>
          item.path === "/settings"
            ? role === "owner"
            : ["/staff", "/failed-jobs"].includes(item.path)
              ? role === "owner" || role === "manager"
              : true,
        )
        .map(({ path, label, icon: Icon }) => (
          <Button
            key={path}
            variant="ghost"
            asChild
            className="justify-start text-muted-foreground"
          >
            <NavLink
              to={path}
              className="[&.active]:bg-primary/10 [&.active]:font-semibold [&.active]:text-primary"
            >
              <Icon aria-hidden="true" />
              {label}
            </NavLink>
          </Button>
        ))}
    </nav>
  );
}
