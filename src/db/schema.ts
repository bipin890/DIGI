import { pgTable, serial, text, integer, numeric, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users (Staff and Admins)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Auth UID or identifier
  username: text('username'),
  password: text('password'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('staff'), // 'admin' | 'staff'
  phone: text('phone'),
  status: text('status').notNull().default('active'), // 'active' | 'inactive'
  permissions: jsonb('permissions'), // Custom permission flags if customized
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Customers
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  customerCode: text('customer_code').notNull().unique(), // e.g. CUST-1001
  name: text('name').notNull(),
  mobile: text('mobile').notNull(),
  address: text('address'),
  email: text('email'),
  dob: text('dob'),
  gender: text('gender'),
  photoUrl: text('photo_url'),
  notes: text('notes'),
  totalSpending: numeric('total_spending', { precision: 12, scale: 2 }).notNull().default('0.00'),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  dueAmount: numeric('due_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  visitCount: integer('visit_count').notNull().default(1),
  lastVisitAt: timestamp('last_visit_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Service Categories
export const serviceCategories = pgTable('service_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').notNull().default('Folder'),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Services Catalog
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => serviceCategories.id).notNull(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  defaultPrice: numeric('default_price', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit').notNull().default('service'), // page, copy, photo, service, piece, etc.
  minQty: integer('min_qty').notNull().default(1),
  isDiscountAllowed: boolean('is_discount_allowed').notNull().default(true),
  status: text('status').notNull().default('active'), // 'active' | 'inactive'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Service Price History - Auditing all price changes by Admin
export const servicePriceHistory = pgTable('service_price_history', {
  id: serial('id').primaryKey(),
  serviceId: integer('service_id').references(() => services.id).notNull(),
  oldPrice: numeric('old_price', { precision: 10, scale: 2 }).notNull(),
  newPrice: numeric('new_price', { precision: 10, scale: 2 }).notNull(),
  changedByUserId: integer('changed_by_user_id'),
  changedByName: text('changed_by_name').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Invoices (POS & Master Billing)
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(), // e.g. DGS-2026-0001
  customerId: integer('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerMobile: text('customer_mobile').notNull(),
  staffId: integer('staff_id'),
  staffName: text('staff_name').notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  serviceCharge: numeric('service_charge', { precision: 12, scale: 2 }).notNull().default('0.00'),
  discount: numeric('discount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  tax: numeric('tax', { precision: 12, scale: 2 }).notNull().default('0.00'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull(),
  dueAmount: numeric('due_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  paymentMethod: text('payment_method').notNull().default('Cash'), // 'Cash' | 'eSewa' | 'Khalti' | 'Bank Transfer' | 'Card' | 'Mixed Payment'
  status: text('status').notNull().default('Paid'), // 'Paid' | 'Partial' | 'Due' | 'Cancelled' | 'Refunded'
  cancelReason: text('cancel_reason'),
  cancelledBy: text('cancelled_by'),
  cancelledAt: timestamp('cancelled_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invoice Items (Snapshot of price at purchase time - immutable)
export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  serviceId: integer('service_id'),
  serviceName: text('service_name').notNull(),
  categoryName: text('category_name').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1.00'),
  unit: text('unit').notNull().default('service'),
  rate: numeric('rate', { precision: 10, scale: 2 }).notNull(),
  serviceCharge: numeric('service_charge', { precision: 10, scale: 2 }).notNull().default('0.00'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Payments & Due Clearances
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(), // 'Cash' | 'eSewa' | 'Khalti' | 'Bank Transfer' | 'Card'
  referenceNumber: text('reference_number'),
  receivedByStaffId: integer('received_by_staff_id'),
  receivedByStaffName: text('received_by_staff_name').notNull(),
  notes: text('notes'),
  paymentDate: timestamp('payment_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Refunds
export const refunds = pgTable('refunds', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  processedByStaffId: integer('processed_by_staff_id'),
  processedByStaffName: text('processed_by_staff_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Online Applications Tracking
export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  applicationNumber: text('application_number').notNull().unique(), // e.g. APP-2026-0001
  customerId: integer('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerMobile: text('customer_mobile').notNull(),
  serviceId: integer('service_id').references(() => services.id),
  serviceName: text('service_name').notNull(),
  applicationDate: timestamp('application_date').defaultNow().notNull(),
  followUpDate: text('follow_up_date'),
  staffId: integer('staff_id'),
  staffName: text('staff_name').notNull(),
  status: text('status').notNull().default('Pending'), // 'Pending' | 'In Progress' | 'Submitted' | 'Processing' | 'Completed' | 'Rejected' | 'Cancelled'
  totalFee: numeric('total_fee', { precision: 10, scale: 2 }).notNull().default('0.00'),
  paidFee: numeric('paid_fee', { precision: 10, scale: 2 }).notNull().default('0.00'),
  dueFee: numeric('due_fee', { precision: 10, scale: 2 }).notNull().default('0.00'),
  referenceCode: text('reference_code'), // Govt Token / Application Ref
  remarks: text('remarks'),
  documents: jsonb('documents'), // Attached document names or requirements
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Printing Orders
export const printingOrders = pgTable('printing_orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // e.g. PRN-2026-0001
  customerId: integer('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerMobile: text('customer_mobile').notNull(),
  documentName: text('document_name').notNull(),
  printType: text('print_type').notNull(), // 'B/W' | 'Color' | 'Photocopy' | 'Scanning' | 'Lamination'
  pages: integer('pages').notNull().default(1),
  copies: integer('copies').notNull().default(1),
  paperSize: text('paper_size').notNull().default('A4'), // 'A4' | 'Legal' | 'A3' | 'Letter'
  rate: numeric('rate', { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('Pending'), // 'Pending' | 'Printing' | 'Completed' | 'Delivered' | 'Cancelled'
  staffId: integer('staff_id'),
  staffName: text('staff_name').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Photo Orders
export const photoOrders = pgTable('photo_orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // e.g. PHO-2026-0001
  customerId: integer('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerMobile: text('customer_mobile').notNull(),
  photoType: text('photo_type').notNull(), // 'Passport Size Photo' | 'Visa Size Photo' | 'Digital Photo Print'
  quantity: integer('quantity').notNull().default(4),
  size: text('size').notNull().default('35x45 mm'),
  rate: numeric('rate', { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('Pending'), // 'Pending' | 'Processing' | 'Completed' | 'Delivered' | 'Cancelled'
  staffId: integer('staff_id'),
  staffName: text('staff_name').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Design Orders
export const designOrders = pgTable('design_orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // e.g. DSN-2026-0001
  customerId: integer('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerMobile: text('customer_mobile').notNull(),
  designType: text('design_type').notNull(), // 'Visiting Card' | 'ID Card' | 'Certificate' | 'Letterhead' | 'Invitation Card'
  requirements: text('requirements').notNull(),
  fileUploadUrl: text('file_upload_url'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('Pending'), // 'Pending' | 'Designing' | 'Review' | 'Completed' | 'Delivered' | 'Cancelled'
  assignedStaffId: integer('assigned_staff_id'),
  assignedStaffName: text('assigned_staff_name').notNull(),
  deliveryDate: text('delivery_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Student Services
export const studentServices = pgTable('student_services', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // e.g. STU-2026-0001
  studentName: text('student_name').notNull(),
  contact: text('contact').notNull(),
  institution: text('institution').notNull(),
  serviceType: text('service_type').notNull(), // 'Online Admission' | 'Entrance Form' | 'Scholarship Application' | 'Exam Form' | 'Result Check' | etc.
  status: text('status').notNull().default('Pending'), // 'Pending' | 'Processing' | 'Completed' | 'Cancelled'
  fee: numeric('fee', { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  dueAmount: numeric('due_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  documents: jsonb('documents'),
  staffId: integer('staff_id'),
  staffName: text('staff_name').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Expenses
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(), // 'Internet' | 'Electricity' | 'Rent' | 'Stationery' | 'Printing Paper' | 'Ink/Toner' | 'Equipment' | 'Maintenance' | 'Other'
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  paymentMethod: text('payment_method').notNull().default('Cash'),
  addedByUserId: integer('added_by_user_id'),
  addedByName: text('added_by_name').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Inventory Items
export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  itemName: text('item_name').notNull().unique(),
  category: text('category').notNull(), // 'Paper' | 'Ink' | 'Toner' | 'Lamination' | 'Stationery' | 'Other'
  currentStock: integer('current_stock').notNull().default(0),
  minStockAlert: integer('min_stock_alert').notNull().default(10),
  unit: text('unit').notNull().default('pcs'), // ream, bottle, box, packet, pcs
  costPerUnit: numeric('cost_per_unit', { precision: 10, scale: 2 }).notNull().default('0.00'),
  supplier: text('supplier'),
  location: text('location'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Inventory Transactions
export const inventoryTransactions = pgTable('inventory_transactions', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').references(() => inventoryItems.id).notNull(),
  type: text('type').notNull(), // 'Stock In' | 'Stock Out' | 'Adjustment'
  quantity: integer('quantity').notNull(),
  unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull().default('0.00'),
  totalCost: numeric('total_cost', { precision: 10, scale: 2 }).notNull().default('0.00'),
  reason: text('reason').notNull(),
  referenceOrder: text('reference_order'),
  performedByUserId: integer('performed_by_user_id'),
  performedByName: text('performed_by_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Activity Logs
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  userName: text('user_name').notNull(),
  role: text('role').notNull(),
  action: text('action').notNull(), // 'Login' | 'Customer Created' | 'Invoice Generated' | 'Price Changed' | etc.
  category: text('category').notNull(), // 'Auth' | 'Customer' | 'Billing' | 'Service' | 'Inventory' | 'Settings'
  details: text('details').notNull(),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Shop Settings (Single row master config)
export const shopSettings = pgTable('shop_settings', {
  id: serial('id').primaryKey(),
  shopName: text('shop_name').notNull().default('DIGI DIGITAL SEWA'),
  tagline: text('tagline').notNull().default('Your Complete Digital & Online Service Solution'),
  address: text('address').notNull().default('Main Market, Kathmandu, Nepal'),
  phone: text('phone').notNull().default('+977-9800000000'),
  altPhone: text('alt_phone'),
  email: text('email').notNull().default('digidigitalsewa@gmail.com'),
  panVatNumber: text('pan_vat_number').default('609123456'),
  invoicePrefix: text('invoice_prefix').notNull().default('DGS'),
  invoiceFooter: text('invoice_footer').notNull().default('धन्यवाद! फेरी भेटौला। Thank you for choosing Digi Digital Sewa.'),
  qrCodeUrl: text('qr_code_url'),
  paperSize: text('paper_size').notNull().default('A4'),
  defaultPaymentMethod: text('default_payment_method').notNull().default('Cash'),
  enableTax: boolean('enable_tax').notNull().default(false),
  taxPercent: numeric('tax_percent', { precision: 5, scale: 2 }).notNull().default('13.00'),
  currency: text('currency').notNull().default('NPR'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const invoicesRelations = relations(invoices, ({ many, one }) => ({
  items: many(invoiceItems),
  payments: many(payments),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  priceHistory: many(servicePriceHistory),
}));
