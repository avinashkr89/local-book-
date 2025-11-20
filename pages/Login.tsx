import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Role } from '../types';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      toast.success('Welcome back!');
      // Redirect based on local storage role check or just let the effect in context handle it? 
      // Better to check the User object, but context update is async-ish in React state.
      // We'll do a simple timeout or check result. 
      // Actually, we need to know the role to redirect *now*.
      // Let's look up the user manually for redirect logic, or rely on the App.tsx useEffect to redirect?
      // Standard pattern:
      const userStr = localStorage.getItem('localbookr_session');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user?.role === Role.ADMIN) navigate('/admin');
      else if (user?.role === Role.PROVIDER) navigate('/provider');
      else navigate('/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Sign in to LocalBookr</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Demo Credentials:</p>
          <p className="mt-1">Admin: admin@localbookr.com / Admin@123</p>
          <p>Customer: customer@demo.com / 123456</p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};