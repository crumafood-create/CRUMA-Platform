export type ThreadStatus =
  | 'detected'
  | 'analyzing'
  | 'recommended'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'failed';

export interface ThreadItem {
  id: string;
  title: string;
  description: string;
  status: ThreadStatus;
  createdAt: string;
  updatedAt?: string;
}
