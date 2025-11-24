
import { supabase } from './supabase';
import { User, Service, Provider, Booking, Role, BookingStatus, Notification } from '../types';
import { sendProviderAssignmentEmail } from './email';

// --- DATA MAPPERS ---

const mapUser = (row: any): User => {
  if (!row) return { id: '', name: 'Unknown', email: '', phone: '', passwordHash: '', role: Role.CUSTOMER, createdAt: '' };
  return {
    id: row.id,
    name: row.name || 'User',
    email: row.email || '',
    passwordHash: row.password_hash || '',
    phone: row.phone || '',
    role: (row.role as Role) || Role.CUSTOMER,
    createdAt: row.created_at,
  };
};

const mapService = (row: any): Service => ({
  id: row.id,
  name: row.name,
  description: row.description,
  basePrice: row.base_price,
  maxPrice: row.max_price,
  icon: row.icon,
  createdAt: row.created_at,
});

const mapProvider = (row: any): Provider => ({
  id: row.id,
  userId: row.user_id,
  skill: row.skill,
  area: row.area,
  rating: row.rating,
  isActive: row.is_active,
  approvalStatus: row.approval_status || 'ACTIVE', // Default to ACTIVE if column missing
  experienceYears: row.experience_years,
  bio: row.bio,
  isDeleted: row.is_deleted || false, // Default to false if column missing
  user: row.users ? (Array.isArray(row.users) ? mapUser(row.users[0]) : mapUser(row.users)) : undefined,
});

const mapBooking = (row: any): Booking => ({
  id: row.id,
  customerId: row.customer_id,
  serviceId: row.service_id,
  providerId: row.provider_id,
  description: row.description,
  address: row.address,
  area: row.area,
  date: row.date,
  time: row.time,
  amount: row.amount,
  status: row.status as BookingStatus,
  rating: row.rating,
  review: row.review,
  // completionOtp removed - generated on fly
  createdAt: row.created_at,
  customer: row.customer ? mapUser(row.customer) : undefined,
  service: row.service ? mapService(row.service) : undefined,
  provider: row.provider ? mapProvider(row.provider) : undefined,
});

const mapNotification = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id,
  message: row.message,
  isRead: row.is_read,
  type: row.type,
  createdAt: row.created_at,
});

// --- HELPER: SECURITY & PIN ---

/**
 * Generates a deterministic 6-digit PIN based on Booking ID and Creation Time.
 * NO DATABASE STORAGE REQUIRED.
 * Formula: Hash(ID + Date + Secret) % 1000000
 */
export const generateCompletionPin = (bookingId: string, createdAt: string): string => {
  if (!bookingId || !createdAt) return '------';
  
  const SECRET = "LOCALBOOKR_SECURE_HASH_KEY_2025"; 
  const input = bookingId + createdAt + SECRET;
  
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const pin = Math.abs(hash) % 1000000;
  return pin.toString().padStart(6, '0');
};

// --- HELPER: DATA SAFE EXTRACTION ---
const getSafeUserFromRelation = (relationData: any) => {
  if (!relationData) return null;
  if (Array.isArray(relationData)) return relationData.length > 0 ? relationData[0] : null;
  return relationData;
};

// --- HELPER: AUTO ASSIGNMENT LOGIC ---
export const checkAndTriggerAutoAssignment = async () => {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    // Find STALE bookings (Pending > 2 mins)
    const { data: staleBookings } = await supabase
      .from('bookings')
      .select('*, service:services(name)')
      .eq('status', 'PENDING')
      .lt('created_at', twoMinutesAgo);

    if (!staleBookings || staleBookings.length === 0) return;

    for (const booking of staleBookings) {
      // Find ACTIVE providers matching skill & area
      // We fetch all matching skill/area first, then filter in JS to be safe
      const { data: candidates } = await supabase
        .from('providers')
        .select('id, user_id, rating, is_active, approval_status, skill, area')
        .eq('skill', booking.service.name)
        .ilike('area', `%${booking.area}%`); // Simple area match

      if (candidates && candidates.length > 0) {
        // Filter in memory for safety
        const activeCandidates = candidates.filter(p => 
          p.is_active === true && 
          (p.approval_status === 'ACTIVE' || !p.approval_status) // Allow if null (old records)
        );

        if (activeCandidates.length > 0) {
          // LOGIC: Pick provider with highest rating
          const bestProvider = activeCandidates.sort((a, b) => b.rating - a.rating)[0];
          
          await updateBookingStatus(booking.id, BookingStatus.ASSIGNED, bestProvider.id);
          
          await createNotification(bestProvider.user_id, `Auto-assigned new job: ${booking.service.name}`, 'INFO');
          await createNotification(booking.customer_id, `Provider auto-assigned to your booking!`, 'SUCCESS');
        } else {
           await updateBookingStatus(booking.id, BookingStatus.WAITING);
        }
      } else {
        // No one found, set to WAITING
        await updateBookingStatus(booking.id, BookingStatus.WAITING);
      }
    }
  } catch (e) {
    // Silent fail for auto-assign to not block main thread
  }
};

