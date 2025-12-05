import { z } from "zod";

// Add queue form schema
export const addQueueSchema = z.object({
  name: z.string().min(1, "Queue name is required"),
  durable: z.boolean().default(true),
  autoDelete: z.boolean().default(false),
  exclusive: z.boolean().default(false),
  maxLength: z.string().optional(),
  messageTtl: z.string().optional(),
  bindToExchange: z.string().optional(),
  routingKey: z.string().optional(),
});

export type AddQueueFormData = z.infer<typeof addQueueSchema>;
