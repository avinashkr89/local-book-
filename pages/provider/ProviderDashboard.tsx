import React, { useEffect, useState } from 'react';
import { useAuth } from '../../services/authContext';
import { getBookings, getProviders, updateBookingStatus } from '../../services/db';
import { Booking, BookingStatus } from '../../types';
import toast from 'react-hot-toast';
import { Phone, MapPin, Calendar, PlayCircle, CheckCircle } from 'lucide-react';

export const ProviderDashboard = () => {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, [user]);

  const loadJobs = async () => {
    if (user) {
      try {
        // 1. Find Provider ID linked to this User ID
        const providers = await getProviders();
        const me = providers.find(p => p.userId === user.id);
        
        if (me) {
          const allBookings = await getBookings();
          // Filter jobs assigned to this provider
          const jobs = allBookings.filter(b => b.providerId === me.id && b.status !== BookingStatus.CANCELLED);
          setMyJobs(jobs);
        }
      } catch (e) {
        toast.error('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    try {
      await updateBookingStatus(id, status);
      toast.success('Job status updated');
      loadJobs();
    } catch (e) {
      toast.error('Update failed');
    }
  };

  if (loading) return <div className="p-4">Loading portal...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Provider Portal</h1>
      <p className="text-gray-600">Manage your assigned jobs in Aurangabad.</p>

      {myJobs.length === 0 ? (
         <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
           No jobs assigned yet.
         </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {myJobs.map(job => (
            <div key={job.id} className="bg-white shadow rounded-lg p-6 border-l-4 border-indigo-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{job.service?.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2
                    ${job.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' : 
                      job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {job.status}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">₹{job.amount}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.customer?.name}</p>
                    <p className="text-sm text-gray-500">{job.address}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mt-1">{job.area}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                   <div className="flex items-center text-sm text-gray-500">
                     <Phone className="h-4 w-4 mr-2" />
                     <a href={`tel:${job.customer?.phone}`} className="hover:underline">{job.customer?.phone}</a>
                   </div>
                   <div className="flex items-center text-sm text-gray-500">
                     <Calendar className="h-4 w-4 mr-2" />
                     {job.date} at {job.time}
                   </div>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 p-3 rounded text-sm text-gray-700">
                <span className="font-semibold">Problem:</span> {job.description}
              </div>

              <div className="mt-6 flex space-x-3 border-t pt-4">
                {job.status === BookingStatus.ASSIGNED && (
                  <button 
                    onClick={() => handleStatusUpdate(job.id, BookingStatus.IN_PROGRESS)}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlayCircle className="mr-2 h-4 w-4" /> Start Job
                  </button>
                )}
                {job.status === BookingStatus.IN_PROGRESS && (
                  <button 
                    onClick={() => handleStatusUpdate(job.id, BookingStatus.COMPLETED)}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark Completed
                  </button>
                )}
                {job.status === BookingStatus.COMPLETED && (
                  <p className="w-full text-center text-green-600 font-medium text-sm py-2">Job Completed</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
