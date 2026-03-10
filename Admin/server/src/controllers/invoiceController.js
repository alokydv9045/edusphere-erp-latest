const prisma = require('../config/database');

const getAllInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      subscriptionId
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (subscriptionId) {
      where.subscriptionId = subscriptionId;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            include: {
              school: {
                select: {
                  id: true,
                  name: true,
                  schoolCode: true
                }
              }
            }
          }
        }
      }),
      prisma.invoice.count({ where })
    ]);

    // Transform data
    const transformedInvoices = invoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      subscriptionId: inv.subscriptionId,
      subscription: {
        id: inv.subscription.id,
        school: inv.subscription.school
      },
      amount: inv.amount,
      currency: inv.currency,
      tax: inv.tax,
      totalAmount: inv.totalAmount,
      billingPeriodStart: inv.billingPeriodStart.toISOString(),
      billingPeriodEnd: inv.billingPeriodEnd.toISOString(),
      status: inv.status,
      paymentMethod: inv.paymentMethod,
      paymentDate: inv.paymentDate?.toISOString(),
      transactionId: inv.transactionId,
      invoicePdfUrl: inv.invoicePdfUrl,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
      dueDate: inv.dueDate.toISOString()
    }));

    res.json({
      invoices: transformedInvoices,
      total
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                schoolCode: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      subscriptionId: invoice.subscriptionId,
      subscription: {
        id: invoice.subscription.id,
        school: invoice.subscription.school
      },
      amount: invoice.amount,
      currency: invoice.currency,
      tax: invoice.tax,
      totalAmount: invoice.totalAmount,
      billingPeriodStart: invoice.billingPeriodStart.toISOString(),
      billingPeriodEnd: invoice.billingPeriodEnd.toISOString(),
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      paymentDate: invoice.paymentDate?.toISOString(),
      transactionId: invoice.transactionId,
      invoicePdfUrl: invoice.invoicePdfUrl,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      dueDate: invoice.dueDate.toISOString()
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

const createInvoice = async (req, res) => {
  try {
    const {
      subscriptionId,
      amount,
      tax,
      totalAmount,
      billingPeriodStart,
      billingPeriodEnd,
      dueDate
    } = req.body;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        subscriptionId,
        amount,
        tax: tax || 0,
        totalAmount,
        billingPeriodStart: new Date(billingPeriodStart),
        billingPeriodEnd: new Date(billingPeriodEnd),
        dueDate: new Date(dueDate)
      },
      include: {
        subscription: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                schoolCode: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      subscriptionId: invoice.subscriptionId,
      subscription: {
        id: invoice.subscription.id,
        school: invoice.subscription.school
      },
      amount: invoice.amount,
      currency: invoice.currency,
      tax: invoice.tax,
      totalAmount: invoice.totalAmount,
      billingPeriodStart: invoice.billingPeriodStart.toISOString(),
      billingPeriodEnd: invoice.billingPeriodEnd.toISOString(),
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      paymentDate: invoice.paymentDate?.toISOString(),
      transactionId: invoice.transactionId,
      invoicePdfUrl: invoice.invoicePdfUrl,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      dueDate: invoice.dueDate.toISOString()
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      paymentMethod,
      paymentDate,
      transactionId
    } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        transactionId
      },
      include: {
        subscription: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                schoolCode: true
              }
            }
          }
        }
      }
    });

    res.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      subscriptionId: invoice.subscriptionId,
      subscription: {
        id: invoice.subscription.id,
        school: invoice.subscription.school
      },
      amount: invoice.amount,
      currency: invoice.currency,
      tax: invoice.tax,
      totalAmount: invoice.totalAmount,
      billingPeriodStart: invoice.billingPeriodStart.toISOString(),
      billingPeriodEnd: invoice.billingPeriodEnd.toISOString(),
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      paymentDate: invoice.paymentDate?.toISOString(),
      transactionId: invoice.transactionId,
      invoicePdfUrl: invoice.invoicePdfUrl,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      dueDate: invoice.dueDate.toISOString()
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Invoice not found' });
    } else {
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice
};