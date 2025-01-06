'use client';   

import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed w-full">
        <nav className="bg-white border-gray-200 py-2.5 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between max-w-screen-xl px-4 mx-auto">
            <div className="flex-shrink-0">
              <Link href="/" className="font-bold text-xl">
              <img
                  src="/images/logo.svg"
                  className="h-6 mr-3 sm:h-9"
                  alt="PicTool Logo"
              />
                  <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">PicTool</span>
            </Link>
          </div>
            <div className="hidden sm:flex sm:space-x-8 items-center">
              <Link href="/" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2">
                Home
              </Link>
              <Link href="/converter" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2">
                Converter
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2">
                Pricing
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2">
                Contact
              </Link>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {theme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
                ) : (
                <MoonIcon className="w-5 h-5" />
                )}
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                Get Started
              </button>
            </div>
          </div>
        </nav>
      </header>
  );
}
