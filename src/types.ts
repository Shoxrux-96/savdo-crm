export interface Store {
  id: string;
  name: string;
  ownerId: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  address?: string;
  region?: string;
  district?: string;
  createdAt: any;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  unit: string;
  expiryDate?: string;
  lowStockThreshold?: number;
  storeId: string;
  updatedAt: any;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  storeId: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'credit';
  status: 'completed' | 'pending';
  customerId?: string;
  createdAt: any;
}

export interface UserProfile {
  id: string;
  phone: string;
  password?: string;
  name: string;
  role: 'super_admin' | 'store_owner' | 'distributor';
  entityId?: string;
  status: 'active' | 'suspended' | 'deleted';
  region?: string;
  district?: string;
  tin?: string;
  position?: string;
  level?: 'admin' | 'employee';
}
