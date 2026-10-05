import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import {
  users, customers, serviceCategories, services, servicePriceHistory,
  invoices, invoiceItems, payments, refunds, applications,
  printingOrders, photoOrders, designOrders, studentServices,
  expenses, inventoryItems, inventoryTransactions, activityLogs, shopSettings
} from '../db/schema.ts';
import { eq, ne, inArray, desc, asc, sql, and, or, ilike, gte, lte } from 'drizzle-orm';
import { AuthRequest, authenticateUser, requireAdmin } from '../middleware/auth.ts';

export const apiRouter = Router();

// Apply auth middleware to all api routes
apiRouter.use(authenticateUser);

// Helper for audit logging
async function logActivity(
  req: AuthRequest,
  action: string,
  category: string,
  details: string
) {
  try {
    const user = req.dbUser;
    await db.insert(activityLogs).values({
      userId: user?.id || null,
      userName: user?.name || 'System User',
      role: user?.role || 'staff',
      action,
      category,
      details,
      ipAddress: req.ip || '127.0.0.1',
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// -------------------------------------------------------------
// 1. AUTH & PROFILE
// -------------------------------------------------------------
apiRouter.post('/auth/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Verify user in database
    const userRecords = await db.select().from(users).where(eq(users.username, cleanUsername)).limit(1);

    if (userRecords.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = userRecords[0];

    // Check password
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'This account has been deactivated.' });
    }

    await logActivity(req, 'Login', 'Auth', `${user.name} (${user.role}) logged into DIGI DIGITAL SEWA.`);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

apiRouter.get('/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.dbUser) {
    return res.json({ authenticated: false, user: null });
  }
  res.json({
    authenticated: true,
    user: {
      id: req.dbUser.id,
      username: req.dbUser.username,
      name: req.dbUser.name,
      email: req.dbUser.email,
      role: req.dbUser.role,
      status: req.dbUser.status,
    },
  });
});

// -------------------------------------------------------------
// 2. DASHBOARD
// -------------------------------------------------------------
apiRouter.get('/dashboard/stats', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startOfToday = new Date(`${today}T00:00:00.000Z`);

    // 1. Invoices & refunds stats
    const allInvoices = await db.select().from(invoices);
    const allRefunds = await db.select().from(refunds);
    const validInvoices = allInvoices.filter(i => i.status !== 'Cancelled');
    
    // Today's invoices & refunds
    const todayInvoices = validInvoices.filter(i => {
      const invDate = new Date(i.createdAt).toISOString().split('T')[0];
      return invDate === today;
    });

    const todayRefunds = allRefunds
      .filter(r => new Date(r.createdAt).toISOString().split('T')[0] === today)
      .reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
    const totalRefundsSum = allRefunds.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);

    const grossTodaySales = todayInvoices.reduce((sum, i) => sum + parseFloat(i.grandTotal || '0'), 0);
    const grossTodayPaid = todayInvoices.reduce((sum, i) => sum + parseFloat(i.paidAmount || '0'), 0);

    // Net sales & collected today (accounting for refunds)
    const todaySales = Math.max(0, grossTodaySales - todayRefunds);
    const todayPaid = Math.max(0, grossTodayPaid - todayRefunds);

    // Today's expenses
    const allExpenses = await db.select().from(expenses);
    const todayExpenses = allExpenses
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);

    const todayProfit = todaySales - todayExpenses;

    // Overall metrics (net of total refunds)
    const totalDues = validInvoices.reduce((sum, i) => sum + parseFloat(i.dueAmount || '0'), 0);
    const grossTotalSales = validInvoices.reduce((sum, i) => sum + parseFloat(i.grandTotal || '0'), 0);
    const totalSales = Math.max(0, grossTotalSales - totalRefundsSum);
    const totalExpensesSum = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
    const totalProfit = totalSales - totalExpensesSum;

    // Pending counts
    const pendingApps = await db.select().from(applications).where(
      or(eq(applications.status, 'Pending'), eq(applications.status, 'In Progress'), eq(applications.status, 'Processing'))
    );
    const pendingPrints = await db.select().from(printingOrders).where(
      or(eq(printingOrders.status, 'Pending'), eq(printingOrders.status, 'Printing'))
    );
    const pendingPhotos = await db.select().from(photoOrders).where(
      or(eq(photoOrders.status, 'Pending'), eq(photoOrders.status, 'Processing'))
    );
    const pendingDesigns = await db.select().from(designOrders).where(
      or(eq(designOrders.status, 'Pending'), eq(designOrders.status, 'Designing'), eq(designOrders.status, 'Review'))
    );
    const pendingStudents = await db.select().from(studentServices).where(
      or(eq(studentServices.status, 'Pending'), eq(studentServices.status, 'Processing'))
    );

    const pendingOrdersCount = pendingPrints.length + pendingPhotos.length + pendingDesigns.length + pendingStudents.length;

    // Customers today
    const allCusts = await db.select().from(customers);
    const customersToday = allCusts.filter(c => {
      const visitDate = new Date(c.lastVisitAt).toISOString().split('T')[0];
      return visitDate === today;
    }).length;

    // Low stock items
    const lowStockItems = await db.select().from(inventoryItems).where(
      sql`${inventoryItems.currentStock} <= ${inventoryItems.minStockAlert}`
    );

    // Recent 5 Invoices
    const recentInvoices = await db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(5);
    // Recent 5 Applications
    const recentApplications = await db.select().from(applications).orderBy(desc(applications.createdAt)).limit(5);
    // Recent 5 Customers
    const recentCustomers = await db.select().from(customers).orderBy(desc(customers.updatedAt)).limit(5);

    // Last 7 days sales chart (net of refunds)
    const last7Days: { date: string; sales: number; expenses: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRefunds = allRefunds
        .filter(r => new Date(r.createdAt).toISOString().split('T')[0] === dateStr)
        .reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
      const daySales = Math.max(0, validInvoices
        .filter(inv => new Date(inv.createdAt).toISOString().split('T')[0] === dateStr)
        .reduce((sum, inv) => sum + parseFloat(inv.grandTotal || '0'), 0) - dayRefunds);
      const dayExp = allExpenses
        .filter(exp => exp.date === dateStr)
        .reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0);
      last7Days.push({ date: dateStr, sales: daySales, expenses: dayExp });
    }

    res.json({
      summary: {
        todaySales,
        todayGrossSales: grossTodaySales,
        todayRefunds,
        todayPaid,
        todayExpenses,
        todayProfit,
        totalSales,
        totalRefunds: totalRefundsSum,
        totalExpenses: totalExpensesSum,
        totalProfit,
        totalDues,
        customersToday,
        totalCustomers: allCusts.length,
        pendingApplicationsCount: pendingApps.length,
        pendingOrdersCount,
        lowStockCount: lowStockItems.length,
      },
      charts: {
        last7Days,
      },
      recent: {
        invoices: recentInvoices,
        applications: recentApplications,
        customers: recentCustomers,
        lowStockItems,
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
});

// -------------------------------------------------------------
// 3. CUSTOMER MANAGEMENT
// -------------------------------------------------------------
apiRouter.get('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const { search, filter } = req.query;
    let query = db.select().from(customers);

    let customerList = await query.orderBy(desc(customers.lastVisitAt));

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      customerList = customerList.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }

    if (filter === 'due') {
      customerList = customerList.filter(c => parseFloat(c.dueAmount || '0') > 0);
    } else if (filter === 'frequent') {
      customerList = customerList.filter(c => c.visitCount >= 2);
    }

    res.json(customerList);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

apiRouter.post('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const { name, mobile, address, email, dob, gender, notes } = req.body;
    if (!name || !mobile) {
      return res.status(400).json({ error: 'Customer Name and Mobile are required.' });
    }

    // Auto-generate code e.g. CUST-1001
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(customers);
    const nextNum = (countResult[0]?.count || 0) + 1001;
    const customerCode = `CUST-${nextNum}`;

    const [newCustomer] = await db.insert(customers).values({
      customerCode,
      name,
      mobile,
      address: address || null,
      email: email || null,
      dob: dob || null,
      gender: gender || null,
      notes: notes || null,
      visitCount: 1,
    }).returning();

    await logActivity(req, 'Customer Created', 'Customer', `Added customer ${newCustomer.name} (${customerCode})`);
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

apiRouter.get('/customers/:id', async (req: AuthRequest, res: Response) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const cust = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
    if (!cust.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Fetch complete customer history
    const customerInvoices = await db.select().from(invoices).where(eq(invoices.customerId, customerId)).orderBy(desc(invoices.createdAt));
    const customerPayments = await db.select().from(payments).where(eq(payments.customerId, customerId)).orderBy(desc(payments.createdAt));
    const customerApps = await db.select().from(applications).where(eq(applications.customerId, customerId)).orderBy(desc(applications.createdAt));
    const customerPrints = await db.select().from(printingOrders).where(eq(printingOrders.customerId, customerId)).orderBy(desc(printingOrders.createdAt));
    const customerPhotos = await db.select().from(photoOrders).where(eq(photoOrders.customerId, customerId)).orderBy(desc(photoOrders.createdAt));
    const customerDesigns = await db.select().from(designOrders).where(eq(designOrders.customerId, customerId)).orderBy(desc(designOrders.createdAt));

    res.json({
      customer: cust[0],
      invoices: customerInvoices,
      payments: customerPayments,
      applications: customerApps,
      printingOrders: customerPrints,
      photoOrders: customerPhotos,
      designOrders: customerDesigns,
    });
  } catch (error) {
    console.error('Error fetching customer history:', error);
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

apiRouter.put('/customers/:id', async (req: AuthRequest, res: Response) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const { name, mobile, address, email, dob, gender, notes } = req.body;

    const [updated] = await db.update(customers).set({
      name,
      mobile,
      address,
      email,
      dob,
      gender,
      notes,
      updatedAt: new Date(),
    }).where(eq(customers.id, customerId)).returning();

    await logActivity(req, 'Customer Updated', 'Customer', `Updated profile of ${updated.name} (${updated.customerCode})`);
    res.json(updated);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Admin-only: Permanently Delete Customer & Linked Records
apiRouter.delete('/customers/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const cust = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
    if (!cust.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const customer = cust[0];

    // Find all invoices for this customer
    const custInvoices = await db.select().from(invoices).where(eq(invoices.customerId, customerId));
    const invIds = custInvoices.map(i => i.id);

    // Delete refunds, payments, and invoice line items
    if (invIds.length > 0) {
      await db.delete(refunds).where(or(inArray(refunds.invoiceId, invIds), eq(refunds.customerId, customerId)));
      await db.delete(payments).where(or(inArray(payments.invoiceId, invIds), eq(payments.customerId, customerId)));
      await db.delete(invoiceItems).where(inArray(invoiceItems.invoiceId, invIds));
      await db.delete(invoices).where(eq(invoices.customerId, customerId));
    } else {
      await db.delete(refunds).where(eq(refunds.customerId, customerId));
      await db.delete(payments).where(eq(payments.customerId, customerId));
    }

    // Delete related service orders
    await db.delete(applications).where(eq(applications.customerId, customerId));
    await db.delete(printingOrders).where(eq(printingOrders.customerId, customerId));
    await db.delete(photoOrders).where(eq(photoOrders.customerId, customerId));
    await db.delete(designOrders).where(eq(designOrders.customerId, customerId));
    await db.delete(studentServices).where(eq(studentServices.customerId, customerId));

    // Delete customer record
    await db.delete(customers).where(eq(customers.id, customerId));

    await logActivity(
      req,
      'Customer Deleted',
      'Customer',
      `Admin permanently deleted customer: ${customer.name} (${customer.customerCode}) and all linked records`
    );

    res.json({
      success: true,
      message: `Customer ${customer.name} and all linked records deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// -------------------------------------------------------------
// 4. SERVICE CATALOG & CATEGORIES
// -------------------------------------------------------------
apiRouter.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const cats = await db.select().from(serviceCategories).orderBy(asc(serviceCategories.sortOrder));
    res.json(cats);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

apiRouter.get('/services', async (req: AuthRequest, res: Response) => {
  try {
    const allServices = await db.select({
      id: services.id,
      categoryId: services.categoryId,
      categoryName: serviceCategories.name,
      categorySlug: serviceCategories.slug,
      name: services.name,
      code: services.code,
      defaultPrice: services.defaultPrice,
      unit: services.unit,
      minQty: services.minQty,
      isDiscountAllowed: services.isDiscountAllowed,
      status: services.status,
      description: services.description,
      createdAt: services.createdAt,
      updatedAt: services.updatedAt,
    })
    .from(services)
    .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .orderBy(asc(serviceCategories.sortOrder), asc(services.name));

    res.json(allServices);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Admin-only: Add new master service
apiRouter.post('/services', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, name, defaultPrice, unit, minQty, isDiscountAllowed, description } = req.body;
    if (!categoryId || !name || defaultPrice === undefined) {
      return res.status(400).json({ error: 'Category, name, and default price are required.' });
    }

    const code = `SRV-${Date.now().toString().slice(-6)}`;
    const [newService] = await db.insert(services).values({
      categoryId: parseInt(categoryId, 10),
      name,
      code,
      defaultPrice: defaultPrice.toString(),
      unit: unit || 'service',
      minQty: minQty || 1,
      isDiscountAllowed: isDiscountAllowed ?? true,
      description: description || null,
      status: 'active',
    }).returning();

    await logActivity(req, 'Service Created', 'Service', `Created service "${name}" at Rs. ${defaultPrice}`);
    res.status(201).json(newService);
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

// -------------------------------------------------------------
// 5. SERVICE PRICE MANAGEMENT (CRITICAL - ADMIN ONLY)
// -------------------------------------------------------------
apiRouter.put('/services/:id/price', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    const { newPrice, reason } = req.body;

    if (newPrice === undefined || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) < 0) {
      return res.status(400).json({ error: 'Valid new price is required.' });
    }

    // Get current price
    const srv = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!srv.length) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const currentService = srv[0];
    const oldPrice = currentService.defaultPrice;
    const formattedNewPrice = parseFloat(newPrice).toFixed(2);

    // 1. Update service defaultPrice
    const [updated] = await db.update(services).set({
      defaultPrice: formattedNewPrice,
      updatedAt: new Date(),
    }).where(eq(services.id, serviceId)).returning();

    // 2. Insert audit record in service_price_history
    await db.insert(servicePriceHistory).values({
      serviceId,
      oldPrice,
      newPrice: formattedNewPrice,
      changedByUserId: req.dbUser?.id || null,
      changedByName: req.dbUser?.name || 'Admin',
      reason: reason || 'Price adjustment by Owner',
    });

    // 3. Activity log
    await logActivity(
      req,
      'Price Changed',
      'Service',
      `Changed price for "${currentService.name}" from Rs. ${oldPrice} to Rs. ${formattedNewPrice}. Reason: ${reason || 'N/A'}`
    );

    res.json({
      service: updated,
      oldPrice,
      newPrice: formattedNewPrice,
      message: 'Service price successfully updated. Old invoices remain untouched.',
    });
  } catch (error) {
    console.error('Error changing service price:', error);
    res.status(500).json({ error: 'Failed to update service price' });
  }
});

apiRouter.put('/services/:id/status', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    const { status } = req.body; // 'active' | 'inactive'

    const [updated] = await db.update(services).set({
      status,
      updatedAt: new Date(),
    }).where(eq(services.id, serviceId)).returning();

    await logActivity(req, 'Service Status Changed', 'Service', `Updated status of ${updated.name} to ${status}`);
    res.json(updated);
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ error: 'Failed to update service status' });
  }
});

apiRouter.get('/services/price-history', async (req: AuthRequest, res: Response) => {
  try {
    const history = await db.select({
      id: servicePriceHistory.id,
      serviceId: servicePriceHistory.serviceId,
      serviceName: services.name,
      oldPrice: servicePriceHistory.oldPrice,
      newPrice: servicePriceHistory.newPrice,
      changedByName: servicePriceHistory.changedByName,
      reason: servicePriceHistory.reason,
      createdAt: servicePriceHistory.createdAt,
    })
    .from(servicePriceHistory)
    .innerJoin(services, eq(servicePriceHistory.serviceId, services.id))
    .orderBy(desc(servicePriceHistory.createdAt));

    res.json(history);
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// -------------------------------------------------------------
// 6. POS BILLING & INVOICING
// -------------------------------------------------------------
apiRouter.get('/invoices', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, date, paymentMethod } = req.query;
    let invList = await db.select().from(invoices).orderBy(desc(invoices.createdAt));

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      invList = invList.filter(i =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        i.customerMobile.includes(q) ||
        i.staffName.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'all') {
      invList = invList.filter(i => i.status === status);
    }

    if (paymentMethod && paymentMethod !== 'all') {
      invList = invList.filter(i => i.paymentMethod === paymentMethod);
    }

    if (date && typeof date === 'string') {
      invList = invList.filter(i => {
        const invDate = new Date(i.createdAt).toISOString().split('T')[0];
        return invDate === date;
      });
    }

    res.json(invList);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

apiRouter.get('/invoices/:id', async (req: AuthRequest, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const inv = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!inv.length) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    const invPayments = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(asc(payments.createdAt));
    const invRefunds = await db.select().from(refunds).where(eq(refunds.invoiceId, invoiceId));

    res.json({
      invoice: inv[0],
      items,
      payments: invPayments,
      refunds: invRefunds,
    });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

// POS Checkout / Create New Invoice
apiRouter.post('/invoices', async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerId, customerName, customerMobile, customerAddress,
      items, serviceCharge, discount, tax, paidAmount, paymentMethod, notes
    } = req.body;

    if (!customerName || !customerMobile || !items || !items.length) {
      return res.status(400).json({ error: 'Customer name, mobile and at least one service item are required.' });
    }

    // 1. Resolve or create customer record
    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId) {
      const existingCustomer = await db.select().from(customers).where(eq(customers.mobile, customerMobile)).limit(1);
      if (existingCustomer.length > 0) {
        resolvedCustomerId = existingCustomer[0].id;
      } else {
        const countResult = await db.select({ count: sql<number>`count(*)` }).from(customers);
        const nextNum = (countResult[0]?.count || 0) + 1001;
        const [createdCustomer] = await db.insert(customers).values({
          customerCode: `CUST-${nextNum}`,
          name: customerName,
          mobile: customerMobile,
          address: customerAddress || null,
          visitCount: 1,
        }).returning();
        resolvedCustomerId = createdCustomer.id;
      }
    }

    // 2. Generate unique invoice number: DGS-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(invoices);
    const nextInvoiceSeq = (countResult[0]?.count || 0) + 1;
    const invoiceNumber = `DGS-${currentYear}-${String(nextInvoiceSeq).padStart(4, '0')}`;

    // 3. Calculate financial totals with manual price, service charge, and discounts
    let subtotal = 0;
    let itemsServiceChargeSum = 0;
    let itemsDiscountSum = 0;

    const formattedItems = items.map((item: any) => {
      const qty = parseFloat(item.quantity !== undefined ? item.quantity : '1');
      const rate = parseFloat(item.rate !== undefined ? item.rate : '0');
      const itemServiceCharge = parseFloat(item.serviceCharge !== undefined ? item.serviceCharge : '0');
      const itemDiscount = parseFloat(item.discount !== undefined ? item.discount : '0');

      const lineAmount = qty * rate;
      const netAmount = Math.max(0, lineAmount + itemServiceCharge - itemDiscount);

      subtotal += lineAmount;
      itemsServiceChargeSum += itemServiceCharge;
      itemsDiscountSum += itemDiscount;

      return {
        ...item,
        quantity: qty.toFixed(2),
        rate: rate.toFixed(2),
        serviceCharge: itemServiceCharge.toFixed(2),
        amount: lineAmount.toFixed(2),
        discount: itemDiscount.toFixed(2),
        netAmount: netAmount.toFixed(2),
      };
    });

    const overallServiceCharge = parseFloat(serviceCharge !== undefined ? serviceCharge : '0');
    const totalServiceCharge = itemsServiceChargeSum + overallServiceCharge;

    const overallDiscount = parseFloat(discount !== undefined ? discount : '0');
    const totalDiscount = itemsDiscountSum + overallDiscount;

    const parsedTax = parseFloat(tax !== undefined ? tax : '0');
    const grandTotal = Math.max(0, subtotal + totalServiceCharge - totalDiscount + parsedTax);
    const parsedPaid = parseFloat(paidAmount !== undefined && paidAmount !== '' ? paidAmount : grandTotal);
    const dueAmount = Math.max(0, grandTotal - parsedPaid);

    let status = 'Paid';
    if (parsedPaid <= 0) {
      status = 'Due';
    } else if (dueAmount > 0) {
      status = 'Partial';
    }

    const staffName = req.dbUser?.name || 'Counter Operator';
    const staffId = req.dbUser?.id || null;

    // 4. Insert Invoice
    const [newInvoice] = await db.insert(invoices).values({
      invoiceNumber,
      customerId: resolvedCustomerId,
      customerName,
      customerMobile,
      staffId,
      staffName,
      subtotal: subtotal.toFixed(2),
      serviceCharge: totalServiceCharge.toFixed(2),
      discount: totalDiscount.toFixed(2),
      tax: parsedTax.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      paidAmount: parsedPaid.toFixed(2),
      dueAmount: dueAmount.toFixed(2),
      paymentMethod: paymentMethod || 'Cash',
      status,
      notes: notes || null,
    }).returning();

    // 5. Insert Invoice Items (snapshot with exact entered prices and charges)
    for (const item of formattedItems) {
      await db.insert(invoiceItems).values({
        invoiceId: newInvoice.id,
        serviceId: item.serviceId || null,
        serviceName: item.serviceName || item.name,
        categoryName: item.categoryName || 'General Service',
        quantity: item.quantity,
        unit: item.unit || 'service',
        rate: item.rate,
        serviceCharge: item.serviceCharge,
        amount: item.amount,
        discount: item.discount,
        netAmount: item.netAmount,
        notes: item.notes || null,
      });
    }

    // 6. Record payment entry if paidAmount > 0
    if (parsedPaid > 0) {
      await db.insert(payments).values({
        invoiceId: newInvoice.id,
        customerId: resolvedCustomerId,
        amount: parsedPaid.toFixed(2),
        paymentMethod: paymentMethod || 'Cash',
        receivedByStaffId: staffId,
        receivedByStaffName: staffName,
        notes: `Initial bill payment on ${newInvoice.invoiceNumber}`,
      });
    }

    // 7. Update Customer Total Spending, Paid and Due balance
    await db.update(customers).set({
      totalSpending: sql`${customers.totalSpending} + ${grandTotal}`,
      paidAmount: sql`${customers.paidAmount} + ${parsedPaid}`,
      dueAmount: sql`${customers.dueAmount} + ${dueAmount}`,
      visitCount: sql`${customers.visitCount} + 1`,
      lastVisitAt: new Date(),
    }).where(eq(customers.id, resolvedCustomerId));

    // 8. Audit log
    await logActivity(
      req,
      'Invoice Created',
      'Billing',
      `Generated invoice ${invoiceNumber} for ${customerName} (Total: Rs. ${grandTotal.toFixed(2)}, Paid: Rs. ${parsedPaid.toFixed(2)}, Due: Rs. ${dueAmount.toFixed(2)})`
    );

    res.status(201).json({
      invoice: newInvoice,
      items: formattedItems,
      message: 'Invoice created successfully',
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Record later due clearance payment
apiRouter.post('/invoices/:id/payment', async (req: AuthRequest, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const { amount, paymentMethod, referenceNumber, notes } = req.body;
    const payAmount = parseFloat(amount);

    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid payment amount.' });
    }

    const inv = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!inv.length) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const invoice = inv[0];
    const currentDue = parseFloat(invoice.dueAmount);
    if (payAmount > currentDue) {
      return res.status(400).json({ error: `Payment amount (Rs. ${payAmount}) exceeds current due (Rs. ${currentDue}).` });
    }

    const newPaid = parseFloat(invoice.paidAmount) + payAmount;
    const newDue = currentDue - payAmount;
    const newStatus = newDue <= 0 ? 'Paid' : 'Partial';

    const staffName = req.dbUser?.name || 'Staff Counter';
    const staffId = req.dbUser?.id || null;

    // 1. Record payment transaction
    const [paymentRecord] = await db.insert(payments).values({
      invoiceId,
      customerId: invoice.customerId,
      amount: payAmount.toFixed(2),
      paymentMethod: paymentMethod || 'Cash',
      referenceNumber: referenceNumber || null,
      receivedByStaffId: staffId,
      receivedByStaffName: staffName,
      notes: notes || `Due clearance on ${invoice.invoiceNumber}`,
    }).returning();

    // 2. Update invoice balance
    const [updatedInvoice] = await db.update(invoices).set({
      paidAmount: newPaid.toFixed(2),
      dueAmount: newDue.toFixed(2),
      status: newStatus,
      updatedAt: new Date(),
    }).where(eq(invoices.id, invoiceId)).returning();

    // 3. Update customer due balance
    if (invoice.customerId) {
      await db.update(customers).set({
        paidAmount: sql`${customers.paidAmount} + ${payAmount}`,
        dueAmount: sql`GREATEST(0, ${customers.dueAmount} - ${payAmount})`,
        lastVisitAt: new Date(),
      }).where(eq(customers.id, invoice.customerId));
    }

    // 4. Audit log
    await logActivity(
      req,
      'Payment Recorded',
      'Billing',
      `Recorded payment of Rs. ${payAmount.toFixed(2)} on invoice ${invoice.invoiceNumber} via ${paymentMethod || 'Cash'}. Remaining due: Rs. ${newDue.toFixed(2)}`
    );

    res.json({
      invoice: updatedInvoice,
      payment: paymentRecord,
      message: `Payment of Rs. ${payAmount} recorded successfully.`,
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Admin-only: Cancel / Void Invoice with audit
apiRouter.post('/invoices/:id/cancel', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const { cancelReason } = req.body;

    if (!cancelReason || !cancelReason.trim()) {
      return res.status(400).json({ error: 'Cancellation reason is required.' });
    }

    const inv = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!inv.length) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const invoice = inv[0];
    if (invoice.status === 'Cancelled') {
      return res.status(400).json({ error: 'Invoice is already cancelled.' });
    }

    const grandTotal = parseFloat(invoice.grandTotal);
    const paidAmount = parseFloat(invoice.paidAmount);
    const dueAmount = parseFloat(invoice.dueAmount);

    // Update invoice status to Cancelled (never delete financial record)
    const [cancelledInvoice] = await db.update(invoices).set({
      status: 'Cancelled',
      cancelReason,
      cancelledBy: req.dbUser?.name || 'Admin',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(invoices.id, invoiceId)).returning();

    // Adjust customer balance
    if (invoice.customerId) {
      await db.update(customers).set({
        totalSpending: sql`GREATEST(0, ${customers.totalSpending} - ${grandTotal})`,
        paidAmount: sql`GREATEST(0, ${customers.paidAmount} - ${paidAmount})`,
        dueAmount: sql`GREATEST(0, ${customers.dueAmount} - ${dueAmount})`,
      }).where(eq(customers.id, invoice.customerId));
    }

    await logActivity(
      req,
      'Invoice Cancelled',
      'Billing',
      `Cancelled invoice ${invoice.invoiceNumber}. Reason: ${cancelReason}`
    );

    res.json({
      invoice: cancelledInvoice,
      message: `Invoice ${invoice.invoiceNumber} cancelled successfully.`,
    });
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    res.status(500).json({ error: 'Failed to cancel invoice' });
  }
});

// Admin-only: Process Refund
apiRouter.post('/invoices/:id/refund', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const { amount, reason } = req.body;
    const refundAmount = parseFloat(amount);

    if (isNaN(refundAmount) || refundAmount <= 0) {
      return res.status(400).json({ error: 'Valid refund amount is required.' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Refund reason is required.' });
    }

    const inv = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!inv.length) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const invoice = inv[0];
    const currentPaid = parseFloat(invoice.paidAmount);
    if (refundAmount > currentPaid) {
      return res.status(400).json({ error: `Refund amount cannot exceed paid amount of Rs. ${currentPaid}.` });
    }

    // Insert refund record
    const [newRefund] = await db.insert(refunds).values({
      invoiceId,
      customerId: invoice.customerId,
      amount: refundAmount.toFixed(2),
      reason,
      processedByStaffId: req.dbUser?.id || null,
      processedByStaffName: req.dbUser?.name || 'Admin',
    }).returning();

    // Update invoice status
    const newPaid = Math.max(0, currentPaid - refundAmount);
    await db.update(invoices).set({
      paidAmount: newPaid.toFixed(2),
      status: newPaid <= 0 ? 'Refunded' : 'Partial',
      notes: `${invoice.notes || ''} | Refunded Rs. ${refundAmount}: ${reason}`,
      updatedAt: new Date(),
    }).where(eq(invoices.id, invoiceId));

    // Update customer spending
    if (invoice.customerId) {
      await db.update(customers).set({
        paidAmount: sql`GREATEST(0, ${customers.paidAmount} - ${refundAmount})`,
      }).where(eq(customers.id, invoice.customerId));
    }

    await logActivity(
      req,
      'Refund Processed',
      'Billing',
      `Processed refund of Rs. ${refundAmount} for invoice ${invoice.invoiceNumber}. Reason: ${reason}`
    );

    res.json({
      refund: newRefund,
      message: `Refund of Rs. ${refundAmount} processed successfully.`,
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Admin-only: Permanently Delete Invoice / Statement
apiRouter.delete('/invoices/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const invoiceRecords = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!invoiceRecords.length) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const invoice = invoiceRecords[0];

    // 1. Delete associated payments
    await db.delete(payments).where(eq(payments.invoiceId, invoiceId));

    // 2. Delete associated refunds
    await db.delete(refunds).where(eq(refunds.invoiceId, invoiceId));

    // 3. Delete invoice line items
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

    // 4. Delete the invoice itself
    await db.delete(invoices).where(eq(invoices.id, invoiceId));

    // 5. Recalculate customer totals if customerId exists
    if (invoice.customerId) {
      const remainingCustInvoices = await db.select().from(invoices).where(
        and(eq(invoices.customerId, invoice.customerId), ne(invoices.status, 'Cancelled'))
      );
      const totalSpending = remainingCustInvoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal), 0);
      const paidAmount = remainingCustInvoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount), 0);
      const dueAmount = remainingCustInvoices.reduce((sum, inv) => sum + parseFloat(inv.dueAmount), 0);
      const visitCount = Math.max(1, remainingCustInvoices.length);

      await db.update(customers).set({
        totalSpending: totalSpending.toFixed(2),
        paidAmount: paidAmount.toFixed(2),
        dueAmount: dueAmount.toFixed(2),
        visitCount,
        updatedAt: new Date(),
      }).where(eq(customers.id, invoice.customerId));
    }

    await logActivity(
      req,
      'Invoice Deleted',
      'Billing',
      `Admin permanently deleted statement/invoice ${invoice.invoiceNumber} for customer ${invoice.customerName}`
    );

    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// -------------------------------------------------------------
// 7. ONLINE APPLICATION MANAGEMENT
// -------------------------------------------------------------
apiRouter.get('/applications', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status } = req.query;
    let appList = await db.select().from(applications).orderBy(desc(applications.createdAt));

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      appList = appList.filter(a =>
        a.applicationNumber.toLowerCase().includes(q) ||
        a.customerName.toLowerCase().includes(q) ||
        a.customerMobile.includes(q) ||
        a.serviceName.toLowerCase().includes(q) ||
        (a.referenceCode && a.referenceCode.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'all') {
      appList = appList.filter(a => a.status === status);
    }

    res.json(appList);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

apiRouter.post('/applications', async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerId, customerName, customerMobile, serviceId, serviceName,
      followUpDate, totalFee, paidFee, referenceCode, remarks, documents
    } = req.body;

    if (!customerName || !customerMobile || !serviceName) {
      return res.status(400).json({ error: 'Customer name, mobile and service are required.' });
    }

    const currentYear = new Date().getFullYear();
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(applications);
    const nextSeq = (countResult[0]?.count || 0) + 1;
    const applicationNumber = `APP-${currentYear}-${String(nextSeq).padStart(4, '0')}`;

    const fee = parseFloat(totalFee || '0');
    const paid = parseFloat(paidFee || '0');
    const due = Math.max(0, fee - paid);

    const [newApp] = await db.insert(applications).values({
      applicationNumber,
      customerId: customerId ? parseInt(customerId, 10) : null,
      customerName,
      customerMobile,
      serviceId: serviceId ? parseInt(serviceId, 10) : null,
      serviceName,
      followUpDate: followUpDate || null,
      staffId: req.dbUser?.id || null,
      staffName: req.dbUser?.name || 'Staff',
      status: 'Pending',
      totalFee: fee.toFixed(2),
      paidFee: paid.toFixed(2),
      dueFee: due.toFixed(2),
      referenceCode: referenceCode || null,
      remarks: remarks || null,
      documents: documents || null,
    }).returning();

    await logActivity(req, 'Application Created', 'Application', `Created application ${applicationNumber} for ${customerName} (${serviceName})`);
    res.status(201).json(newApp);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

apiRouter.put('/applications/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const { status, referenceCode, remarks, followUpDate } = req.body;

    const [updated] = await db.update(applications).set({
      status,
      referenceCode: referenceCode !== undefined ? referenceCode : undefined,
      remarks: remarks !== undefined ? remarks : undefined,
      followUpDate: followUpDate !== undefined ? followUpDate : undefined,
      updatedAt: new Date(),
    }).where(eq(applications.id, appId)).returning();

    await logActivity(req, 'Application Updated', 'Application', `Updated status of ${updated.applicationNumber} to ${status}`);
    res.json(updated);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// -------------------------------------------------------------
// 8. PRINTING ORDERS
// -------------------------------------------------------------
apiRouter.get('/orders/printing', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    let list = await db.select().from(printingOrders).orderBy(desc(printingOrders.createdAt));
    if (status && status !== 'all') {
      list = list.filter(p => p.status === status);
    }
    res.json(list);
  } catch (error) {
    console.error('Error fetching printing orders:', error);
    res.status(500).json({ error: 'Failed to fetch printing orders' });
  }
});

apiRouter.post('/orders/printing', async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, customerName, customerMobile, documentName, printType, pages, copies, paperSize, rate, notes } = req.body;
    if (!customerName || !documentName) {
      return res.status(400).json({ error: 'Customer name and document name required.' });
    }

    const currentYear = new Date().getFullYear();
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(printingOrders);
    const orderNumber = `PRN-${currentYear}-${String((countResult[0]?.count || 0) + 1).padStart(4, '0')}`;

    const numPages = parseInt(pages || 1, 10);
    const numCopies = parseInt(copies || 1, 10);
    const itemRate = parseFloat(rate || 5);
    const totalAmount = numPages * numCopies * itemRate;

    const [newOrder] = await db.insert(printingOrders).values({
      orderNumber,
      customerId: customerId ? parseInt(customerId, 10) : null,
      customerName,
      customerMobile: customerMobile || '',
      documentName,
      printType: printType || 'B/W',
      pages: numPages,
      copies: numCopies,
      paperSize: paperSize || 'A4',
      rate: itemRate.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      status: 'Pending',
      staffId: req.dbUser?.id || null,
      staffName: req.dbUser?.name || 'Staff',
      notes: notes || null,
    }).returning();

    await logActivity(req, 'Printing Order Created', 'Orders', `Created printing order ${orderNumber} (${documentName}, ${totalAmount} NPR)`);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating printing order:', error);
    res.status(500).json({ error: 'Failed to create printing order' });
  }
});

apiRouter.put('/orders/printing/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const [updated] = await db.update(printingOrders).set({
      status,
      updatedAt: new Date(),
    }).where(eq(printingOrders.id, orderId)).returning();
    res.json(updated);
  } catch (error) {
    console.error('Error updating print order:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// -------------------------------------------------------------
// 9. PHOTO SERVICES
// -------------------------------------------------------------
apiRouter.get('/orders/photo', async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(photoOrders).orderBy(desc(photoOrders.createdAt));
    res.json(list);
  } catch (error) {
    console.error('Error fetching photo orders:', error);
    res.status(500).json({ error: 'Failed to fetch photo orders' });
  }
});

apiRouter.post('/orders/photo', async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, customerName, customerMobile, photoType, quantity, size, rate, notes } = req.body;
    const currentYear = new Date().getFullYear();
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(photoOrders);
    const orderNumber = `PHO-${currentYear}-${String((countResult[0]?.count || 0) + 1).padStart(4, '0')}`;

    const qty = parseInt(quantity || 4, 10);
    const itemRate = parseFloat(rate || 150);
    const totalAmount = itemRate; // Usually set rate or per photo

    const [newOrder] = await db.insert(photoOrders).values({
      orderNumber,
      customerId: customerId ? parseInt(customerId, 10) : null,
      customerName,
      customerMobile: customerMobile || '',
      photoType: photoType || 'Passport Size Photo',
      quantity: qty,
      size: size || '35x45 mm',
      rate: itemRate.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      status: 'Pending',
      staffId: req.dbUser?.id || null,
      staffName: req.dbUser?.name || 'Staff',
      notes: notes || null,
    }).returning();

    await logActivity(req, 'Photo Order Created', 'Orders', `Created photo order ${orderNumber} for ${customerName}`);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating photo order:', error);
    res.status(500).json({ error: 'Failed to create photo order' });
  }
});

apiRouter.put('/orders/photo/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const [updated] = await db.update(photoOrders).set({
      status,
      updatedAt: new Date(),
    }).where(eq(photoOrders.id, orderId)).returning();
    res.json(updated);
  } catch (error) {
    console.error('Error updating photo order:', error);
    res.status(500).json({ error: 'Failed to update photo order' });
  }
});

// -------------------------------------------------------------
// 10. DESIGN SERVICES
// -------------------------------------------------------------
apiRouter.get('/orders/design', async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(designOrders).orderBy(desc(designOrders.createdAt));
    res.json(list);
  } catch (error) {
    console.error('Error fetching design orders:', error);
    res.status(500).json({ error: 'Failed to fetch design orders' });
  }
});

apiRouter.post('/orders/design', async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, customerName, customerMobile, designType, requirements, price, deliveryDate, notes } = req.body;
    const currentYear = new Date().getFullYear();
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(designOrders);
    const orderNumber = `DSN-${currentYear}-${String((countResult[0]?.count || 0) + 1).padStart(4, '0')}`;

    const [newOrder] = await db.insert(designOrders).values({
      orderNumber,
      customerId: customerId ? parseInt(customerId, 10) : null,
      customerName,
      customerMobile: customerMobile || '',
      designType: designType || 'Visiting Card',
      requirements: requirements || 'Design request',
      price: parseFloat(price || '300').toFixed(2),
      status: 'Pending',
      assignedStaffId: req.dbUser?.id || null,
      assignedStaffName: req.dbUser?.name || 'Staff',
      deliveryDate: deliveryDate || null,
      notes: notes || null,
    }).returning();

    await logActivity(req, 'Design Order Created', 'Orders', `Created design order ${orderNumber} for ${customerName}`);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating design order:', error);
    res.status(500).json({ error: 'Failed to create design order' });
  }
});

apiRouter.put('/orders/design/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const [updated] = await db.update(designOrders).set({
      status,
      updatedAt: new Date(),
    }).where(eq(designOrders.id, orderId)).returning();
    res.json(updated);
  } catch (error) {
    console.error('Error updating design order:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// -------------------------------------------------------------
// 11. STUDENT SERVICES
// -------------------------------------------------------------
apiRouter.get('/services/student', async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(studentServices).orderBy(desc(studentServices.createdAt));
    res.json(list);
  } catch (error) {
    console.error('Error fetching student services:', error);
    res.status(500).json({ error: 'Failed to fetch student services' });
  }
});

apiRouter.post('/services/student', async (req: AuthRequest, res: Response) => {
  try {
    const { studentName, contact, institution, serviceType, fee, paidAmount, notes } = req.body;
    const currentYear = new Date().getFullYear();
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(studentServices);
    const orderNumber = `STU-${currentYear}-${String((countResult[0]?.count || 0) + 1).padStart(4, '0')}`;

    const numFee = parseFloat(fee || '200');
    const numPaid = parseFloat(paidAmount || numFee);
    const numDue = Math.max(0, numFee - numPaid);

    const [newStudentService] = await db.insert(studentServices).values({
      orderNumber,
      studentName,
      contact: contact || '',
      institution: institution || 'School/College',
      serviceType: serviceType || 'Entrance Form',
      status: 'Pending',
      fee: numFee.toFixed(2),
      paidAmount: numPaid.toFixed(2),
      dueAmount: numDue.toFixed(2),
      staffId: req.dbUser?.id || null,
      staffName: req.dbUser?.name || 'Staff',
      notes: notes || null,
    }).returning();

    await logActivity(req, 'Student Service Added', 'Orders', `Added student service ${orderNumber} for ${studentName}`);
    res.status(201).json(newStudentService);
  } catch (error) {
    console.error('Error creating student service:', error);
    res.status(500).json({ error: 'Failed to create student service' });
  }
});

apiRouter.put('/services/student/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const [updated] = await db.update(studentServices).set({
      status,
      updatedAt: new Date(),
    }).where(eq(studentServices.id, id)).returning();
    res.json(updated);
  } catch (error) {
    console.error('Error updating student service status:', error);
    res.status(500).json({ error: 'Failed to update student service' });
  }
});

// -------------------------------------------------------------
// 12. EXPENSE MANAGEMENT (Admin/Authorized)
// -------------------------------------------------------------
apiRouter.get('/expenses', async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(expenses).orderBy(desc(expenses.createdAt));
    res.json(list);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

apiRouter.post('/expenses', async (req: AuthRequest, res: Response) => {
  try {
    const { category, description, amount, date, paymentMethod, notes } = req.body;
    if (!category || !description || !amount) {
      return res.status(400).json({ error: 'Category, description and amount are required.' });
    }

    const [newExpense] = await db.insert(expenses).values({
      category,
      description,
      amount: parseFloat(amount).toFixed(2),
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'Cash',
      addedByUserId: req.dbUser?.id || null,
      addedByName: req.dbUser?.name || 'Admin',
      notes: notes || null,
    }).returning();

    await logActivity(req, 'Expense Added', 'Finance', `Recorded expense: ${description} (Rs. ${amount})`);
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// -------------------------------------------------------------
// 13. INVENTORY MANAGEMENT
// -------------------------------------------------------------
apiRouter.get('/inventory', async (req: AuthRequest, res: Response) => {
  try {
    const items = await db.select().from(inventoryItems).orderBy(asc(inventoryItems.category), asc(inventoryItems.itemName));
    const recentTxns = await db.select().from(inventoryTransactions).orderBy(desc(inventoryTransactions.createdAt)).limit(10);
    res.json({ items, recentTransactions: recentTxns });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

apiRouter.post('/inventory', async (req: AuthRequest, res: Response) => {
  try {
    const { itemName, category, currentStock, minStockAlert, unit, costPerUnit, supplier, location, notes } = req.body;
    if (!itemName || !category) {
      return res.status(400).json({ error: 'Item name and category required.' });
    }

    const [newItem] = await db.insert(inventoryItems).values({
      itemName,
      category,
      currentStock: parseInt(currentStock || 0, 10),
      minStockAlert: parseInt(minStockAlert || 10, 10),
      unit: unit || 'pcs',
      costPerUnit: parseFloat(costPerUnit || '0').toFixed(2),
      supplier: supplier || null,
      location: location || null,
      notes: notes || null,
    }).returning();

    await logActivity(req, 'Inventory Item Created', 'Inventory', `Added item ${itemName} to stock`);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Stock In / Out Transaction
apiRouter.post('/inventory/:id/transaction', async (req: AuthRequest, res: Response) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const { type, quantity, unitCost, reason, referenceOrder } = req.body;
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Valid quantity required.' });
    }

    const item = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId)).limit(1);
    if (!item.length) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const currentItem = item[0];
    let newStock = currentItem.currentStock;

    if (type === 'Stock In') {
      newStock += qty;
    } else if (type === 'Stock Out') {
      if (qty > currentItem.currentStock) {
        return res.status(400).json({ error: `Cannot stock out ${qty}. Only ${currentItem.currentStock} in stock.` });
      }
      newStock -= qty;
    } else if (type === 'Adjustment') {
      newStock = qty;
    }

    const cost = parseFloat(unitCost || currentItem.costPerUnit || '0');
    const totalCost = (cost * qty).toFixed(2);

    // 1. Record transaction
    const [txn] = await db.insert(inventoryTransactions).values({
      itemId,
      type: type || 'Stock In',
      quantity: qty,
      unitCost: cost.toFixed(2),
      totalCost,
      reason: reason || 'Routine inventory update',
      referenceOrder: referenceOrder || null,
      performedByUserId: req.dbUser?.id || null,
      performedByName: req.dbUser?.name || 'Staff',
    }).returning();

    // 2. Update current stock in inventory_items
    const [updatedItem] = await db.update(inventoryItems).set({
      currentStock: newStock,
      updatedAt: new Date(),
    }).where(eq(inventoryItems.id, itemId)).returning();

    await logActivity(req, 'Inventory Updated', 'Inventory', `${type} of ${qty} ${currentItem.unit} for ${currentItem.itemName}. New stock: ${newStock}`);
    res.json({ item: updatedItem, transaction: txn });
  } catch (error) {
    console.error('Error recording inventory transaction:', error);
    res.status(500).json({ error: 'Failed to record inventory change' });
  }
});

// -------------------------------------------------------------
// 14. STAFF MANAGEMENT (Admin Only)
// -------------------------------------------------------------
apiRouter.get('/staff', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const staffList = await db.select().from(users).orderBy(desc(users.createdAt));
    res.json(staffList);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff accounts' });
  }
});

apiRouter.post('/staff', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role, phone, permissions } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const uid = `staff-${Date.now()}`;
    const [newStaff] = await db.insert(users).values({
      uid,
      name,
      email,
      role: role || 'staff',
      phone: phone || null,
      status: 'active',
      permissions: permissions || { canCreateBill: true, canManageOrders: true },
    }).returning();

    await logActivity(req, 'Staff Created', 'Staff', `Created new staff account: ${name} (${role})`);
    res.status(201).json(newStaff);
  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).json({ error: 'Failed to add staff member' });
  }
});

apiRouter.put('/staff/:id/status', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const staffId = parseInt(req.params.id, 10);
    const { status, role } = req.body;

    const [updated] = await db.update(users).set({
      status: status !== undefined ? status : undefined,
      role: role !== undefined ? role : undefined,
      updatedAt: new Date(),
    }).where(eq(users.id, staffId)).returning();

    await logActivity(req, 'Staff Updated', 'Staff', `Updated staff ${updated.name} (Status: ${updated.status}, Role: ${updated.role})`);
    res.json(updated);
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

// -------------------------------------------------------------
// 15. REPORTS & FINANCIAL ANALYTICS
// -------------------------------------------------------------
apiRouter.get('/reports', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let allInv = await db.select().from(invoices);
    let allExp = await db.select().from(expenses);
    let allPay = await db.select().from(payments);
    let allRef = await db.select().from(refunds);
    let allItems = await db.select().from(invoiceItems);

    // Apply date range filters if supplied
    if (startDate && typeof startDate === 'string') {
      allInv = allInv.filter(i => new Date(i.createdAt).toISOString().split('T')[0] >= startDate);
      allExp = allExp.filter(e => e.date >= startDate);
      allPay = allPay.filter(p => new Date(p.paymentDate).toISOString().split('T')[0] >= startDate);
    }
    if (endDate && typeof endDate === 'string') {
      allInv = allInv.filter(i => new Date(i.createdAt).toISOString().split('T')[0] <= endDate);
      allExp = allExp.filter(e => e.date <= endDate);
      allPay = allPay.filter(p => new Date(p.paymentDate).toISOString().split('T')[0] <= endDate);
    }

    const validInvoices = allInv.filter(i => i.status !== 'Cancelled');
    const totalSales = validInvoices.reduce((sum, i) => sum + parseFloat(i.grandTotal), 0);
    const totalPaid = validInvoices.reduce((sum, i) => sum + parseFloat(i.paidAmount), 0);
    const totalDue = validInvoices.reduce((sum, i) => sum + parseFloat(i.dueAmount), 0);
    const totalExpenses = allExp.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalRefunds = allRef.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const netProfit = totalSales - totalExpenses - totalRefunds;

    // Payment methods breakdown
    const paymentMethods: Record<string, number> = {};
    validInvoices.forEach(i => {
      const pm = i.paymentMethod || 'Cash';
      paymentMethods[pm] = (paymentMethods[pm] || 0) + parseFloat(i.grandTotal);
    });

    // Service-wise revenue
    const serviceRevenue: Record<string, { category: string; amount: number; count: number }> = {};
    allItems.forEach(item => {
      const name = item.serviceName;
      if (!serviceRevenue[name]) {
        serviceRevenue[name] = { category: item.categoryName, amount: 0, count: 0 };
      }
      serviceRevenue[name].amount += parseFloat(item.netAmount);
      serviceRevenue[name].count += parseFloat(item.quantity);
    });

    // Staff-wise sales
    const staffSales: Record<string, number> = {};
    validInvoices.forEach(i => {
      const sName = i.staffName || 'Staff';
      staffSales[sName] = (staffSales[sName] || 0) + parseFloat(i.grandTotal);
    });

    res.json({
      summary: {
        totalSales,
        totalPaid,
        totalDue,
        totalExpenses,
        totalRefunds,
        netProfit,
        invoiceCount: validInvoices.length,
      },
      paymentMethods,
      serviceRevenue,
      staffSales,
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ error: 'Failed to generate financial report' });
  }
});

// -------------------------------------------------------------
// 16. ACTIVITY LOGS
// -------------------------------------------------------------
apiRouter.get('/activity-logs', async (req: AuthRequest, res: Response) => {
  try {
    const logs = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(100);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// -------------------------------------------------------------
// 17. SETTINGS
// -------------------------------------------------------------
apiRouter.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(shopSettings).where(eq(shopSettings.id, 1)).limit(1);
    if (!list.length) {
      return res.json({
        id: 1,
        shopName: 'DIGI DIGITAL SEWA',
        tagline: 'Complete Cyber Cafe & Online Government Services',
        address: 'New Road, Kathmandu, Nepal',
        phone: '+977-9841234567',
        email: 'contact@digidigitalsewa.com.np',
        panVatNumber: '609876543',
        invoicePrefix: 'DGS',
        invoiceFooter: 'धन्यवाद! फेरी भेटौला। Thank you for choosing Digi Digital Sewa.',
        paperSize: 'A4',
        defaultPaymentMethod: 'Cash',
        enableTax: false,
        taxPercent: '13.00',
        currency: 'NPR',
      });
    }
    res.json(list[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

apiRouter.put('/settings', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      shopName, tagline, address, phone, altPhone, email, panVatNumber,
      invoicePrefix, invoiceFooter, qrCodeUrl, paperSize, defaultPaymentMethod,
      enableTax, taxPercent
    } = req.body;

    const [updated] = await db.update(shopSettings).set({
      shopName,
      tagline,
      address,
      phone,
      altPhone: altPhone || null,
      email,
      panVatNumber: panVatNumber || null,
      invoicePrefix: invoicePrefix || 'DGS',
      invoiceFooter: invoiceFooter || '',
      qrCodeUrl: qrCodeUrl || null,
      paperSize: paperSize || 'A4',
      defaultPaymentMethod: defaultPaymentMethod || 'Cash',
      enableTax: enableTax ?? false,
      taxPercent: taxPercent ? taxPercent.toString() : '13.00',
      updatedAt: new Date(),
    }).where(eq(shopSettings.id, 1)).returning();

    await logActivity(req, 'Settings Updated', 'Settings', 'Shop profile and invoice settings updated by Admin');
    res.json(updated);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// -------------------------------------------------------------
// 18. BACKUP & RESTORE
// -------------------------------------------------------------
apiRouter.get('/backup', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const allUsers = await db.select().from(users);
    const allCust = await db.select().from(customers);
    const allCategories = await db.select().from(serviceCategories);
    const allSrv = await db.select().from(services);
    const allPriceHist = await db.select().from(servicePriceHistory);
    const allInv = await db.select().from(invoices);
    const allItems = await db.select().from(invoiceItems);
    const allPayments = await db.select().from(payments);
    const allRefunds = await db.select().from(refunds);
    const allApps = await db.select().from(applications);
    const allPrints = await db.select().from(printingOrders);
    const allPhotos = await db.select().from(photoOrders);
    const allDesigns = await db.select().from(designOrders);
    const allStudents = await db.select().from(studentServices);
    const allExpenses = await db.select().from(expenses);
    const allInventory = await db.select().from(inventoryItems);
    const allSettings = await db.select().from(shopSettings);

    const backupData = {
      system: 'DIGI DIGITAL SEWA',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        users: allUsers,
        customers: allCust,
        categories: allCategories,
        services: allSrv,
        priceHistory: allPriceHist,
        invoices: allInv,
        invoiceItems: allItems,
        payments: allPayments,
        refunds: allRefunds,
        applications: allApps,
        printingOrders: allPrints,
        photoOrders: allPhotos,
        designOrders: allDesigns,
        studentServices: allStudents,
        expenses: allExpenses,
        inventory: allInventory,
        settings: allSettings,
      }
    };

    await logActivity(req, 'Backup Created', 'System', 'Full database JSON backup generated');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=digi_digital_sewa_backup_${Date.now()}.json`);
    res.json(backupData);
  } catch (error) {
    console.error('Error generating backup:', error);
    res.status(500).json({ error: 'Failed to generate database backup' });
  }
});
