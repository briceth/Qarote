import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface Server {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost: string;
  sslEnabled?: boolean | null;
  sslVerifyPeer?: boolean | null;
  sslCaCertPath?: string | null;
  sslClientCertPath?: string | null;
  sslClientKeyPath?: string | null;
}

export { prisma };
