const { createFeeStructureSchema, createFeePaymentSchema } = require('../src/validators/feeValidator');

describe('Fee Management Validation & Business Logic Tests', () => {
  test('Should validate fee structure creation schema correctly', () => {
    const valid = createFeeStructureSchema.safeParse({
      name: 'Tuition Fee 2026',
      academicYearId: '123e4567-e89b-12d3-a456-426614174000',
      frequency: 'MONTHLY',
      feeHeads: [{ headName: 'TUITION', amount: 5000 }],
    });
    expect(valid.success).toBe(true);

    const invalidAmount = createFeeStructureSchema.safeParse({
      name: 'Invalid Fee',
      academicYearId: '123e4567-e89b-12d3-a456-426614174000',
      frequency: 'MONTHLY',
      feeHeads: [{ headName: 'TUITION', amount: -100 }], // Negative amount not allowed
    });
    expect(invalidAmount.success).toBe(false);
  });

  test('Should validate fee payment execution schema accurately', () => {
    const validPayment = createFeePaymentSchema.safeParse({
      studentId: '123e4567-e89b-12d3-a456-426614174001',
      ledgerId: '123e4567-e89b-12d3-a456-426614174002',
      amount: 2500,
      paymentMode: 'CASH',
    });
    expect(validPayment.success).toBe(true);

    const invalidPayment = createFeePaymentSchema.safeParse({
      studentId: 'invalid-uuid',
      ledgerId: '123e4567-e89b-12d3-a456-426614174002',
      amount: 0,
      paymentMode: 'INVALID_MODE',
    });
    expect(invalidPayment.success).toBe(false);
  });
});
