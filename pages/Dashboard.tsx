import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/authContext';
import { getBookings, addBookingRating } from '../services/db';
import { Booking, BookingStatus } from '../types';
import { Calendar, MapPin, Clock, AlertCircle, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const { user } = useAuth();
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Rating Modal State
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] = useState<Booking | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    if (user) {
      try {
        const allBookings = await getBookings();
        const filtered = allBookings.filter(b => b.customerId === user.id);
        // Sort by newest first
        setMyBookings(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (e) {
        toast.error('Could not load bookings');
      } finally {
        setLoading(false);
      }
    }
  };

  const openRatingModal = (booking: Booking) => {
    setSelectedBookingForRating(booking);
    setRatingValue(5);
    setReviewText('');
    setIsRatingModalOpen(true);
  };

  const submitRating = async () => {
    if (!selectedBookingForRating) return;

    const toastId = toast.loading('Submitting feedback...');
    try {
      await addBookingRating(
        selectedBookingForRating.id,
        ratingValue,
        reviewText,
        selectedBookingForRating.providerId || undefined
      );
      toast.success('Thank you for your feedback!', { id: toastId });
      setIsRatingModalOpen(false);
      loadBookings(); // Reload to show the rating is done
    } catch (e) {
      toast.error('Failed to submit feedback', { id: toastId });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED': return 'bg-indigo-100 text-indigo-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-4">Loading your dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
      </div>

      {myBookings.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm text-center border border-gray-200">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by booking a service from the home page.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {myBookings.map((booking) => (
              <li key={booking.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-indigo-600 truncate">
                      {booking.service?.name || 'Service'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </div>
                      
                      {/* Rating Button - Only for Completed & Unrated bookings */}
                      {booking.status === BookingStatus.COMPLETED && !booking.rating && (
                        <button 
                          onClick={() => openRatingModal(booking)}
                          className="text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded-full shadow-sm transition-colors flex items-center"
                        >
                          <Star size={12} className="mr-1" fill="currentColor" /> Rate Service
                        </button>
                      )}

                      {booking.rating && (
                        <div className="flex items-center text-yellow-500">
                          <Star size={14} fill="currentColor" />
                          <span className="text-xs font-bold ml-1">{booking.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {booking.date}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {booking.time}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {booking.area}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                       <span className="font-bold text-gray-900">₹{booking.amount}</span>
                    </div>
                  </div>
                  {booking.provider && (
                    <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="font-semibold">Assigned Professional:</span> {booking.provider.user?.name} ({booking.provider.skill})
                    </div>
                  )}
                  {booking.review && (
                    <div className="mt-2 text-sm text-gray-600 italic">
                      " {booking.review} "
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rating Modal */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Rate Service</h3>
              <button onClick={() => setIsRatingModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-4">How was the service provided by <br/> <span className="font-bold text-gray-800">{selectedBookingForRating?.provider?.user?.name || 'the provider'}</span>?</p>
              
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingValue(star)}
                    className={`transform transition-transform hover:scale-110 focus:outline-none ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-200'}`}
                  >
                    <Star size={32} fill="currentColor" />
                  </button>
                ))}
              </div>
              <p className="text-sm font-bold text-indigo-600 mt-2">
                {ratingValue === 5 ? 'Excellent!' : ratingValue === 4 ? 'Good' : ratingValue === 3 ? 'Average' : 'Poor'}
              </p>
            </div>

            <textarea 
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              rows={3}
              placeholder="Write a short review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            ></textarea>

            <button 
              onClick={submitRating}
              className="w-full mt-4 bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 shadow-lg transition-all"
            >
              Submit Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
};