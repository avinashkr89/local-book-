
import { supabase } from './supabase';
import { User, Service, Provider, Booking, Role, BookingStatus } from '../types';

// --- DATA MAPPERS (Snake_case DB -> CamelCase App) ---

const mapUser = (row: any): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  phone: row.phone,
  role: row.role as Role,
  createdAt: row.created_at,
});

const mapService = (row: any): Service => ({
  id: row.id,
  name: row.name,
  description: row.description,
  basePrice: row.base_price,
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
  user: row.users ? mapUser(row.users) : undefined, // Handle joined user data
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
  createdAt: row.created_at,
  customer: row.customer ? mapUser(row.customer) : undefined,
  service: row.service ? mapService(row.service) : undefined,
  provider: row.provider ? mapProvider(row.provider) : undefined,
});

// --- DB INITIALIZATION (SEEDING) ---
export const initializeDB = async () => {
  try {
    // 1. Ensure Specific Admin Exists and has Correct Role/Password
    const adminEmail = 'avinashkr502080@gmail.com';
    const targetPassword = 'Avinash@10';
    
    const { data: existingAdmin } = await supabase.from('users').select('*').eq('email', adminEmail).single();
    
    if (existingAdmin) {
      // If user exists but is not ADMIN or password doesn't match, update them
      if (existingAdmin.role !== 'ADMIN' || existingAdmin.password_hash !== targetPassword) {
        console.log('Fixing Admin Permissions...');
        await supabase.from('users').update({
          role: 'ADMIN',
          password_hash: targetPassword,
          name: 'Avinash Admin' 
        }).eq('email', adminEmail);
      }
    } else {
      console.log('Creating Admin User...');
      await supabase.from('users').insert({
        name: 'Avinash Admin',
        email: adminEmail,
        password_hash: targetPassword,
        role: 'ADMIN',
        phone: '8920636919'
      });
    }

    // 2. Check general seeding (Services)
    const { count } = await supabase.from('services').select('*', { count: 'exact', head: true });
    
    if (count === 0) {
      console.log('Seeding Services & Demo Data...');

      // Seed Services
      const seedServices = [
        { name: 'Plumber', description: 'Fix leaks, pipes, and tap installations.', base_price: 400, icon: 'Wrench' },
        { name: 'Electrician', description: 'Fan repair, switchboard installation, wiring.', base_price: 350, icon: 'Zap' },
        { name: 'Cleaner', description: 'Deep home cleaning, bathroom cleaning.', base_price: 800, icon: 'SprayCan' },
        { name: 'Tutor', description: 'Home tuition for K-12 math and science.', base_price: 500, icon: 'BookOpen' },
      ];
      await supabase.from('services').insert(seedServices);

      // Seed Demo Customer
      await supabase.from('users').insert({
        name: 'Rahul Patil',
        email: 'customer@demo.com',
        password_hash: '123456',
        role: 'CUSTOMER',
        phone: '8888888888'
      });

      console.log('Seeding Complete');
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
};

// --- DATA ACCESS OBJECTS ---

// 1. Users
export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data.map(mapUser);
};

export const createUser = async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  const { data, error } = await supabase.from('users').insert({
    name: user.name,
    email: user.email,
    password_hash: user.passwordHash,
    phone: user.phone,
    role: user.role
  }).select().single();
  
  if (error) throw error;
  return mapUser(data);
};

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
  if (error && error.code !== 'PGRST116') console.error(error); // PGRST116 is "Row not found"
  return data ? mapUser(data) : undefined;
};

// 2. Services
export const getServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase.from('services').select('*').order('name');
  if (error) throw error;
  return data.map(mapService);
};

export const createService = async (service: Omit<Service, 'id' | 'createdAt'>): Promise<Service> => {
  const { data, error } = await supabase.from('services').insert({
    name: service.name,
    description: service.description,
    base_price: service.basePrice,
    icon: service.icon
  }).select().single();
  
  if (error) throw error;
  return mapService(data);
};

export const updateService = async (id: string, updates: Partial<Service>) => {
  // Map camelCase to snake_case
  const dbUpdates: any = {};
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.description) dbUpdates.description = updates.description;
  if (updates.basePrice !== undefined) dbUpdates.base_price = updates.basePrice;
  if (updates.icon) dbUpdates.icon = updates.icon;

  const { error } = await supabase.from('services').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteService = async (id: string) => {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
};

// 3. Providers
export const getProviders = async (): Promise<Provider[]> => {
  // Join with users table to get name/email
  const { data, error } = await supabase.from('providers').select('*, users(*)');
  if (error) throw error;
  return data.map(mapProvider);
};

export const createProvider = async (userId: string, skill: string, area: string): Promise<Provider> => {
  const { data, error } = await supabase.from('providers').insert({
    user_id: userId,
    skill,
    area,
    rating: 0,
    is_active: true
  }).select().single();

  if (error) throw error;
  return mapProvider(data);
};

export const updateProvider = async (id: string, updates: Partial<Provider>) => {
  const dbUpdates: any = {};
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.skill) dbUpdates.skill = updates.skill;
  if (updates.area) dbUpdates.area = updates.area;
  if (updates.rating !== undefined) dbUpdates.rating = updates.rating;

  const { error } = await supabase.from('providers').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const searchProviders = async (serviceName: string, areaQuery: string): Promise<Provider[]> => {
  // Perform search on providers, joining user data
  const { data, error } = await supabase
    .from('providers')
    .select('*, users(*)')
    .eq('skill', serviceName)
    .ilike('area', `%${areaQuery}%`) // Partial match for area
    .eq('is_active', true);

  if (error) throw error;
  return data.map(mapProvider);
};

// 4. Bookings
export const getBookings = async (): Promise<Booking[]> => {
  // Deep select to get related entities
  const { data, error } = await supabase.from('bookings').select(`
    *,
    customer:users!customer_id(*),
    service:services(*),
    provider:providers(*, users(*))
  `);
  
  if (error) throw error;
  return data.map(mapBooking);
};

export const createBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> => {
  const { data, error } = await supabase.from('bookings').insert({
    customer_id: booking.customerId,
    service_id: booking.serviceId,
    provider_id: booking.providerId || null,
    description: booking.description,
    address: booking.address,
    area: booking.area,
    date: booking.date,
    time: booking.time,
    amount: booking.amount,
    status: booking.providerId ? 'ASSIGNED' : 'PENDING'
  }).select().single();

  if (error) throw error;
  return mapBooking(data);
};

export const updateBookingStatus = async (id: string, status: BookingStatus, providerId?: string) => {
  const updates: any = { status };
  if (providerId) updates.provider_id = providerId;
  
  const { error } = await supabase.from('bookings').update(updates).eq('id', id);
  if (error) throw error;
};

export const addBookingRating = async (bookingId: string, rating: number, review: string, providerId: string | undefined) => {
  // 1. Update the booking with rating/review
  const { error } = await supabase.from('bookings').update({ rating, review }).eq('id', bookingId);
  if (error) throw error;

  // 2. If a provider was attached, recalculate their average rating
  if (providerId) {
    const { data: providerBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('rating')
      .eq('provider_id', providerId)
      .not('rating', 'is', null);
    
    if (!fetchError && providerBookings && providerBookings.length > 0) {
      const total = providerBookings.reduce((sum: number, b: any) => sum + Number(b.rating), 0);
      const avgRating = Number((total / providerBookings.length).toFixed(1));
      
      // 3. Update Provider Table
      await supabase.from('providers').update({ rating: avgRating }).eq('id', providerId);
    }
  }
};
