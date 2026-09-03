import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  businessName: z.string().trim().min(1, 'Business name is required').max(150),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z.string().trim().min(5, 'Enter a valid phone number').max(30),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export const businessSchema = z.object({
  businessName: z.string().trim().min(1).max(150),
  tradingName: z.string().trim().max(150).optional().nullable(),
  website: z.string().trim().max(200).optional().nullable(),
  industry: z.string().trim().max(100).optional().nullable(),
  businessDescription: z.string().trim().max(4000).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  employeeCount: z.string().trim().max(50).optional().nullable(),
  serviceArea: z.string().trim().max(200).optional().nullable(),
  businessStage: z.string().trim().max(100).optional().nullable(),
  mainContactName: z.string().trim().max(150).optional().nullable(),
  mainContactEmail: z.string().trim().max(150).optional().nullable(),
  mainContactPhone: z.string().trim().max(50).optional().nullable(),
});

export const intakeSchema = z.object({
  businessGoals: z.string().trim().max(4000).optional().nullable(),
  marketingObjectives: z.string().trim().max(4000).optional().nullable(),
  targetCustomers: z.string().trim().max(4000).optional().nullable(),
  currentMarketingActivity: z.string().trim().max(4000).optional().nullable(),
  marketingChallenges: z.string().trim().max(4000).optional().nullable(),
  competitors: z.string().trim().max(2000).optional().nullable(),
  growthTargets: z.string().trim().max(2000).optional().nullable(),
  extendedData: z.record(z.any()).optional(),
});

export const ticketCreateSchema = z.object({
  subject: z.string().trim().min(3, 'Subject is required').max(200),
  category: z.enum([
    'GENERAL_QUESTION',
    'ACCOUNT_SUPPORT',
    'ONBOARDING_SUPPORT',
    'DOCUMENT_UPLOAD',
    'MARKETING_SERVICES',
    'TECHNICAL_ISSUE',
    'OTHER',
  ]),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  description: z.string().trim().min(10, 'Please provide a bit more detail').max(5000),
  urgentJustification: z.string().trim().max(1000).optional().nullable(),
});

export const ticketMessageSchema = z.object({
  message: z.string().trim().min(1).max(5000),
});
