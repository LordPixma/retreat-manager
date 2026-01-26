// Type definitions for retreat-manager Cloudflare Workers

// Cloudflare Environment bindings
export interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  ADMIN_USER?: string;
  ADMIN_PASS?: string;
  PORTAL_URL?: string;
  RETREAT_NAME?: string;
  JWT_SECRET?: string; // Secret key for signing tokens (required for production)
  ADMIN_JWT_SECRET?: string; // Alternative secret key (for backward compatibility)
}

// Context type for Pages Functions
export interface PagesContext<P = Record<string, string>, D = Record<string, unknown>> {
  request: Request;
  env: Env;
  params: P;
  next: () => Promise<Response>;
  data: D;
  waitUntil: (promise: Promise<unknown>) => void;
}

// Database Models
export interface Attendee {
  id: number;
  ref_number: string;
  name: string;
  email: string | null;
  password_hash: string;
  phone?: string | null;
  emergency_contact?: string | null;
  dietary_requirements?: string | null;
  room_id: number | null;
  group_id: number | null;
  payment_due: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  check_in_date?: string | null;
  check_out_date?: string | null;
  special_requests?: string | null;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
}

export interface Room {
  id: number;
  number: string;
  description: string | null;
  capacity: number;
  floor?: string | null;
  room_type: 'single' | 'double' | 'suite' | 'family' | 'standard';
  amenities?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string | null;
  max_members?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'event' | 'reminder';
  priority: number;
  is_active: number | boolean;
  target_audience: 'all' | 'vip' | 'groups';
  target_groups?: string | null;
  author_name: string;
  starts_at?: string | null;
  expires_at?: string | null;
  email_sent?: number;
  email_sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginHistory {
  id: number;
  user_type: 'attendee' | 'admin';
  user_id: string;
  login_time: string;
}

// Auth Types
export interface AdminAuth {
  user: string;
  role: string;
}

export interface AttendeeAuth {
  ref: string;
}

// API Response Types
export interface ApiSuccessResponse<T = unknown> {
  data?: T;
  success?: boolean;
  message?: string;
  id?: number;
  pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: {
    fields?: Record<string, string>;
    requestId?: string;
    [key: string]: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Pagination Types
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Request Body Types
export interface AttendeeCreateRequest {
  name: string;
  ref_number: string;
  password: string;
  email?: string;
  phone?: string;
  room_id?: number | null;
  group_id?: number | null;
  payment_due?: number;
  payment_status?: 'pending' | 'partial' | 'paid' | 'overdue';
}

export interface AttendeeUpdateRequest {
  name?: string;
  ref_number?: string;
  email?: string;
  phone?: string;
  room_id?: number | null;
  group_id?: number | null;
  payment_due?: number;
  payment_status?: 'pending' | 'partial' | 'paid' | 'overdue';
  password?: string;
}

export interface RoomCreateRequest {
  number: string;
  description?: string;
  capacity?: number;
  floor?: string;
  room_type?: string;
}

export interface GroupCreateRequest {
  name: string;
  description?: string;
  max_members?: number;
}

export interface AnnouncementCreateRequest {
  title: string;
  content: string;
  type?: 'general' | 'urgent' | 'event' | 'reminder';
  priority?: number;
  is_active?: boolean;
  target_audience?: 'all' | 'vip' | 'groups';
  target_groups?: string[];
  author_name?: string;
  starts_at?: string;
  expires_at?: string;
}

export interface EmailSendRequest {
  subject: string;
  message: string;
  target_audience?: 'all' | 'vip' | 'groups';
  target_groups?: number[];
  attendee_ids?: number[];
  email_type?: 'announcement' | 'urgent' | 'welcome' | 'payment' | 'reminder';
}

export interface LoginRequest {
  ref: string;
  password: string;
}

export interface AdminLoginRequest {
  user: string;
  pass: string;
}

// Database query result types
export interface AttendeeWithRelations extends Attendee {
  room_number?: string;
  room_description?: string;
  group_name?: string;
}

export interface RoomWithOccupancy extends Room {
  occupant_count: number;
  occupants: string;
}

export interface GroupWithMembers extends Group {
  member_count: number;
  member_names: string;
  member_refs: string;
}
