import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";
import { Leaf } from "lucide-react";

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

  if (!user) return null;

  const userInitials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-neutral-800">NutriScan</span>
            </div>
            
            <nav className="hidden md:flex space-x-8 items-center">
              <Link href="/dashboard">
                <a className={`text-neutral-700 hover:text-primary-600 font-medium ${location === '/dashboard' ? 'text-primary-600' : ''}`}>
                  Dashboard
                </a>
              </Link>
              <Link href="/history">
                <a className={`text-neutral-700 hover:text-primary-600 font-medium ${location === '/history' ? 'text-primary-600' : ''}`}>
                  History
                </a>
              </Link>
            </nav>
            
            <div className="flex items-center">
              <div className="hidden md:flex items-center mr-4">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100">
                  <span className="text-sm font-medium leading-none text-primary-700">{userInitials}</span>
                </span>
                <span className="ml-2 text-neutral-700 font-medium">{user.firstName} {user.lastName}</span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="hidden md:flex"
                onClick={handleLogout}
              >
                Logout
              </Button>
              
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
