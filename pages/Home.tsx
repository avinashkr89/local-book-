
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getServices, searchProviders } from '../services/db';
import { Service, Provider } from '../types';
import { Wrench, Zap, SprayCan, BookOpen, Briefcase, Search, MapPin, Star, ArrowRight, ShieldCheck, Clock, UserCheck, X, Mail, Phone, Send, Hammer, Paintbrush, Smartphone, Car, Scissors, Truck, CheckCircle2, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const IconMap: Record<string, React.FC<any>> = {
  Wrench, Zap, SprayCan, BookOpen, Briefcase,
  Hammer, Paintbrush, Smartphone, Car, Scissors, Truck
};

export const Home = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search State
  const [selectedService, setSelectedService] = useState<string>('');
  const [searchArea, setSearchArea] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Provider[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (e) {
        toast.error('Failed to load services');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) {
      toast.error('Please select a service type');
      return;
    }
    if (!searchArea) {
      toast.error('Please enter your area or location');
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchProviders(selectedService, searchArea);
      setSearchResults(results);
      if (results.length === 0) {
        toast('No providers found. Try a different area.', { icon: '🔍' });
      }
    } catch (e) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
    setSelectedService('');
    setSearchArea('');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    const formData = new FormData();
    formData.append("access_key", "f4dc1e02-a136-4902-8b55-403c200e07c4"); 
    formData.append("name", contactForm.name);
    formData.append("email", contactForm.email);
    formData.append("message", contactForm.message);
    formData.append("subject", "New Contact from LocalBookr");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Message sent successfully!");
        setContactForm({ name: '', email: '', message: '' });
      } else {
        if (data.message && data.message.includes("Can only be used on")) {
          toast.error("API Key Domain Restricted.", { duration: 6000 });
        } else {
          toast.error(data.message || "Something went wrong.");
        }
      }
    } catch (error) {
      toast.error("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-16 pb-10">
      {/* Hero Section - Overlapping Search */}
      <section className="relative rounded-3xl overflow-hidden shadow-card bg-dark text-white mb-20">
        {/* Background Image & Gradient */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark/60 to-dark"></div>
        
        <div className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6 text-emerald-300 animate-fade-in">
            Aurangabad's #1 Service Platform
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6 animate-slide-up drop-shadow-lg leading-tight">
            Quality Home Services,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">On Demand.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300 animate-fade-in mb-8">
            Book trusted electricians, plumbers, cleaners, and more. Verified professionals at your doorstep.
          </p>
        </div>

        {/* Search Bar - Floating Overlay */}
        <div className="absolute -bottom-12 left-0 right-0 px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-3 shadow-card border border-gray-100 flex flex-col md:flex-row gap-3 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2 flex flex-col justify-center group focus-within:ring-2 ring-primary/20 focus-within:bg-white transition-all">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide group-hover:text-primary transition-colors">Service</label>
              <select 
                className="w-full bg-transparent border-none p-0 text-gray-900 font-bold text-sm focus:ring-0 cursor-pointer"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <option value="">Select a Service...</option>
                {services.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2 flex flex-col justify-center group focus-within:ring-2 ring-primary/20 focus-within:bg-white transition-all relative">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide group-hover:text-primary transition-colors">Location</label>
              <div className="flex items-center">
                 <input 
                  type="text" 
                  placeholder="e.g. Cidco, Hudco" 
                  className="w-full bg-transparent border-none p-0 text-gray-900 font-bold text-sm focus:ring-0 placeholder-gray-300"
                  value={searchArea}
                  onChange={(e) => setSearchArea(e.target.value)}
                />
                <MapPin size={16} className="text-gray-400 ml-2" />
              </div>
            </div>

            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full md:w-auto bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-gray-900/20 flex items-center justify-center disabled:opacity-70 disabled:scale-100"
            >
              {isSearching ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Find Pros'}
            </button>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <div className="flex justify-center gap-4 md:gap-12 text-sm font-medium text-gray-500 flex-wrap px-4 pt-4">
         <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
           <ShieldCheck size={18} className="mr-2 text-emerald-500" /> Verified Professionals
         </div>
         <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
           <Clock size={18} className="mr-2 text-blue-500" /> On-Time Service
         </div>
         <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
           <UserCheck size={18} className="mr-2 text-purple-500" /> Safe & Secure
         </div>
      </div>

      {/* Search Results - Profile Style Cards */}
      {searchResults && (
        <div className="animate-fade-in-up scroll-mt-24 px-2" id="results">
          <div className="flex justify-between items-center mb-6 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">
              {searchResults.length} {selectedService} Pros in <span className="text-primary capitalize">{searchArea}</span>
            </h2>
            <button onClick={clearSearch} className="text-sm font-medium text-gray-500 hover:text-red-600 flex items-center bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
              <X size={16} className="mr-1" /> Clear Search
            </button>
          </div>

          {searchResults.length === 0 ? (
             <div className="max-w-md mx-auto bg-white p-10 rounded-3xl text-center border border-gray-100 shadow-card">
               <div className="inline-flex bg-gray-50 p-4 rounded-full mb-4">
                  <Search size={32} className="text-gray-400" />
               </div>
               <h3 className="text-lg font-bold text-gray-900">No professionals nearby</h3>
               <p className="text-gray-500 mt-2 text-sm">We couldn't find a verified {selectedService} provider in {searchArea}.</p>
               <button onClick={() => { setSearchResults(null); setSearchArea(''); }} className="mt-6 text-primary font-bold text-sm hover:underline">View all categories</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              {searchResults.map((provider) => {
                const serviceDetails = services.find(s => s.name === provider.skill);
                return (
                  <div key={provider.id} className="bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                    
                    {/* Card Header / Cover */}
                    <div className="h-24 bg-gradient-to-r from-gray-900 to-gray-800 relative">
                       <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                             <ShieldCheck size={12} className="mr-1" /> VERIFIED
                          </span>
                       </div>
                    </div>
                    
                    {/* Profile Info */}
                    <div className="px-6 pb-6 flex-grow relative">
                       {/* Avatar overlapping header */}
                       <div className="-mt-12 mb-3 inline-block relative">
                          <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-lg rotate-3">
                             <div className="h-full w-full rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-2xl uppercase">
                                {provider.user?.name.charAt(0)}
                             </div>
                          </div>
                          {/* Online/Status dot */}
                          <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-white rounded-full transform translate-x-1 translate-y-1"></div>
                       </div>

                       <div className="flex justify-between items-start mb-2">
                         <div>
                           <h3 className="text-xl font-bold text-gray-900 leading-tight">{provider.user?.name}</h3>
                           <p className="text-primary font-semibold text-sm flex items-center mt-1">
                              {provider.skill} Specialist
                           </p>
                         </div>
                         <div className="text-right">
                            <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                               <Star size={14} className="text-yellow-500 fill-current" />
                               <span className="ml-1 font-bold text-gray-900 text-sm">{provider.rating > 0 ? provider.rating : 'New'}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">{Math.floor(Math.random() * 50) + 5} Jobs</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <MapPin size={14} className="mr-1 text-gray-400" />
                        {provider.area}
                      </div>

                      {/* Mini Bio / Stats */}
                      <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 mb-4 grid grid-cols-2 gap-2">
                         <div className="flex items-center">
                            <CheckCircle2 size={14} className="mr-1.5 text-emerald-500"/> {provider.experienceYears || 1}+ Years Exp
                         </div>
                         <div className="flex items-center">
                            <Award size={14} className="mr-1.5 text-orange-500"/> Highly Rated
                         </div>
                      </div>

                      {provider.bio && (
                        <p className="text-xs text-gray-500 italic mb-4 line-clamp-2">"{provider.bio}"</p>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <div>
                           <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Service Fee</p>
                           <p className="text-lg font-bold text-gray-900">₹{serviceDetails?.basePrice}</p>
                        </div>
                        <Link 
                          to={`/book/${serviceDetails?.id}?providerId=${provider.id}&area=${searchArea}`}
                          className="bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-primary hover:shadow-lg hover:shadow-primary/30 text-sm font-bold transition-all"
                        >
                          Book Now
                        </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Categories Grid */}
      {!searchResults && (
        <div className="max-w-7xl mx-auto px-4 animate-slide-up" style={{animationDelay: '0.3s'}}>
          <div className="flex items-end justify-between mb-8">
             <div>
               <h2 className="text-2xl font-bold text-gray-900">Explore Categories</h2>
               <p className="text-gray-500 text-sm mt-1">Everything you need for your home</p>
             </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map((service) => {
              const Icon = IconMap[service.icon] || Briefcase;
              return (
                <div key={service.id} className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 cursor-pointer flex flex-col items-center text-center relative overflow-hidden">
                  {/* Hover Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="h-14 w-14 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm relative z-10">
                    <Icon size={26} strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="text-sm font-bold text-gray-900 mb-1 relative z-10">{service.name}</h3>
                  <p className="text-xs text-gray-400 relative z-10">Starts ₹{service.basePrice}</p>
                  
                  <Link to={`/book/${service.id}`} className="absolute inset-0 z-20"></Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact / Footer Promo */}
      <section className="max-w-5xl mx-auto px-4 mt-20 mb-10 animate-slide-up" style={{animationDelay: '0.5s'}}>
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
           <div className="relative z-10 max-w-lg">
              <h2 className="text-3xl font-bold mb-4">Need something custom?</h2>
              <p className="text-indigo-100 mb-8">Can't find what you're looking for? Contact our support team and we'll help you find the right professional.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                 <a href="tel:+918920636919" className="flex items-center justify-center bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-lg">
                    <Phone size={18} className="mr-2" /> Call Now
                 </a>
                 <a href="mailto:avinashkr502080@gmail.com" className="flex items-center justify-center bg-indigo-800/50 border border-indigo-400/30 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-800 transition-colors backdrop-blur-sm">
                    <Mail size={18} className="mr-2" /> Email Us
                 </a>
              </div>
           </div>
           
           {/* Decoration */}
           <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
              <Hammer size={300} className="transform translate-x-10 translate-y-10 rotate-12" />
           </div>
        </div>
      </section>
    </div>
  );
};
