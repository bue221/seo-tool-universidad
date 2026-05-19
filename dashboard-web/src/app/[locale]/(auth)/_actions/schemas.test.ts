import { describe, expect, it } from 'vitest';
import {
  forgotPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from './schemas';

describe('auth action schemas', () => {
  it('validates sign in payload', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: '12345678' }).success).toBe(true);
    expect(signInSchema.safeParse({ email: 'bad', password: '123' }).success).toBe(false);
  });

  it('validates sign up payload', () => {
    expect(
      signUpSchema.safeParse({ email: 'a@b.com', password: '12345678', displayName: 'Ada' }).success,
    ).toBe(true);
  });

  it('validates forgot password payload', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });

  it('requires password confirmation match', () => {
    expect(
      updatePasswordSchema.safeParse({ password: '12345678', confirmPassword: '12345678' }).success,
    ).toBe(true);
    expect(
      updatePasswordSchema.safeParse({ password: '12345678', confirmPassword: '87654321' }).success,
    ).toBe(false);
  });
});
