export type ExecutionMode = 'dry-run' | 'execute';
export type Checkpoint = 'before' | 'after-repair' | 'after-push';

export interface ProductionExecutionRequest {
  readonly mode: ExecutionMode;
  readonly projectRef: string;
  readonly planFingerprint: string;
  readonly confirmation?: string;
}

export interface ProductionExecutionStep {
  readonly id: string;
  readonly args: readonly string[];
  readonly mutatesRemote: boolean;
  readonly enabled: boolean;
  readonly checkpoint?: Checkpoint;
  readonly evidenceFingerprint?: string;
}

export interface ProductionExecutionPlan {
  readonly mode: ExecutionMode;
  readonly projectRef: string;
  readonly planFingerprint: string;
  readonly remoteWritesAuthorized: boolean;
  readonly steps: readonly ProductionExecutionStep[];
}
