"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (path: string) => pathname?.startsWith(path);

  const handleLinkClick = () => {
    setMenuOpen(false); // Close menu after navigation
  };

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Family Heritage
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <Link
              href="/dashboard"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                isActive("/dashboard")
                  ? "border-blue-500 text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              Dashboard
            </Link>
            {session ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="sm:hidden flex flex-col space-y-2 mt-2 pb-4 border-t pt-4">
            <Link
              href="/dashboard"
              onClick={handleLinkClick}
              className={`block px-4 py-2 text-sm font-medium ${
                isActive("/dashboard")
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Dashboard
            </Link>
            {session ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 text-left"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/auth/signin"
                onClick={handleLinkClick}
                className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
