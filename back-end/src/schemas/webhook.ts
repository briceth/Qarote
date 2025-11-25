import { z } from "zod";

/**
 * Schema for creating a webhook
 */
export const CreateWebhookSchema = z.object({
  url: z.string().url("Invalid webhook URL"),
  enabled: z.boolean().optional().default(true),
  secret: z.string().optional().nullable(),
  version: z.string().optional().default("v1"),
});

/**
 * Schema for updating a webhook
 */
export const UpdateWebhookSchema = z.object({
  url: z.string().url("Invalid webhook URL").optional(),
  enabled: z.boolean().optional(),
  secret: z.string().optional().nullable(),
  version: z.string().optional(),
});

/**
 * Schema for webhook response
 */
export const WebhookResponseSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  url: z.string(),
  enabled: z.boolean(),
  secret: z.string().nullable(),
  version: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateWebhook = z.infer<typeof CreateWebhookSchema>;
export type UpdateWebhook = z.infer<typeof UpdateWebhookSchema>;
export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;

