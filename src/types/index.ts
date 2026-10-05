export interface User {
  id: number;
  uid: string;
  username?: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  phone?: string | null;
  status: 'active' | 'inactive';
  permissions?: Record<string, boolean>;
}

export interface Customer {
  id: number;
  customerCode: string;
  name: string;
  mobile: string;
  address?: string | null;
  email?: string | null;
  dob?: string | null;
  gender?: string | null;
  notes?: string | null;
  totalSpending: string;
  paidAmount: string;
  dueAmount: string;
  visitCount: number;
  lastVisitAt: string;
  createdAt: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description?: string | null;
  sortOrder: number;
}

export interface Service {
  id: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  name: string;
  code: string;
  defaultPrice: string;
  unit: string;
  minQty: number;
  isDiscountAllowed: boolean;
  status: 'active' | 'inactive';
  description?: string | null;
}

export interface InvoiceItem {
  id?: number;
  serviceId?: number;
  serviceName: string;
  categoryName: string;
  quantity: string | number;
  unit: string;
  rate: string | number;
  serviceCharge?: string | number;
  amount: string | number;
  discount: string | number;
  netAmount: string | number;
  notes?: string | null;
}

export interface Payment {
  id: number;
  invoiceId: number;
  customerId?: number | null;
  amount: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  receivedByStaffName: string;
  notes?: string | null;
  paymentDate: string;
  createdAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId?: number | null;
  customerName: string;
  customerMobile: string;
  staffId?: number | null;
  staffName: string;
  subtotal: string;
  serviceCharge?: string;
  discount: string;
  tax: string;
  grandTotal: string;
  paidAmount: string;
  dueAmount: string;
  paymentMethod: string;
  status: 'Paid' | 'Partial' | 'Due' | 'Cancelled' | 'Refunded';
  cancelReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  notes?: string | null;
  createdAt: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface Application {
  id: number;
  applicationNumber: string;
  customerId?: number | null;
  customerName: string;
  customerMobile: string;
  serviceId?: number | null;
  serviceName: string;
  applicationDate: string;
  followUpDate?: string | null;
  staffName: string;
  status: 'Pending' | 'In Progress' | 'Submitted' | 'Processing' | 'Completed' | 'Rejected' | 'Cancelled';
  totalFee: string;
  paidFee: string;
  dueFee: string;
  referenceCode?: string | null;
  remarks?: string | null;
  documents?: any;
  createdAt: string;
}

export interface PrintingOrder {
  id: number;
  orderNumber: string;
  customerId?: number | null;
  customerName: string;
  customerMobile: string;
  documentName: string;
  printType: 'B/W' | 'Color' | 'Photocopy' | 'Scanning' | 'Lamination';
  pages: number;
  copies: number;
  paperSize: string;
  rate: string;
  totalAmount: string;
  status: 'Pending' | 'Printing' | 'Completed' | 'Delivered' | 'Cancelled';
  staffName: string;
  notes?: string | null;
  createdAt: string;
}

export interface PhotoOrder {
  id: number;
  orderNumber: string;
  customerId?: number | null;
  customerName: string;
  customerMobile: string;
  photoType: string;
  quantity: number;
  size: string;
  rate: string;
  totalAmount: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Delivered' | 'Cancelled';
  staffName: string;
  notes?: string | null;
  createdAt: string;
}

export interface DesignOrder {
  id: number;
  orderNumber: string;
  customerId?: number | null;
  customerName: string;
  customerMobile: string;
  designType: string;
  requirements: string;
  price: string;
  status: 'Pending' | 'Designing' | 'Review' | 'Completed' | 'Delivered' | 'Cancelled';
  assignedStaffName: string;
  deliveryDate?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface StudentService {
  id: number;
  orderNumber: string;
  studentName: string;
  contact: string;
  institution: string;
  serviceType: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  fee: string;
  paidAmount: string;
  dueAmount: string;
  staffName: string;
  notes?: string | null;
  createdAt: string;
}

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: string;
  date: string;
  paymentMethod: string;
  addedByName: string;
  notes?: string | null;
  createdAt: string;
}

export interface InventoryItem {
  id: number;
  itemName: string;
  category: string;
  currentStock: number;
  minStockAlert: number;
  unit: string;
  costPerUnit: string;
  supplier?: string | null;
  location?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  userName: string;
  role: string;
  action: string;
  category: string;
  details: string;
  ipAddress?: string | null;
  createdAt: string;
}

export interface ShopSettings {
  id: number;
  shopName: string;
  tagline: string;
  address: string;
  phone: string;
  altPhone?: string | null;
  email: string;
  panVatNumber?: string | null;
  invoicePrefix: string;
  invoiceFooter: string;
  qrCodeUrl?: string | null;
  paperSize: string;
  defaultPaymentMethod: string;
  enableTax: boolean;
  taxPercent: string;
  currency: string;
}