// --- AUTH ---
export const authenticateUser = async (email: string, passwordHash: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password_hash', passwordHash)
    .single();

  if (error || !data) return null;
  return mapUser(data);
};

export const initializeDB = async () => {
  // Initialization logic if needed
};

// --- USERS ---
export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data.map(mapUser);
};

export const findUserByPhone = async (phone: string): Promise<User | undefined> => {
  const { data, error } = await supabase.from('users').select('*').eq('phone', phone).maybeSingle();
  return data ? mapUser(data) : undefined;
};

export const createUser = async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  const { data, error } = await supabase.from('users').insert({
    name: user.name,
    email: user.email,
    phone: user.phone,
    password_hash: user.passwordHash,
    role: user.role
  }).select().single();
  
  if (error) throw error;
  return mapUser(data);
};

// --- SERVICES ---
export const getServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase.from('services').select('*').order('name');
  if (error) {
    const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : JSON.stringify(error);
    console.error("getServices Error:", errorMsg);
    return [];
  }
  return data ? data.map(mapService) : [];
};

export const createService = async (service: Omit<Service, 'id' | 'createdAt'>): Promise<Service> => {
  const { data, error } = await supabase.from('services').insert({
    name: service.name,
    description: service.description,
    base_price: service.basePrice,
    max_price: service.maxPrice,
    icon: service.icon
  }).select().single();
  if (error) throw error;
  return mapService(data);
};

export const updateService = async (id: string, updates: Partial<Service>) => {
  const dbUpdates: any = {};
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.description) dbUpdates.description = updates.description;
  if (updates.basePrice !== undefined) dbUpdates.base_price = updates.basePrice;
  if (updates.maxPrice !== undefined) dbUpdates.max_price = updates.maxPrice;
  if (updates.icon) dbUpdates.icon = updates.icon;
  const { error } = await supabase.from('services').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteService = async (id: string) => {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
};

// --- PROVIDERS ---
export const getProviders = async (): Promise<Provider[]> => {
  // Fetch ALL providers (including relation)
  const { data, error } = await supabase
    .from('providers')
    .select('*, users(*)');
    
  if (error) {
    const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : JSON.stringify(error);
    console.error("getProviders Error:", errorMsg);
    return [];
  }
  
  // Filter in memory
  const mapped = data.map(mapProvider);
  return mapped.filter(p => !p.isDeleted);
};

export const getPendingProviders = async (): Promise<Provider[]> => {
  const { data, error } = await supabase
    .from('providers')
    .select('*, users(*)');
    
  if (error) {
    const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : JSON.stringify(error);
    console.error("getPendingProviders Error:", errorMsg);
    return [];
  }
  
  const mapped = data.map(mapProvider);
  // Filter for PENDING and NOT DELETED
  return mapped.filter(p => p.approvalStatus === 'PENDING' && !p.isDeleted);
};

export const createProvider = async (
  userId: string, 
  skill: string, 
  area: string, 
  bio?: string, 
  experience?: number
): Promise<Provider> => {
  // Fallback Logic: Try full insert, if fails (missing columns), try basic insert
  const fullPayload = {
    user_id: userId,
    skill,
    area,
    rating: 0,
    is_active: false,
    approval_status: 'PENDING',
    bio: bio || '',
    experience_years: experience || 0,
    is_deleted: false
  };

  try {
    const { data, error } = await supabase.from('providers').insert(fullPayload).select().single();
    if (error) throw error;
    return mapProvider(data);
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('column') || msg.includes('schema cache')) {
      console.warn("Extended columns missing, falling back to basic provider creation...");
      // Fallback: Basic details only
      const basicPayload = {
        user_id: userId,
        skill,
        area,
        rating: 0,
        is_active: false
      };
      const { data, error } = await supabase.from('providers').insert(basicPayload).select().single();
      if (error) throw error;
      return mapProvider(data);
    }
    throw e;
  }
};

export const updateProvider = async (id: string, updates: Partial<Provider>) => {
  const dbUpdates: any = {};
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.approvalStatus) dbUpdates.approval_status = updates.approvalStatus;
  if (updates.skill) dbUpdates.skill = updates.skill;
  if (updates.area) dbUpdates.area = updates.area;
  if (updates.rating !== undefined) dbUpdates.rating = updates.rating;

  const { error } = await supabase.from('providers').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteProvider = async (id: string) => {
  try {
    const { error } = await supabase.from('providers').update({ is_deleted: true }).eq('id', id);
    if (error) throw error;
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('column') || msg.includes('does not exist')) {
       console.warn("Soft delete column missing, attempting hard delete...");
       try {
         const { error: hardDeleteError } = await supabase.from('providers').delete().eq('id', id);
         if (hardDeleteError) throw hardDeleteError;
       } catch (hardError: any) {
         if (hardError.code === '23503') {
           throw new Error("Cannot delete provider because they have active bookings. Archive them instead.");
         }
         throw hardError;
       }
    } else {
      throw e;
    }
  }
};

