import { z } from 'zod';

// Schema for creating an alert
export const CreateAlertSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['info', 'warning', 'error']).default('info'),
  status: z.enum(['active', 'acknowledged', 'resolved']).default('active')
});

// Schema for updating an alert
export const UpdateAlertSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  severity: z.enum(['info', 'warning', 'error']).optional(),
  status: z.enum(['active', 'acknowledged', 'resolved']).optional(),
  resolvedAt: z.date().nullable().optional()
});

export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;
export type UpdateAlertInput = z.infer<typeof UpdateAlertSchema>;