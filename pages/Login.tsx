import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Role } from '../types';
import { Briefcase, User } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      const userStr = localStorage.getItem('localbookr_session');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user) {
        // Logic to handle specific dashboard redirects
        if (user.role === Role.ADMIN) {
           toast.success('Welcome Admin');
           navigate('/admin');
        } else if (user.role === Role.PROVIDER) {
           toast.success('Welcome Partner');
           navigate('/provider');
        } else {
           // If they tried to login as Provider but are a Customer, we still let them in
           // but maybe show a different message? For now, just redirect correctly.
           if (loginType === 'PROVIDER' && user.role !== Role.PROVIDER) {
             toast('Logged in as Customer');
           } else {
             toast.success('Welcome back!');
           }
           navigate('/dashboard');
        }
      }
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
        
        {/* Header / Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setLoginType('CUSTOMER')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center transition-colors ${
              loginType === 'CUSTOMER' 
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User size={18} className="mr-2" /> Customer
          </button>
          <button
            onClick={() => setLoginType('PROVIDER')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center transition-colors ${
              loginType === 'PROVIDER' 
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase size={18} className="mr-2" /> Provider / Admin
          </button>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {loginType === 'PROVIDER' ? 'Partner Login' : 'Welcome Back'}
          </h2>
          <p className="text-center text-gray-500 text-sm mb-8">
            {loginType === 'PROVIDER' 
              ? 'Manage your jobs and earnings.' 
              : 'Book expert local services instantly.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder={loginType === 'PROVIDER' ? 'partner@localbookr.com' : 'you@example.com'}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-transform hover:scale-[1.02]"
            >
              {loginType === 'PROVIDER' ? 'Login to Dashboard' : 'Sign In'}
            </button>
          </form>
          
          <p className="mt-8 text-center text-sm text-gray-600">
            {loginType === 'PROVIDER' ? (
              <span>Interested in joining? Contact Admin.</span>
            ) : (
              <>
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 underline">
                  Create Account
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};