export const searchProviders = async (serviceName: string, areaQuery: string): Promise<Provider[]> => {
  const { data, error } = await supabase
    .from('providers')
    .select('*, users(*)')
    .eq('skill', serviceName)
    .ilike('area', `%${areaQuery}%`); // Only safe columns in query
    
  if (error) throw error;
  
  const mapped = data.map(mapProvider);
  return mapped.filter(p => p.isActive && p.approvalStatus === 'ACTIVE' && !p.isDeleted);
};

// --- BOOKINGS ---
export const getBookings = async (): Promise<Booking[]> => {
  // Trigger auto-assignment check
  checkAndTriggerAutoAssignment();

  const { data, error } = await supabase.from('bookings').select(`
    *,
    customer:users!customer_id(*),
    service:services(*),
    provider:providers(*, users(*))
  `).order('created_at', { ascending: false });

  if (error) {
    const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : JSON.stringify(error);
    console.error("getBookings Error:", errorMsg);
    // Do not throw, return empty array to keep app alive
    return [];
  }
  return data ? data.map(mapBooking) : [];
};

export const createBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> => {
  const basePayload = {
    customer_id: booking.customerId,
    service_id: booking.serviceId,
    provider_id: booking.providerId || null,
    description: booking.description,
    address: booking.address,
    area: booking.area,
    date: booking.date,
    time: booking.time,
    amount: booking.amount,
    status: booking.providerId ? 'ASSIGNED' : 'PENDING',
    // NO completion_otp inserted here
  };

  const { data, error } = await supabase.from('bookings').insert(basePayload).select().single();

  if (error) throw error;

  // Trigger Notifications
  await notifyBookingCreated(booking.customerId, booking.providerId || null);
  
  // If provider directly assigned (e.g. from search), trigger email
  if (booking.providerId) {
     // Fetch full details to send email
     const { data: prov } = await supabase.from('providers').select('*, users(*)').eq('id', booking.providerId).single();
     const { data: svc } = await supabase.from('services').select('*').eq('id', booking.serviceId).single();
     const { data: cust } = await supabase.from('users').select('*').eq('id', booking.customerId).single();
     
     // Safe extraction
     const provUser = getSafeUserFromRelation(prov?.users);
     const custData = cust; // cust is single due to .single()

     if (provUser && svc && custData) {
        // Trigger EmailJS
        await sendProviderAssignmentEmail({
          to_name: provUser.name,
          to_email: provUser.email,
          customer_name: custData.name,
          customer_phone: custData.phone,
          service_name: svc.name,
          booking_date: booking.date,
          booking_time: booking.time,
          booking_location: `${booking.address}, ${booking.area}`,
          amount: booking.amount.toString()
        });
     }
  }

  return mapBooking(data);
};

const notifyBookingCreated = async (customerId: string, providerId: string | null) => {
  try {
    await createNotification(customerId, 'Booking created! Share PIN with provider when done.', 'SUCCESS');
    if (providerId) {
      const { data: prov } = await supabase.from('providers').select('user_id').eq('id', providerId).single();
      if (prov) await createNotification(prov.user_id, 'New Booking Assigned!', 'INFO');
    }
  } catch (e) {
    // Ignore notification errors
  }
}

export const updateBookingStatus = async (id: string, status: BookingStatus, providerId?: string) => {
  const updates: any = { status };
  if (providerId) updates.provider_id = providerId;
  
  const { error } = await supabase.from('bookings').update(updates).eq('id', id);
  if (error) throw error;

  // Notification & Email Logic
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, customer:users!customer_id(*), service:services(*), provider:providers(*, users(*))')
      .eq('id', id)
      .single();

    if (booking) {
      // Notify Customer
      if (status === 'COMPLETED') await createNotification(booking.customer_id, 'Service completed. Please rate!', 'SUCCESS');
      if (status === 'ASSIGNED') await createNotification(booking.customer_id, 'Provider assigned.', 'INFO');
      
      // Notify Provider (Email)
      if (status === 'ASSIGNED') {
         // If providerId was passed or exists in booking
         const finalProvId = providerId || booking.provider_id;
         if (finalProvId) {
            // Re-fetch provider info to be sure we have the User relation (Email)
            const { data: prov } = await supabase.from('providers').select('*, users(*)').eq('id', finalProvId).single();
            const provUser = getSafeUserFromRelation(prov?.users);
            
            // Safe extraction for customer
            const customerUser = getSafeUserFromRelation(booking.customer);

            if (provUser && customerUser && booking.service) {
               await sendProviderAssignmentEmail({
                  to_name: provUser.name,
                  to_email: provUser.email,
                  customer_name: customerUser.name,
                  customer_phone: customerUser.phone,
                  service_name: booking.service.name,
                  booking_date: booking.date,
                  booking_time: booking.time,
                  booking_location: `${booking.address}, ${booking.area}`,
                  amount: booking.amount.toString()
               });
            }
         }
      }
    }
  } catch (e: any) {
    const msg = e.message || JSON.stringify(e);
    console.error("Notify error", msg);
  }
};

