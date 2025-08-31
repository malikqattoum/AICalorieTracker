import { Link } from "wouter";
import { User } from "@shared/schema";
import { Trophy, BookOpen, User as UserIcon, BarChart3 } from "lucide-react";

interface MobileMenuProps {
  user: User | null;
  currentPath: string;
  onLogout: () => void;
  onClose: () => void;
}

export function MobileMenu({ user, currentPath, onLogout, onClose }: MobileMenuProps) {
  const userInitials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : null;

  const handleLinkClick = () => {
    onClose();
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <div className="md:hidden bg-white border-b border-neutral-200 px-4 py-2">
      {user && (
        <div className="flex items-center py-2">
          <div className="flex items-center">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100">
              <span className="text-sm font-medium leading-none text-primary-700">{userInitials}</span>
            </span>
            <span className="ml-2 text-neutral-700 font-medium">{user.firstName} {user.lastName}</span>
          </div>
        </div>
      )}
      <nav className="py-2 space-y-1">
        <Link href="/dashboard" onClick={handleLinkClick}>
          <a className={`block px-3 py-2 rounded-md text-base font-medium ${
            currentPath === '/dashboard' 
              ? 'text-primary-700 bg-primary-50' 
              : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
          }`}>
            Dashboard
          </a>
        </Link>
        <Link href="/history" onClick={handleLinkClick}>
          <a className={`block px-3 py-2 rounded-md text-base font-medium ${
            currentPath === '/history'
              ? 'text-primary-700 bg-primary-50'
              : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
          }`}>
            History
          </a>
        </Link>
        <Link href="/chatbot" onClick={handleLinkClick}>
          <a className={`block px-3 py-2 rounded-md text-base font-medium ${
            currentPath === '/chatbot'
              ? 'text-primary-700 bg-primary-50'
              : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
          }`}>
            Nutrition Coach
          </a>
        </Link>
        <Link href="/achievements" onClick={handleLinkClick}>
          <a className={`block px-3 py-2 rounded-md text-base font-medium ${
            currentPath === '/achievements'
              ? 'text-primary-700 bg-primary-50'
              : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
          }`}>
            <Trophy className="h-4 w-4 inline mr-2" /> Achievements
          </a>
        </Link>
        <Link href="/nutrition-education" onClick={handleLinkClick}>
          <a className={`block px-3 py-2 rounded-md text-base font-medium ${
            currentPath === '/nutrition-education'
              ? 'text-primary-700 bg-primary-50'
              : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
          }`}>
            <BookOpen className="h-4 w-4 inline mr-2" /> Nutrition Education
          </a>
        </Link>
        <Link href="/profile" onClick={handleLinkClick}>
          <a className={`block px-3 py-2 rounded-md text-base font-medium ${
            currentPath === '/profile'
              ? 'text-primary-700 bg-primary-50'
              : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
          }`}>
            <UserIcon className="h-4 w-4 inline mr-2" /> Profile
          </a>
        </Link>
        <Link href="/premium-analytics" onClick={handleLinkClick}>
          <a className={`block px-3 py-2 rounded-md text-base font-medium ${
            currentPath === '/premium-analytics'
              ? 'text-primary-700 bg-primary-50'
              : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
          }`}>
            <BarChart3 className="h-4 w-4 inline mr-2" /> Analytics
          </a>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-primary-600 hover:bg-primary-50"
        >
          Logout
        </button>
      </nav>
    </div>
  );
}
