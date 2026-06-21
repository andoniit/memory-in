// ─────────────────────────────────────────────────────────────
// MemoryPin shared types
//
// `Database` is a hand-written subset matching supabase/migrations/001_initial.sql.
// Row types MUST be `type` aliases (not `interface`) — supabase-js's GenericTable
// constraint requires Record<string, unknown>, which interfaces don't satisfy;
// using interfaces silently degrades every query to `never`.
// ─────────────────────────────────────────────────────────────

export type MemoryType = "photo" | "video" | "note";

export const MAX_CIRCLE_MEMBERS = 4;

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Circle = {
  id: string;
  owner_id: string;
  name: string | null;
  invite_code: string;
  created_at: string;
};

export type CircleMember = {
  circle_id: string;
  user_id: string;
  joined_at: string;
};

export type Pin = {
  id: string;
  circle_id: string | null;
  created_by: string | null;
  title: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  emoji: string;
  visit_date: string | null;
  story: string | null;
  is_public: boolean;
  view_count: number;
  cover_memory_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Memory = {
  id: string;
  pin_id: string;
  uploaded_by: string | null;
  type: MemoryType;
  cloudinary_id: string | null;
  url: string | null;
  thumb_url: string | null;
  caption: string | null;
  taken_at: string | null;
  width: number | null;
  height: number | null;
  duration_secs: number | null;
  sort_order: number;
  created_at: string;
};

// Generic row helper: Insert = optional server-defaulted fields.
type Insert<T, Optional extends keyof T> = Omit<T, Optional> &
  Partial<Pick<T, Optional>>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Insert<Profile, "created_at" | "display_name" | "avatar_url">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      circles: {
        Row: Circle;
        Insert: Insert<Circle, "id" | "invite_code" | "created_at" | "name">;
        Update: Partial<Circle>;
        Relationships: [];
      };
      circle_members: {
        Row: CircleMember;
        Insert: Insert<CircleMember, "joined_at">;
        Update: Partial<CircleMember>;
        Relationships: [];
      };
      pins: {
        Row: Pin;
        Insert: Insert<
          Pin,
          | "emoji"
          | "story"
          | "is_public"
          | "view_count"
          | "cover_memory_id"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<Pin>;
        Relationships: [];
      };
      memories: {
        Row: Memory;
        Insert: Insert<
          Memory,
          | "id"
          | "sort_order"
          | "created_at"
          | "url"
          | "thumb_url"
          | "caption"
          | "taken_at"
          | "width"
          | "height"
          | "duration_secs"
          | "cloudinary_id"
        >;
        Update: Partial<Memory>;
        Relationships: [];
      };
      pin_views: {
        Row: { id: number; pin_id: string | null; viewed_at: string };
        Insert: { pin_id: string };
        Update: Partial<{ id: number; pin_id: string | null; viewed_at: string }>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      user_in_circle: { Args: { c_id: string }; Returns: boolean };
      shares_circle: { Args: { other_id: string }; Returns: boolean };
      join_circle: { Args: { p_code: string }; Returns: string };
      increment_pin_view: { Args: { p_id: string }; Returns: undefined };
    };
    Enums: {
      memory_type: MemoryType;
    };
    CompositeTypes: Record<never, never>;
  };
}

// ── API payloads ──────────────────────────────────────────────
export interface CreatePinInput {
  title: string;
  city: string;
  lat: number;
  lng: number;
  emoji: string;
  visit_date: string; // ISO date
  is_public: boolean;
}

export interface CreateMemoryInput {
  pin_id: string;
  type: MemoryType;
  cloudinary_id?: string;
  caption?: string;
  taken_at?: string;
  width?: number;
  height?: number;
  duration_secs?: number;
}

// A pin enriched with its memories + cover, for list/detail views.
export interface PinWithMemories extends Pin {
  memories: Memory[];
  cover?: Memory;
  memory_count: number;
}

// A circle member enriched with their display name.
export interface CircleMemberView {
  user_id: string;
  display_name: string | null;
  is_owner: boolean;
  is_self: boolean;
}
