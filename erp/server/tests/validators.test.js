/**
 * TEST-2: Validator schema tests for all new Zod validators
 * Ensures all input validation schemas correctly accept valid data and reject invalid data.
 */

const { createItemSchema, stockMovementSchema } = require('../src/validators/inventoryValidator');
const { issueBookSchema, addBookSchema } = require('../src/validators/libraryValidator');
const { createEmployeeSchema, leaveRequestSchema, processLeaveSchema } = require('../src/validators/hrValidator');
const { bulkSendSchema, createTemplateSchema } = require('../src/validators/notificationValidator');
const { createOrderSchema, verifyPaymentSchema } = require('../src/validators/paymentValidator');
const { createAnnouncementSchema } = require('../src/validators/announcementValidator');
const { createSlotSchema } = require('../src/validators/timetableValidator');
const { generateReportCardSchema, templateSchema } = require('../src/validators/reportCardValidator');
const { createScannerSchema } = require('../src/validators/scannerValidator');
const { generatePayrollSchema } = require('../src/validators/payrollValidator');
const { createEventSchema } = require('../src/validators/calendarValidator');

describe('Inventory Validator', () => {
  test('accepts valid item', () => {
    const result = createItemSchema.safeParse({ name: 'Whiteboard Marker', category: 'Stationery', quantity: 100 });
    expect(result.success).toBe(true);
  });

  test('rejects item without name', () => {
    const result = createItemSchema.safeParse({ category: 'Stationery', quantity: 10 });
    expect(result.success).toBe(false);
  });

  test('accepts valid stock movement', () => {
    const result = stockMovementSchema.safeParse({ itemId: 'item-1', type: 'IN', quantity: 50 });
    expect(result.success).toBe(true);
  });

  test('rejects stock movement with invalid type', () => {
    const result = stockMovementSchema.safeParse({ itemId: 'item-1', type: 'INVALID', quantity: 5 });
    expect(result.success).toBe(false);
  });
});

describe('Library Validator', () => {
  test('accepts valid book issue', () => {
    const result = issueBookSchema.safeParse({ bookId: 'b1', studentId: 's1', dueDate: '2026-06-01' });
    expect(result.success).toBe(true);
  });

  test('rejects book issue without dueDate', () => {
    const result = issueBookSchema.safeParse({ bookId: 'b1', studentId: 's1' });
    expect(result.success).toBe(false);
  });

  test('accepts valid book', () => {
    const result = addBookSchema.safeParse({ title: 'Mathematics', author: 'R.D. Sharma' });
    expect(result.success).toBe(true);
  });
});

describe('HR Validator', () => {
  test('accepts valid employee', () => {
    const result = createEmployeeSchema.safeParse({ email: 'john@school.com', firstName: 'John', lastName: 'Doe' });
    expect(result.success).toBe(true);
  });

  test('rejects invalid email', () => {
    const result = createEmployeeSchema.safeParse({ email: 'not-email', firstName: 'John', lastName: 'Doe' });
    expect(result.success).toBe(false);
  });

  test('accepts valid leave request', () => {
    const result = leaveRequestSchema.safeParse({ startDate: '2026-06-01', endDate: '2026-06-03', leaveType: 'CL' });
    expect(result.success).toBe(true);
  });

  test('accepts valid process leave', () => {
    const result = processLeaveSchema.safeParse({ status: 'APPROVED' });
    expect(result.success).toBe(true);
  });

  test('rejects invalid leave process status', () => {
    const result = processLeaveSchema.safeParse({ status: 'MAYBE' });
    expect(result.success).toBe(false);
  });
});

