import React, { useEffect, useState } from 'react';
import { getBookings, getProviders, updateBookingStatus } from '../../services/db';
import { Booking, BookingStatus, Provider } from '../../types';
import toast from 'react-hot-toast';
import { Filter, X } from 'lucide-react';

export const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [b, p] = await Promise.all([getBookings(), getProviders()]);
      setBookings(b);
      setProviders(p);
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    try {
      await updateBookingStatus(id, status);
      toast.success(`Status updated to ${status}`);
      loadData();
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const handleAssignClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setAssignModalOpen(true);
  };

  const handleAssignProvider = async (providerId: string) => {
    if (selectedBooking) {
      try {
        await updateBookingStatus(selectedBooking.id, BookingStatus.ASSIGNED, providerId);
        toast.success('Provider assigned successfully');
        setAssignModalOpen(false);
        loadData();
      } catch (e) {
        toast.error('Assignment failed');
      }
    }
  };

  // Filter Logic
  const filteredBookings = bookings.filter(b => 
    statusFilter === 'ALL' ? true : b.status === statusFilter
  );

  // Provider Matching Logic: Active + Matches Service Skill
  const eligibleProviders = selectedBooking 
    ? providers.filter(p => p.isActive && p.skill === selectedBooking.service?.name)
    : [];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-gray-500" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
          >
            <option value="ALL">All Statuses</option>
            {Object.values(BookingStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{booking.customer?.name}</div>
                  <div className="text-sm text-gray-500">{booking.customer?.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{booking.service?.name}</div>
                  <div className="text-sm text-gray-500">₹{booking.amount}</div>
                </td>
                <td className="px-6 py-4">
                   <div className="text-sm text-gray-900">{booking.date} @ {booking.time}</div>
                   <div className="text-xs text-gray-500">{booking.area}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.provider ? (
                    <span className="font-medium text-indigo-600">{booking.provider.user?.name}</span>
                  ) : (
                    <span className="text-red-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {booking.status === BookingStatus.PENDING && (
                    <>
                      <button onClick={() => handleStatusChange(booking.id, BookingStatus.CONFIRMED)} className="text-green-600 hover:text-green-900">Confirm</button>
                      <button onClick={() => handleStatusChange(booking.id, BookingStatus.CANCELLED)} className="text-red-600 hover:text-red-900">Cancel</button>
                    </>
                  )}
                  {booking.status === BookingStatus.CONFIRMED && !booking.providerId && (
                     <button onClick={() => handleAssignClick(booking)} className="text-indigo-600 hover:text-indigo-900 border border-indigo-200 px-2 py-1 rounded bg-indigo-50">Assign</button>
                  )}
                  {booking.status === BookingStatus.ASSIGNED && (
                    <span className="text-gray-400">Waiting for Provider</span>
                  )}
                  {booking.status === BookingStatus.IN_PROGRESS && (
                    <button onClick={() => handleStatusChange(booking.id, BookingStatus.COMPLETED)} className="text-green-600 hover:text-green-900 border border-green-200 px-2 py-1 rounded bg-green-50">Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Provider Modal */}
      {assignModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Assign Provider for {selectedBooking.service?.name}</h3>
              <button onClick={() => setAssignModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="mb-4 text-sm text-gray-500">Select an available professional for {selectedBooking.area}.</p>
              
              {eligibleProviders.length === 0 ? (
                <div className="text-center py-4 text-red-500 bg-red-50 rounded">No active providers found with skill: {selectedBooking.service?.name}</div>
              ) : (
                <div className="space-y-2">
                  {eligibleProviders.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleAssignProvider(p.id)}
                      className="w-full flex justify-between items-center p-3 border rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{p.user?.name}</div>
                        <div className="text-xs text-gray-500">{p.area}</div>
                      </div>
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                         {p.rating} ★
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
