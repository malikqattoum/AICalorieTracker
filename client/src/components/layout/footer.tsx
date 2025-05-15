
import { Link } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <Link href="/about">
              <a className="text-neutral-500 hover:text-neutral-700">About</a>
            </Link>
            <Link href="/terms">
              <a className="text-neutral-500 hover:text-neutral-700">Terms</a>
            </Link>
            <Link href="/privacy">
              <a className="text-neutral-500 hover:text-neutral-700">Privacy</a>
            </Link>
            <Link href="/contact">
              <a className="text-neutral-500 hover:text-neutral-700">Contact</a>
            </Link>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-center md:text-right text-neutral-500 text-sm">
              &copy; {currentYear} NutriScan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
