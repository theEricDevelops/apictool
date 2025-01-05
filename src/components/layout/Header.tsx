'use client';   

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Header() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    const img = document.querySelector('img[alt="PicTool Logo"]') as HTMLImageElement;
    if (img && !img.complete) {
      setIsImageLoaded(false);
    } else {
      setIsImageLoaded(true);
    }
  }, []);

  return (
    <header className="fixed w-full">
        <nav className="bg-white border-gray-200 py-2.5 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between max-w-screen-xl px-4 mx-auto">
            <div className="flex-shrink-0">
              <Link href="/" className="font-bold text-xl">
              <img 
                  src="./images/logo.svg" 
                  className="h-6 mr-3 sm:h-9" 
                  alt="PicTool Logo"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {!isImageLoaded && (
                  <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">PicTool</span>
                )}
              </Link>
            </div>
            
            <div className="hidden sm:flex sm:space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Home
              </Link>
              <Link href="/converter" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Converter
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Pricing
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Contact
              </Link>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                Get Started
              </button>
            </div>
          </div>
        </nav>
      </header>
  );
};
