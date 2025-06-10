import { z } from 'zod';

// Schema for creating a company
export const CreateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  contactEmail: z.string().email('Invalid email address').optional(),
  logoUrl: z.string().url('Invalid URL').optional(),
  planType: z.enum(['FREE', 'PREMIUM', 'ENTERPRISE']).default('FREE'),
});

// Schema for updating a company
export const UpdateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').optional(),
  contactEmail: z.string().email('Invalid email address').optional(),
  logoUrl: z.string().url('Invalid URL').optional(),
  planType: z.enum(['FREE', 'PREMIUM', 'ENTERPRISE']).optional(),
});

// Types derived from schemas
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;