import { z } from "zod";

/**
 * Schema for Discourse SSO user data
 */
export const DiscourseSSOUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  email: z.string().email("Valid email is required"),
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  avatar_url: z.string().url("Avatar URL must be valid").optional(),
});

/**
 * Schema for SSO callback query parameters
 */
export const DiscourseSSOCallbackSchema = z.object({
  sso: z.string().min(1, "SSO parameter is required"),
  sig: z.string().min(1, "Signature parameter is required"),
});

/**
 * Schema for embed URL query parameters
 */
export const DiscourseEmbedSchema = z.object({
  topic: z.string().optional(),
  category: z.string().optional(),
});

/**
 * Type exports
 */
export type DiscourseSSOUser = z.infer<typeof DiscourseSSOUserSchema>;
export type DiscourseSSOCallback = z.infer<typeof DiscourseSSOCallbackSchema>;
export type DiscourseEmbed = z.infer<typeof DiscourseEmbedSchema>;
