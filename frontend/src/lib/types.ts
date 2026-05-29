// Shared API types mirroring the backend Pydantic schemas.

export type Priority = "low" | "medium" | "high";
export type BoardRole = "owner" | "editor" | "viewer";

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface BoardSummary {
  id: number;
  name: string;
  description: string | null;
  color: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  role: BoardRole | null;
  task_count: number;
}

export interface BoardMember {
  user: User;
  role: BoardRole;
}

export interface BoardDetail extends BoardSummary {
  members: BoardMember[];
}

export interface Label {
  id: number;
  board_id: number;
  name: string;
  color: string;
}

export interface Task {
  id: number;
  column_id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  position: number;
  created_at: string;
  updated_at: string;
  labels: Label[];
}

export interface Column {
  id: number;
  board_id: number;
  name: string;
  position: number;
}

export interface ColumnWithTasks extends Column {
  tasks: Task[];
}

export interface BoardSnapshot {
  board_id: number;
  columns: ColumnWithTasks[];
}

export interface ActivityEntry {
  id: number;
  board_id: number;
  action_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  user: User | null;
  message: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

export interface PresenceUser {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

// WebSocket message envelope from the server.
export type WsMessage =
  | { type: "presence"; data: { viewers: PresenceUser[] } }
  | { type: "activity"; data: ActivityEntry }
  | { type: "task.created"; data: Task; actor_id: number }
  | { type: "task.updated"; data: Task; actor_id: number }
  | { type: "task.deleted"; data: { id: number }; actor_id: number }
  | {
      type: "task.moved";
      data: { id: number; column_id: number; position: number };
      actor_id: number;
    }
  | { type: "column.created"; data: Column; actor_id: number }
  | { type: "column.updated"; data: Column; actor_id: number }
  | { type: "column.deleted"; data: { id: number }; actor_id: number }
  | { type: "column.reordered"; data: { column_ids: number[] }; actor_id: number }
  | { type: "board.updated"; data: Partial<BoardSummary>; actor_id: number }
  | { type: "pong" };
