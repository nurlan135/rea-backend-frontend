import { z } from 'zod';

// Login form validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email tələb olunur')
    .email('Düzgün email daxil edin')
    .max(255, 'Email həddindən çox uzundur')
    .transform(email => email.toLowerCase().trim()),
    
  password: z
    .string()
    .min(1, 'Parol tələb olunur')
    .min(6, 'Parol ən azı 6 simvol olmalıdır')
    .max(128, 'Parol həddindən çox uzundur'),
    
  remember_me: z
    .boolean()
    .optional()
    .default(false)
});

// Password strength validation (for future use)
export const passwordStrengthSchema = z
  .string()
  .min(8, 'Parol ən azı 8 simvol olmalıdır')
  .max(128, 'Parol həddindən çox uzundur')
  .regex(/[A-Z]/, 'Parolda ən azı bir böyük hərf olmalıdır')
  .regex(/[a-z]/, 'Parolda ən azı bir kiçik hərf olmalıdır')
  .regex(/[0-9]/, 'Parolda ən azı bir rəqəm olmalıdır')
  .refine(
    (password) => !/\s/.test(password),
    'Parolda boşluq ola bilməz'
  );

// User profile validation schema
export const userProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Ad tələb olunur')
    .max(100, 'Ad həddindən çox uzundur')
    .regex(/^[a-zA-ZəöüçşığıƏÖÜÇŞIĞI\s]+$/, 'Adda yalnız hərflər və boşluq ola bilər'),
    
  lastName: z
    .string()
    .min(1, 'Soyad tələb olunur')
    .max(100, 'Soyad həddindən çox uzundur')
    .regex(/^[a-zA-ZəöüçşığıƏÖÜÇŞIĞI\s]+$/, 'Soyadda yalnız hərflər və boşluq ola bilər'),
    
  fatherName: z
    .string()
    .max(100, 'Ata adı həddindən çox uzundur')
    .regex(/^[a-zA-ZəöüçşığıƏÖÜÇŞIĞI\s]*$/, 'Ata adında yalnız hərflər və boşluq ola bilər')
    .optional(),
    
  phone: z
    .string()
    .regex(/^[\+]?[0-9\s\-\(\)]{10,20}$/, 'Düzgün telefon nömrəsi daxil edin')
    .optional(),
    
  email: z
    .string()
    .email('Düzgün email daxil edin')
    .max(255, 'Email həddindən çox uzundur')
});

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Mövcud parol tələb olunur'),
    
  newPassword: passwordStrengthSchema,
  
  confirmPassword: z
    .string()
    .min(1, 'Parol təsdiqləməsi tələb olunur')
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Parollar uyğun gəlmir',
    path: ['confirmPassword']
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'Yeni parol mövcud paroldan fərqli olmalıdır',
    path: ['newPassword']
  }
);

// Forgot password validation schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email tələb olunur')
    .email('Düzgün email daxil edin')
    .max(255, 'Email həddindən çox uzundur')
    .transform(email => email.toLowerCase().trim())
});

// Reset password validation schema
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Sıfırlama tokeni tələb olunur'),
    
  newPassword: passwordStrengthSchema,
  
  confirmPassword: z
    .string()
    .min(1, 'Parol təsdiqləməsi tələb olunur')
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Parollar uyğun gəlmir',
    path: ['confirmPassword']
  }
);

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type UserProfileData = z.infer<typeof userProfileSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

// Helper function to format Zod errors for display
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (path) {
      formattedErrors[path] = err.message;
    }
  });
  
  return formattedErrors;
}

// Helper function to check password strength
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Ən azı 8 simvol');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Böyük hərf');
  }
  
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Kiçik hərf');
  }
  
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Rəqəm');
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
    if (feedback.length === 0) feedback.push('Çox güclü!');
  } else if (score === 4) {
    feedback.push('Xüsusi simvol əlavə edin');
  }
  
  const isStrong = score >= 4;
  
  return {
    score,
    feedback: feedback.length > 0 ? feedback : ['Güclü parol'],
    isStrong
  };
}

// Email validation helper
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

// Phone validation helper for Azerbaijan numbers
export function validateAzerbaijanPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check for Azerbaijan phone number patterns
  // Mobile: +994 50/51/55/70/77/99 XXX XX XX
  // Landline: +994 12 XXX XX XX (Baku)
  const patterns = [
    /^994(50|51|55|70|77|99)\d{7}$/, // Mobile with country code
    /^(50|51|55|70|77|99)\d{7}$/, // Mobile without country code
    /^99412\d{7}$/, // Baku landline with country code
    /^012\d{7}$/ // Baku landline without country code
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>\"']/g, '') // Remove HTML characters
    .substring(0, 1000); // Limit length
}