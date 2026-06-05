export type ExecutiveDomain =
  | 'inventory'
  | 'procurement'
  | 'production'
  | 'finance'
  | 'crm'
  | 'marketing'
  | 'hr'
  | 'logistics';

export type ExecutiveThreadStatus =
  | 'detected'
  | 'analyzing'
  | 'recommended'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'failed';

export type ExecutivePriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface ExecutiveDecision {
  id: string;
  tenantId: string;
  domain: ExecutiveDomain;
  title: string;
  summary: string;
  priority: ExecutivePriority;
  status: ExecutiveThreadStatus;
  impactEstimate?: string;
  confidence?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ExecutiveMemory {
  id: string;
  tenantId: string;
  decisionId: string;
  domain: ExecutiveDomain;
  eventType: string;
  input: string;
  output: string;
  result: 'positive' | 'neutral' | 'negative';
  createdAt: string;
}
