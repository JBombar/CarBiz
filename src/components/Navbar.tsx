"use client";

import Link from "next/link";
import { FiHexagon } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <FiHexagon className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">CarBiz</span>
          </Link>
        </div>

        <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
          <ul className="flex items-center space-x-8">
            {[
              { label: "Home", href: "/" },
              { label: "Request a Car", href: "#request-car-form" },
              { label: "Sell a Car", href: "/sell" },
              { label: "Search Cars", href: "/inventory" },
              { label: "About Us", href: "/about" },
              { label: "Contact", href: "/contact" },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-sm font-medium relative px-3 py-2 transition-all duration-300 group"
                >
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                    {label}
                  </span>
                  <span className="absolute inset-0 rounded-md bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out z-0"></span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>



        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback></AvatarFallback>
          </Avatar>
          <Link href="/login">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="hidden sm:inline-flex">
              Register
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile menu - to be implemented for full responsiveness */}
      <div className="md:hidden">
        {/* We can add a hamburger menu here for mobile */}
      </div>
    </header>
  );
} 