describe('Notification Validator', () => {
  test('accepts valid bulk send', () => {
    const result = bulkSendSchema.safeParse({ target: 'ALL_STUDENTS', message: 'School closed tomorrow' });
    expect(result.success).toBe(true);
  });

  test('rejects bulk send with invalid target', () => {
    const result = bulkSendSchema.safeParse({ target: 'EVERYONE', message: 'Test' });
    expect(result.success).toBe(false);
  });

  test('accepts valid template', () => {
    const result = createTemplateSchema.safeParse({ templateName: 'Welcome', templateType: 'SMS', messageBody: 'Hello {{name}}' });
    expect(result.success).toBe(true);
  });
});

describe('Payment Validator', () => {
  test('accepts valid order', () => {
    const result = createOrderSchema.safeParse({ studentId: 's1', amount: 5000 });
    expect(result.success).toBe(true);
  });

  test('rejects negative amount', () => {
    const result = createOrderSchema.safeParse({ studentId: 's1', amount: -100 });
    expect(result.success).toBe(false);
  });

  test('accepts valid payment verification', () => {
    const result = verifyPaymentSchema.safeParse({
      razorpay_order_id: 'order_123',
      razorpay_payment_id: 'pay_123',
      razorpay_signature: 'sig_abc'
    });
    expect(result.success).toBe(true);
  });
});

describe('Announcement Validator', () => {
  test('accepts valid announcement', () => {
    const result = createAnnouncementSchema.safeParse({ title: 'Holiday Notice', content: 'School is closed on Monday' });
    expect(result.success).toBe(true);
  });

  test('rejects announcement without title', () => {
    const result = createAnnouncementSchema.safeParse({ content: 'Missing title' });
    expect(result.success).toBe(false);
  });
});

describe('Timetable Validator', () => {
  test('accepts valid slot', () => {
    const result = createSlotSchema.safeParse({
      classId: 'c1', sectionId: 's1', subjectId: 'sub1', teacherId: 't1',
      dayOfWeek: 1, startTime: '09:00', endTime: '10:00'
    });
    expect(result.success).toBe(true);
  });

  test('rejects invalid dayOfWeek', () => {
    const result = createSlotSchema.safeParse({
      classId: 'c1', sectionId: 's1', subjectId: 'sub1', teacherId: 't1',
      dayOfWeek: 8, startTime: '09:00', endTime: '10:00'
    });
    expect(result.success).toBe(false);
  });
});

describe('Report Card Validator', () => {
  test('accepts valid generation params', () => {
    const result = generateReportCardSchema.safeParse({ examId: 'e1', studentIds: ['s1', 's2'] });
    expect(result.success).toBe(true);
  });

  test('rejects empty student list', () => {
    const result = generateReportCardSchema.safeParse({ examId: 'e1', studentIds: [] });
    expect(result.success).toBe(false);
  });

  test('accepts valid template', () => {
    const result = templateSchema.safeParse({ name: 'Default Template' });
    expect(result.success).toBe(true);
  });
});

describe('Scanner Validator', () => {
  test('accepts valid scanner', () => {
    const result = createScannerSchema.safeParse({ name: 'Main Gate', allowedRoles: ['TEACHER', 'STAFF'] });
    expect(result.success).toBe(true);
  });

  test('rejects scanner without roles', () => {
    const result = createScannerSchema.safeParse({ name: 'Main Gate', allowedRoles: [] });
    expect(result.success).toBe(false);
  });
});

describe('Payroll Validator', () => {
  test('accepts valid payroll generation', () => {
    const result = generatePayrollSchema.safeParse({ month: 5, year: 2026 });
    expect(result.success).toBe(true);
  });

  test('rejects invalid month', () => {
    const result = generatePayrollSchema.safeParse({ month: 13, year: 2026 });
    expect(result.success).toBe(false);
  });
});

describe('Calendar Validator', () => {
  test('accepts valid event', () => {
    const result = createEventSchema.safeParse({ title: 'Annual Day', startDate: '2026-12-15' });
    expect(result.success).toBe(true);
  });

  test('rejects event without title', () => {
    const result = createEventSchema.safeParse({ startDate: '2026-12-15' });
    expect(result.success).toBe(false);
  });
});