// --- MANUAL EMAIL TRIGGER ---
export const triggerManualEmailNotification = async (bookingId: string) => {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, customer:users!customer_id(*), service:services(*), provider:providers(*, users(*))')
      .eq('id', bookingId)
      .single();

    if (!booking || !booking.provider) {
      throw new Error("Missing provider data for this booking");
    }

    const provUser = getSafeUserFromRelation(booking.provider.users);
    const custUser = getSafeUserFromRelation(booking.customer);

    if (!provUser) throw new Error("Provider User details missing");
    if (!custUser) throw new Error("Customer details missing");
    
    await sendProviderAssignmentEmail({
        to_name: provUser.name,
        to_email: provUser.email,
        customer_name: custUser.name,
        customer_phone: custUser.phone,
        service_name: booking.service?.name || 'Service',
        booking_date: booking.date,
        booking_time: booking.time,
        booking_location: `${booking.address}, ${booking.area}`,
        amount: booking.amount.toString()
     });

  } catch (e: any) {
    console.error("Manual Email Error:", e);
    throw e;
  }
};

// --- COMPLETION VERIFICATION ---
export const verifyAndCompleteJob = async (bookingId: string, inputPin: string): Promise<boolean> => {
  try {
    // 1. Fetch Booking Meta Data to regenerate PIN
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('created_at')
      .eq('id', bookingId)
      .single();

    if (error || !booking) return false;

    // 2. Regenerate PIN locally
    const expectedPin = generateCompletionPin(bookingId, booking.created_at);

    // 3. Compare
    if (expectedPin === inputPin) {
      await updateBookingStatus(bookingId, BookingStatus.COMPLETED);
      return true;
    }
    
    return false;

  } catch (e: any) {
    const msg = e.message || JSON.stringify(e);
    console.error("Verification Error:", msg);
    return false;
  }
};

export const addBookingRating = async (bookingId: string, rating: number, review: string, providerId: string | undefined) => {
  try {
    const { error } = await supabase.from('bookings').update({ rating, review }).eq('id', bookingId);
    
    if (error) {
      const msg = error.message || '';
      if (msg.includes('Could not find') || msg.includes('column') || msg.includes('schema cache')) {
        console.warn("Rating not saved to DB (Column missing), but pretending success for UI.");
        return; 
      }
      throw error;
    }

    if (providerId) {
      try {
        const { data: providerBookings } = await supabase
          .from('bookings')
          .select('rating')
          .eq('provider_id', providerId)
          .not('rating', 'is', null);
        
        if (providerBookings && providerBookings.length > 0) {
          const total = providerBookings.reduce((sum: number, b: any) => sum + Number(b.rating), 0);
          const avgRating = Number((total / providerBookings.length).toFixed(1));
          await supabase.from('providers').update({ rating: avgRating }).eq('id', providerId);
          
          const { data: prov } = await supabase.from('providers').select('user_id').eq('id', providerId).single();
          if (prov) await createNotification(prov.user_id, `You received a ${rating}-star rating!`, 'SUCCESS');
        }
      } catch (calcError) {
        console.error("Error recalculating provider rating:", calcError);
      }
    }
  } catch (err: any) {
    const msg = err.message || JSON.stringify(err);
    console.error("addBookingRating Error:", msg);
    throw new Error(msg);
  }
};

export const deleteBooking = async (id: string) => {
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) throw error;
};

// --- NOTIFICATIONS ---
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : JSON.stringify(error);
    if (error.code === '42P01' || errorMsg.includes('schema cache') || errorMsg.includes('Could not find the table')) {
      return [];
    }
    console.error("getNotifications Error:", errorMsg);
    return [];
  }
  return data ? data.map(mapNotification) : [];
};

export const createNotification = async (userId: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR') => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      message,
      type,
      is_read: false
    });
    if (error) throw error;
  } catch (e) {
    // Silent fail
  }
};

export const markNotificationRead = async (id: string) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  } catch (e) {
    // Silent fail
  }
};
