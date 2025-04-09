"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  LayoutGrid,
  Users,
  Calendar,
  CreditCard,
  BarChart,
  Settings,
  User,
  CalendarClock,
  HandshakeIcon,
  UsersIcon
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutGrid },
    { name: "Inventory", href: "/admin/inventory", icon: Car },
    { name: "Partners", href: "/admin/partners", icon: Users },
    { name: "Leads", href: "/admin/leads", icon: Users },
    { name: "Reservations", href: "/admin/reservations", icon: Calendar },
    { name: "Test Drive Reservations", href: "/admin/test-drive-reservations", icon: CalendarClock },
    { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Logo & Brand */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <Car className="h-6 w-6" />
        <span className="font-semibold text-lg">CarBiz Admin</span>
      </div>

      {/* User Info */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gray-100 p-2">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">jbombar.ai@gmail.com</span>
            <span className="text-xs text-gray-500">Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${isActive(item.href)
                    ? "bg-gray-100 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
} 