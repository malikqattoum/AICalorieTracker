export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <a href="#" className="text-neutral-500 hover:text-neutral-700">About</a>
            <a href="#" className="text-neutral-500 hover:text-neutral-700">Privacy</a>
            <a href="#" className="text-neutral-500 hover:text-neutral-700">Terms</a>
            <a href="#" className="text-neutral-500 hover:text-neutral-700">Contact</a>
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
