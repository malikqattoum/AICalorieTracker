import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";
import { Leaf, Trophy, BookOpen, User, BarChart3 } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher"; // Added import

export function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const userInitials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : null;

  return (
    <>
      <header className="bg-white/95 border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-neutral-800">NutriScan</span>
            </div>

            <nav className="hidden md:flex space-x-8 items-center">
              {user ? (
                <>
                  <Link href="/dashboard" className={`text-neutral-700 hover:text-primary-600 font-medium ${location === '/dashboard' ? 'text-primary-600' : ''}`}>
                    Dashboard
                  </Link>
                  <Link href="/history" className={`text-neutral-700 hover:text-primary-600 font-medium ${location === '/history' ? 'text-primary-600' : ''}`}>
                    History
                  </Link>
                  <Link href="/chatbot" className={`text-neutral-700 hover:text-primary-600 font-medium ${location === '/chatbot' ? 'text-primary-600' : ''}`}>
                    Nutrition Coach
                  </Link>
                  <Link href="/achievements" className={`text-neutral-700 hover:text-primary-600 font-medium ${location === '/achievements' ? 'text-primary-600' : ''}`}>
                    <Trophy className="h-4 w-4 inline mr-1" /> Achievements
                  </Link>
                  <Link href="/nutrition-education" className={`text-neutral-700 hover:text-primary-600 font-medium ${location === '/nutrition-education' ? 'text-primary-600' : ''}`}>
                    <BookOpen className="h-4 w-4 inline mr-1" /> Nutrition Education
                  </Link>
                  <Link href="/profile" className={`text-neutral-700 hover:text-primary-600 font-medium ${location === '/profile' ? 'text-primary-600' : ''}`}>
                    <User className="h-4 w-4 inline mr-1" /> Profile
                  </Link>
                  <Link href="/premium-analytics" className={`text-neutral-700 hover:text-primary-600 font-medium ${location === '/premium-analytics' ? 'text-primary-600' : ''}`}>
                    <BarChart3 className="h-4 w-4 inline mr-1" /> Analytics
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/try-it" className={`text-neutral-700 hover:text-primary-600 font-medium ${location === '/try-it' ? 'text-primary-600' : ''}`}>
                    Try It
                  </Link>
                  <Link href="/about" className={`text-neutral-700 hover:text-primary-600 font-medium ${location === '/about' ? 'text-primary-600' : ''}`}>
                    About
                  </Link>
                </>
              )}
              <LanguageSwitcher /> {/* Added LanguageSwitcher */}
            </nav>

            <div className="flex items-center">
              {user ? (
                <>
                  <div className="hidden md:flex items-center mr-4">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100">
                      <span className="text-sm font-medium leading-none text-primary-700">{userInitials}</span>
                    </span>
                    <span className="ml-2 text-neutral-700 font-medium">{user.firstName} {user.lastName}</span>
                  </div>
                  <Button 
                    size="sm"
                    className="hidden md:flex"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/auth">
                  <Button variant="default" size="sm" className="hidden md:flex">
                    Sign In
                  </Button>
                </Link>
              )}

              <button 
                type="button" 
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none"
                onClick={toggleMobileMenu}
                aria-expanded={isMobileMenuOpen}
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <MobileMenu 
          user={user}
          currentPath={location}
          onLogout={handleLogout}
          onClose={() => setIsMobileMenuOpen(false)} 
        />
      )}
    </>
  );
}