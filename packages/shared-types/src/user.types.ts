// User Role Enum
export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  DRIVER = 'driver',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// User Status Enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

// Base User Interface
export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

// User Profile Interface
export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: Date;
  address?: UserAddress;
  preferences?: UserPreferences;
}

// User Address Interface
export interface UserAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// User Preferences Interface
export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  language: string;
  timezone: string;
  currency: string;
}

// Vendor Specific Interface
export interface Vendor extends User {
  vendorProfile: {
    storeName: string;
    storeDescription: string;
    logo?: string;
    rating: number;
    totalReviews: number;
    commissionRate: number;
    bankAccount?: BankAccount;
    taxId?: string;
  };
}

// Driver Specific Interface
export interface Driver extends User {
  driverProfile: {
    licenseNumber: string;
    licenseExpiry: Date;
    vehicleType: VehicleType;
    vehicleNumber: string;
    vehicleModel?: string;
    rating: number;
    totalTrips: number;
    onlineStatus: OnlineStatus;
    currentLocation?: {
      latitude: number;
      longitude: number;
    };
  };
}

// Vehicle Type Enum
export enum VehicleType {
  BIKE = 'bike',
  CAR = 'car',
  VAN = 'van',
  TRUCK = 'truck'
}

// Online Status Enum
export enum OnlineStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy'
}

// Bank Account Interface
export interface BankAccount {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
}
