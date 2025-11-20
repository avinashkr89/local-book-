import React, { useEffect, useState } from 'react';
import { getServices, createService, deleteService, updateService } from '../../services/db';
import { Service } from '../../types';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

export const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
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

  const handleEditClick = (service: Service) => {
    setEditingServiceId(service.id);
    setFormData({
      name: service.name,
      description: service.description,
      basePrice: service.basePrice.toString(),
      icon: service.icon
    });
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingServiceId(null);
    setFormData({ name: '', description: '', basePrice: '', icon: 'Wrench' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingServiceId) {
        // Edit Mode
        await updateService(editingServiceId, {
          name: formData.name,
          description: formData.description,
          basePrice: Number(formData.basePrice),
          icon: formData.icon
        });
        toast.success('Service updated successfully');
      } else {
        // Create Mode
        await createService({
          name: formData.name,
          description: formData.description,
          basePrice: Number(formData.basePrice),
          icon: formData.icon
        });
        toast.success('Service added successfully');
      }
      
      loadServices();
      setIsModalOpen(false);
    } catch (e) {
      toast.error('Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <button onClick={handleAddClick} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-sm">
          <Plus size={18} className="mr-2" /> Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map(service => (
          <div key={service.id} className="bg-white p-6 rounded-lg shadow border relative group">
            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEditClick(service)} 
                className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded"
                title="Edit Price/Details"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(service.id)} 
                className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"
                title="Delete Service"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-500 mt-1 min-h-[40px]">{service.description}</p>
            <p className="mt-4 text-xl font-bold text-indigo-600">₹{service.basePrice}</p>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-2 inline-block">Icon: {service.icon}</span>
          </div>
        ))}
      </div>

      {isModalOpen && (
         <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-slide-up">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">{editingServiceId ? 'Edit Service' : 'Add New Service'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Name</label>
                 <input className="w-full border border-gray-300 p-2 rounded focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                 <textarea className="w-full border border-gray-300 p-2 rounded focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" rows={3} placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Price (₹)</label>
                 <input className="w-full border border-gray-300 p-2 rounded focus:ring-indigo-500 focus:border-indigo-500 outline-none" type="number" placeholder="Base Price" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} required />
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Icon</label>
                 <select className="w-full border border-gray-300 p-2 rounded focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})}>
                   <option value="Wrench">Wrench (Repair)</option>
                   <option value="Zap">Zap (Electric)</option>
                   <option value="SprayCan">SprayCan (Cleaning)</option>
                   <option value="BookOpen">Book (Education)</option>
                   <option value="Briefcase">Briefcase (General)</option>
                 </select>
               </div>

               <div className="flex justify-end space-x-3 pt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium">Cancel</button>
                 <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 shadow-lg">{editingServiceId ? 'Update Service' : 'Save Service'}</button>
               </div>
             </form>
          </div>
         </div>
      )}
    </div>
  );
};