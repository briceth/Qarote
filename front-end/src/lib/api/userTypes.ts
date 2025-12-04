export interface RabbitMQUser {
  name: string;
  password_hash?: string;
  hashing_algorithm?: string;
  tags?: string[];
  /**
   * User limits (optional, only present when limits are configured)
   */
  limits?: {
    max_connections?: number;
    max_channels?: number;
  };
  accessibleVhosts?: string[];
}

export interface RabbitMQUserPermission {
  user: string;
  vhost: string;
  configure: string;
  write: string;
  read: string;
}

export interface CreateUserRequest {
  username: string;
  password?: string;
  tags?: string;
}

export interface UpdateUserRequest {
  password?: string;
  tags?: string;
  removePassword?: boolean;
}

export interface SetUserPermissionRequest {
  vhost: string;
  configure: string;
  write: string;
  read: string;
}

export interface UserDetailsResponse {
  user: RabbitMQUser;
  permissions: RabbitMQUserPermission[];
}
