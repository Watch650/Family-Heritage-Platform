import { User } from "@prisma/client";

// Extended session type for NextAuth
export interface ExtendedSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

// Auth service response types
export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: User;
}

// Login credentials type
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data type
export interface RegistrationData extends LoginCredentials {
  name: string;
}
