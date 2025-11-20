import React, { useEffect, useState } from 'react';
import { getProviders, createProvider, createUser, updateProvider, getServices } from '../../services/db';
import { Provider, Role, Service } from '../../types';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';

export const AdminProviders = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    skill: '',
    area: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [p, s] = await Promise.all([getProviders(), getServices()]);
      setProviders(p);
      setServices(s);
    } catch (e) {
      toast.error('Error loading data');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateProvider(id, { isActive: !currentStatus });
      loadData();
      toast.success(`Provider ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Creating provider...');
    try {
      // 1. Create User
      const newUser = await createUser({
        name: formData.name,
        email: formData.email,
        passwordHash: formData.password,
        phone: formData.phone,
        role: Role.PROVIDER,
      });
      // 2. Create Provider Profile
      await createProvider(newUser.id, formData.skill, formData.area);
      
      toast.success('Provider created successfully', { id: toastId });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '', skill: '', area: '' });
      loadData();
    } catch (error: any) {
      toast.error('Failed to create provider. Email might be in use.', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Provider
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providers.map((provider) => (
              <tr key={provider.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{provider.user?.name}</div>
                  <div className="text-sm text-gray-500">{provider.user?.email}</div>
                  <div className="text-xs text-gray-400">{provider.user?.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.skill}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.area}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${provider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {provider.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleToggleActive(provider.id, provider.isActive)}
                    className={`text-indigo-600 hover:text-indigo-900 ${provider.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                  >
                    {provider.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Add New Provider</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input type="text" placeholder="Full Name" required className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="email" placeholder="Email" required className="w-full border p-2 rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input type="text" placeholder="Phone" required className="w-full border p-2 rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input type="password" placeholder="Password" required className="w-full border p-2 rounded" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <select required className="w-full border p-2 rounded" value={formData.skill} onChange={e => setFormData({...formData, skill: e.target.value})}>
                <option value="">Select Skill</option>
                {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <input type="text" placeholder="Service Area" required className="w-full border p-2 rounded" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
              
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Create Provider</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
