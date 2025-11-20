import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { Role } from '../types';
import { LogOut, User as UserIcon, Menu, X, ChevronRight } from 'lucide-react';

export const Layout = ({ children }: React.PropsWithChildren<{}>) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ to, label }: { to: string, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-md transform scale-105' 
            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="sticky top-0 z-50 glass border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:rotate-3 transition-transform">
                  L
                </div>
                <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                  LocalBookr
                </span>
              </Link>
              <div className="hidden md:block ml-10 flex items-baseline space-x-2">
                <NavLink to="/" label="Home" />
                {user?.role === Role.CUSTOMER && <NavLink to="/dashboard" label="My Bookings" />}
                {user?.role === Role.ADMIN && (
                  <>
                    <NavLink to="/admin" label="Dashboard" />
                    <NavLink to="/admin/bookings" label="Bookings" />
                    <NavLink to="/admin/providers" label="Providers" />
                    <NavLink to="/admin/services" label="Services" />
                  </>
                )}
                {user?.role === Role.PROVIDER && <NavLink to="/provider" label="Portal" />}
              </div>
            </div>
            
            {/* Desktop Auth */}
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                {user ? (
                  <div className="flex items-center space-x-4 bg-gray-100 px-4 py-1.5 rounded-full">
                    <div className="flex flex-col items-end">
                       <span className="text-gray-900 text-sm font-semibold leading-none">{user.name}</span>
                       <span className="text-xs text-gray-500 uppercase tracking-wider">{user.role}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="bg-white p-2 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 shadow-sm transition-colors border border-gray-200"
                      title="Logout"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                     <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium text-sm transition-colors">Login</Link>
                     <Link to="/register" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center">
                        Get Started <ChevronRight size={16} className="ml-1" />
                     </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl animate-slide-up">
             <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                 <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 block px-3 py-3 rounded-md text-base font-medium">Home</Link>
                 {user?.role === Role.CUSTOMER && <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 block px-3 py-3 rounded-md text-base font-medium">My Bookings</Link>}
                 {user?.role === Role.ADMIN && (
                    <>
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 block px-3 py-3 rounded-md text-base font-medium">Dashboard</Link>
                      <Link to="/admin/bookings" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 block px-3 py-3 rounded-md text-base font-medium">Bookings</Link>
                    </>
                 )}
                 {user?.role === Role.PROVIDER && <Link to="/provider" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 block px-3 py-3 rounded-md text-base font-medium">Portal</Link>}
             </div>
             
             <div className="pt-4 pb-4 border-t border-gray-100 bg-gray-50">
                {user ? (
                  <div className="px-4 flex items-center justify-between">
                    <div className="flex items-center">
                       <div className="ml-3">
                         <div className="text-base font-medium leading-none text-gray-800">{user.name}</div>
                         <div className="text-sm font-medium leading-none text-gray-500 mt-1">{user.email}</div>
                       </div>
                    </div>
                    <button onClick={handleLogout} className="ml-auto bg-white p-2 rounded-full text-red-600 shadow-sm border border-gray-200">
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="px-4 space-y-3">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50">Login</Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">Sign Up</Link>
                  </div>
                )}
             </div>
          </div>
        )}
      </nav>
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
           <div className="mb-4 md:mb-0">
              <span className="font-bold text-gray-900 text-lg">LocalBookr</span>
              <p className="text-gray-500 text-sm">Trusted services in Aurangabad.</p>
           </div>
          <p className="text-center text-gray-400 text-sm">© 2024 LocalBookr Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};