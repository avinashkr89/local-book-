
import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/authContext';
import { getBookings, addBookingRating, generateCompletionPin } from '../services/db';
import { Booking, BookingStatus } from '../types';
import { Calendar, MapPin, Clock, AlertCircle, Star, X, Lock, ShieldCheck, Eye, EyeOff, Copy } from 'lucide-react';
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

  // PIN Visibility State
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 15000); 
    return () => clearInterval(interval);
  }, [user]);

  const loadBookings = async () => {
    if (user) {
      try {
        const allBookings = await getBookings();
        const filtered = allBookings.filter(b => b.customerId === user.id);
        setMyBookings(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (e) {
        toast.error('Could not load bookings');
      } finally {
        setLoading(false);
      }
    }
  };

  const togglePin = (id: string) => {
    setRevealedPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    toast.success('PIN Copied!');
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
      loadBookings(); 
    } catch (e: any) {
      const msg = e.message || 'Unknown error';
      console.error("Submit Rating Error:", msg);
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
      case 'WAITING': return 'bg-orange-100 text-orange-800';
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
            {myBookings.map((booking) => {
               const pin = generateCompletionPin(booking.id, booking.createdAt);
               const isRevealed = revealedPins[booking.id];

               return (
                <li key={booking.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-lg font-medium text-indigo-600 truncate">
                          {booking.service?.name || 'Service'}
                        </p>
                        {booking.status === 'WAITING' && (
                          <p className="text-xs text-orange-500 font-bold mt-1">Finding nearby provider...</p>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                        <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </div>
                        
                        {booking.status === BookingStatus.COMPLETED && !booking.rating && (
                          <button 
                            onClick={() => openRatingModal(booking)}
                            className="text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-full shadow-sm transition-colors flex items-center whitespace-nowrap"
                          >
                            <Star size={12} className="mr-1" fill="currentColor" /> Rate Service
                          </button>
                        )}

                        {booking.rating && (
                          <div className="flex items-center text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                            <Star size={14} fill="currentColor" />
                            <span className="text-xs font-bold ml-1">{booking.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:flex sm:justify-between">
                      <div className="sm:flex sm:gap-6">
                        <p className="flex items-center text-sm text-gray-500 mb-2 sm:mb-0">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {booking.date}
                        </p>
                        <p className="flex items-center text-sm text-gray-500 mb-2 sm:mb-0">
                          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {booking.time}
                        </p>
                        <p className="flex items-center text-sm text-gray-500 mb-2 sm:mb-0">
                          <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {booking.area}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">₹{booking.amount}</span>
                      </div>
                    </div>
                    
                    {booking.provider && (
                      <div className="mt-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-gray-700">Provider:</span> {booking.provider.user?.name}
                        </div>
                      </div>
                    )}

                    {/* CUSTOMER PIN VIEW */}
                    {(booking.status === BookingStatus.ASSIGNED || booking.status === BookingStatus.IN_PROGRESS) && (
                      <div className="mt-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
                          <div className="flex items-start">
                            <div className="bg-white p-2 rounded-full shadow-sm text-indigo-600 mr-3">
                              <ShieldCheck size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-indigo-900">Completion PIN</h4>
                              <p className="text-xs text-indigo-700 max-w-xs mt-1">
                                Give this PIN to the provider <strong>only after</strong> the job is done.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <div className={`bg-white px-4 py-2 rounded-lg border-2 border-indigo-100 shadow-sm min-w-[120px] text-center transition-all ${!isRevealed ? 'blur-sm select-none' : ''}`}>
                                <span className="font-mono text-xl font-bold tracking-[0.2em] text-indigo-600">
                                  {pin}
                                </span>
                             </div>
                             
                             <button onClick={() => togglePin(booking.id)} className="p-2 text-indigo-500 hover:bg-indigo-100 rounded-full" title={isRevealed ? "Hide" : "Show"}>
                               {isRevealed ? <EyeOff size={18} /> : <Eye size={18} />}
                             </button>
                             
                             <button onClick={() => copyPin(pin)} className="p-2 text-indigo-500 hover:bg-indigo-100 rounded-full" title="Copy">
                               <Copy size={18} />
                             </button>
                          </div>
                      </div>
                    )}

                    {booking.review && (
                      <div className="mt-3 text-sm text-gray-600 italic border-l-2 border-gray-300 pl-3">
                        " {booking.review} "
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
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
              className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 shadow-lg transition-all"
            >
              Submit Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
