export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Simulating hash
  phone?: string;
  role: Role;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  icon: string; // Lucide icon name
  createdAt: string;
}

export interface Provider {
  id: string;
  userId: string;
  user?: User; // Relation
  skill: string; // Maps to Service Name usually
  area: string;
  rating: number;
  isActive: boolean;
}

export interface Booking {
  id: string;
  customerId: string;
  customer?: User; // Relation
  serviceId: string;
  service?: Service; // Relation
  providerId: string | null;
  provider?: Provider; // Relation
  description: string;
  address: string;
  area: string;
  date: string;
  time: string;
  amount: number;
  status: BookingStatus;
  createdAt: string;
}