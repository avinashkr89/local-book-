import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getServices, searchProviders } from '../services/db';
import { Service, Provider } from '../types';
import { Wrench, Zap, SprayCan, BookOpen, Briefcase, Search, MapPin, Star, ArrowRight, ShieldCheck, Clock, UserCheck, X, Mail, Phone, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const IconMap: Record<string, React.FC<any>> = {
  Wrench, Zap, SprayCan, BookOpen, Briefcase
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
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-16 pb-10">
      {/* Hero Search Section */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl bg-indigo-900 text-white">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581578731117-10d52143b0e8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        
        <div className="relative z-10 py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6 animate-slide-up">
            Expert Services,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">Right at your Doorstep.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-indigo-100 animate-fade-in">
            The easiest way to book electricians, plumbers, and tutors in Aurangabad.
          </p>

          <div className="mt-10 max-w-3xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-2 sm:p-4 shadow-2xl border border-white/20 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 bg-white rounded-xl px-4 py-2 flex flex-col justify-center group focus-within:ring-2 ring-indigo-400">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide group-hover:text-indigo-600 transition-colors">Service</label>
                <select 
                  className="w-full bg-transparent border-none p-0 text-gray-900 font-medium focus:ring-0 cursor-pointer"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="">What do you need?</option>
                  {services.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1 bg-white rounded-xl px-4 py-2 flex flex-col justify-center group focus-within:ring-2 ring-indigo-400 relative">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide group-hover:text-indigo-600 transition-colors">Location</label>
                <div className="flex items-center">
                   <MapPin size={16} className="text-gray-400 mr-2" />
                   <input 
                    type="text" 
                    placeholder="e.g. Cidco, Hudco" 
                    className="w-full bg-transparent border-none p-0 text-gray-900 font-medium focus:ring-0 placeholder-gray-400"
                    value={searchArea}
                    onChange={(e) => setSearchArea(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSearching}
                className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center disabled:opacity-70 disabled:scale-100"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </form>
          </div>
          
          <div className="mt-8 flex justify-center gap-6 text-indigo-200 text-sm font-medium animate-fade-in" style={{animationDelay: '0.4s'}}>
             <span className="flex items-center"><ShieldCheck size={16} className="mr-1" /> Verified Pros</span>
             <span className="flex items-center"><Clock size={16} className="mr-1" /> On-Time</span>
             <span className="flex items-center"><UserCheck size={16} className="mr-1" /> Safe</span>
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      {searchResults && (
        <div className="animate-fade-in-up scroll-mt-24" id="results">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Found {searchResults.length} Pros for <span className="text-indigo-600">"{selectedService}"</span>
            </h2>
            <button onClick={clearSearch} className="text-sm font-medium text-gray-500 hover:text-red-500 flex items-center">
              <X size={16} className="mr-1" /> Clear Search
            </button>
          </div>

          {searchResults.length === 0 ? (
             <div className="bg-white p-12 rounded-2xl text-center border border-gray-200 shadow-sm">
               <div className="inline-flex bg-gray-100 p-4 rounded-full mb-4">
                  <Search size={32} className="text-gray-400" />
               </div>
               <h3 className="text-lg font-bold text-gray-900">No exact matches</h3>
               <p className="text-gray-500 mt-2">We couldn't find a provider in that specific area.</p>
               <button onClick={() => { setSearchResults(null); setSearchArea(''); }} className="mt-4 text-indigo-600 font-medium hover:underline">Browse all services instead</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((provider) => {
                const serviceDetails = services.find(s => s.name === provider.skill);
                return (
                  <div key={provider.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                    <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                       <div className="absolute -bottom-8 left-6">
                          <div className="h-16 w-16 rounded-full bg-white p-1 shadow-md">
                             <div className="h-full w-full rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                                {provider.user?.name.charAt(0)}
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="pt-10 px-6 pb-6">
                       <div className="flex justify-between items-start">
                         <div>
                           <h3 className="text-lg font-bold text-gray-900">{provider.user?.name}</h3>
                           <p className="text-indigo-600 font-medium text-sm">{provider.skill}</p>
                         </div>
                         <div className="bg-yellow-50 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full flex items-center border border-yellow-100">
                           <Star size={12} className="mr-1 fill-current" /> {provider.rating}
                         </div>
                      </div>
                      
                      <div className="mt-4 flex items-center text-gray-500 text-sm">
                        <MapPin size={16} className="mr-1 text-gray-400" />
                        {provider.area}
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                           <p className="text-xs text-gray-400 uppercase font-bold">Starting at</p>
                           <p className="text-xl font-bold text-gray-900">₹{serviceDetails?.basePrice}</p>
                        </div>
                        <Link 
                          to={`/book/${serviceDetails?.id}?providerId=${provider.id}&area=${searchArea}`}
                          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Services Grid */}
      {!searchResults && (
        <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
          <div className="text-center mb-10">
             <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
             <p className="text-gray-500 mt-2">Select a category to get started</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = IconMap[service.icon] || Briefcase;
              return (
                <div key={service.id} className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1 cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-indigo-50 w-24 h-24 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
                  
                  <div className="relative z-10">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                      <Icon size={28} strokeWidth={1.5} />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10 leading-relaxed">{service.description}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <span className="font-bold text-gray-900">₹{service.basePrice}</span>
                      <Link to={`/book/${service.id}`} className="text-indigo-600 font-medium text-sm flex items-center hover:underline">
                        Book <ArrowRight size={16} className="ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Professional Contact Section */}
      <section className="max-w-5xl mx-auto mt-24 mb-12 animate-slide-up" style={{animationDelay: '0.5s'}}>
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Left: Contact Info - No Image, Professional Gradient */}
          <div className="md:w-2/5 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-10 text-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 -mt-10 -ml-10 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
            <div className="absolute bottom-0 right-0 -mb-10 -mr-10 w-40 h-40 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2 tracking-tight">Get in Touch</h2>
                <p className="text-indigo-200 text-sm mb-8 leading-relaxed">
                  Need help with a booking or have a custom requirement? We are just a message away.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start group">
                    <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mr-4 group-hover:bg-white/20 transition-all duration-300">
                      <Phone size={20} className="text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-xs text-indigo-300 uppercase font-bold tracking-wider">Call Us</p>
                      <p className="font-medium text-lg">+91 89206 36919</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start group">
                     <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mr-4 group-hover:bg-white/20 transition-all duration-300">
                      <Mail size={20} className="text-purple-300" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-indigo-300 uppercase font-bold tracking-wider">Email Us</p>
                      <p className="font-medium text-lg break-all">avinashkr502080@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start group">
                     <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mr-4 group-hover:bg-white/20 transition-all duration-300">
                      <MapPin size={20} className="text-pink-300" />
                    </div>
                    <div>
                      <p className="text-xs text-indigo-300 uppercase font-bold tracking-wider">Visit Us</p>
                      <p className="font-medium text-lg">Aurangabad, Bihar</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 md:mt-0 pt-8 border-t border-white/10">
                 <p className="text-xs text-indigo-300 opacity-60 flex items-center">
                   <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                   Available 9 AM - 9 PM
                 </p>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="md:w-3/5 p-10 bg-white">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Send us a Message</h3>
              <p className="text-gray-500 text-sm mt-1">We usually reply within 24 hours.</p>
            </div>
            
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 group-focus-within:text-indigo-600 transition-colors">Your Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-0 outline-none transition-all duration-300 hover:bg-gray-100"
                  placeholder="e.g. Rahul Sharma"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                />
              </div>
              
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 group-focus-within:text-indigo-600 transition-colors">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-0 outline-none transition-all duration-300 hover:bg-gray-100"
                  placeholder="e.g. rahul@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                />
              </div>
              
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 group-focus-within:text-indigo-600 transition-colors">Message</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-0 outline-none transition-all duration-300 hover:bg-gray-100 resize-none"
                  placeholder="Tell us what you need..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={isSending}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center disabled:opacity-70 disabled:transform-none disabled:shadow-none"
              >
                {isSending ? (
                   <span className="flex items-center"><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Sending...</span>
                ) : (
                   <span className="flex items-center">Send Message <Send size={18} className="ml-2" /></span>
                )} 
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};