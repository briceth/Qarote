import { z } from 'zod';

// Schema for RabbitMQ server credentials
export const RabbitMQCredentialsSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().positive().default(15672),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  vhost: z.string().default('/')
});

// Schema for creating a new RabbitMQ server
export const CreateServerSchema = z.object({
  name: z.string().min(1, 'Server name is required'),
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().positive().default(15672),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  vhost: z.string().default('/')
});

// Schema for updating a RabbitMQ server
export const UpdateServerSchema = CreateServerSchema.partial();

export type RabbitMQCredentials = z.infer<typeof RabbitMQCredentialsSchema>;
export type CreateServerInput = z.infer<typeof CreateServerSchema>;
export type UpdateServerInput = z.infer<typeof UpdateServerSchema>;