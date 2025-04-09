"use client";

import { useState } from "react";
import Link from "next/link";
import { FiHexagon, FiMenu, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Request a Car", href: "#request-car-form" },
    { label: "Sell a Car", href: "/sell" },
    { label: "Search Cars", href: "/inventory" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <FiHexagon className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">CarBiz</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
          <ul className="flex items-center space-x-8">
            {navLinks.map(({ label, href }) => (
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

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 focus:outline-none"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <FiX className="h-6 w-6" />
            ) : (
              <FiMenu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute w-full bg-background border-b border-border/40 shadow-lg">
          <nav className="px-6 py-4">
            <ul className="space-y-4">
              {navLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="block text-sm font-medium py-2 hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li className="pt-4 border-t border-border/40">
                <div className="flex flex-col space-y-3">
                  <Link href="/login" className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" className="w-full">
                    <Button size="sm" className="w-full">
                      Register
                    </Button>
                  </Link>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
} 