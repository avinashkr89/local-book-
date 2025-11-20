import React, { useEffect, useState } from 'react';
import { getServices, createService, deleteService } from '../../services/db';
import { Service } from '../../types';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';

export const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', basePrice: '', icon: 'Wrench' });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const data = await getServices();
    setServices(data);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? This might affect bookings linked to this service.')) {
      try {
        await deleteService(id);
        loadServices();
        toast.success('Service deleted');
      } catch (e) {
        toast.error('Failed to delete');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createService({
        name: formData.name,
        description: formData.description,
        basePrice: Number(formData.basePrice),
        icon: formData.icon
      });
      toast.success('Service added');
      loadServices();
      setIsModalOpen(false);
      setFormData({ name: '', description: '', basePrice: '', icon: 'Wrench' });
    } catch (e) {
      toast.error('Failed to add service');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          <Plus size={18} className="mr-2" /> Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map(service => (
          <div key={service.id} className="bg-white p-6 rounded-lg shadow border relative">
            <button onClick={() => handleDelete(service.id)} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
              <Trash2 size={18} />
            </button>
            <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{service.description}</p>
            <p className="mt-4 font-bold text-indigo-600">₹{service.basePrice}</p>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-2 inline-block">Icon: {service.icon}</span>
          </div>
        ))}
      </div>

      {isModalOpen && (
         <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Add Service</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
               <input className="w-full border p-2 rounded" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
               <textarea className="w-full border p-2 rounded" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
               <input className="w-full border p-2 rounded" type="number" placeholder="Base Price" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} required />
               <select className="w-full border p-2 rounded" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})}>
                 <option value="Wrench">Wrench</option>
                 <option value="Zap">Zap (Electric)</option>
                 <option value="SprayCan">SprayCan (Cleaning)</option>
                 <option value="BookOpen">Book (Tutor)</option>
                 <option value="Briefcase">Briefcase (General)</option>
               </select>
               <div className="flex justify-end space-x-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                 <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
               </div>
             </form>
          </div>
         </div>
      )}
    </div>
  );
};
