export type ExecutionMode = 'dry-run' | 'execute';
export type Checkpoint =
  | 'before'
  | 'after-first-repair'
  | 'after-repair'
  | 'after-push';
export type ResumeCheckpoint = 'after-first-repair';

export interface ProductionExecutionRequest {
  readonly mode: ExecutionMode;
  readonly projectRef: string;
  readonly planFingerprint: string;
  readonly confirmation?: string;
  readonly resumeFrom?: ResumeCheckpoint;
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
  readonly resumeFrom?: ResumeCheckpoint;
  readonly steps: readonly ProductionExecutionStep[];
}
