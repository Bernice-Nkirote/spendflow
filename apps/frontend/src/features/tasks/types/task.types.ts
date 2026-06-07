export type TaskItem = {
  id: string;
  type: string;
  reference: string;
  message: string;
  url: string;
  created_at?: string | null;
};

export type MyTasksResponse = {
  rows: TaskItem[];
  total_count: number;
};
