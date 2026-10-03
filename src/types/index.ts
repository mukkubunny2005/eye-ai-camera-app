export type SafetyState =
  | 'IDLE'
  | 'TRACKING'
  | 'GAZE_STABLE'
  | 'ACTION_CANDIDATE'
  | 'CONFIRMATION'
  | 'ACTION'
  | 'COOLDOWN'
  | 'PAUSED'
  | 'TRACKING_LOST';

export type EyeActionType =
  | 'NONE'
  | 'NORMAL_BLINK_REJECTED'
  | 'DELIBERATE_CLICK'
  | 'DOUBLE_BLINK'
  | 'LONG_BLINK_PAUSE_TOGGLE'
  | 'GAZE_DWELL_CLICK';

export type ClickMethod = 'DWELL' | 'DELIBERATE_BLINK' | 'BOTH';

export interface EyeTrackingMetrics {
  leftEar: number;
  rightEar: number;
  irisOffsetX: number; // -1 to 1
  irisOffsetY: number; // -1 to 1
  headYawDeg: number;
  headPitchDeg: number;
  headRollDeg: number;
  confidence: number;
  fps: number;
  latencyMs: number;
  faceDetected: boolean;
}

export interface CalibrationTarget {
  id: number;
  x: number; // 0 to 1
  y: number; // 0 to 1
  label: string;
}

export interface CalibrationMetrics {
  qualityScore: number;
  rmsePx: number;
  isAccepted: boolean;
  pointsCompleted: number;
}

export interface UserControlSettings {
  cursorSpeed: number;
  dwellDurationMs: number;
  clickMethod: ClickMethod;
  earThreshold: number;
  deliberateBlinkMinMs: number;
  deliberateBlinkMaxMs: number;
  scrollZonePercent: number;
  hapticFeedback: boolean;
  soundFeedback: boolean;
  isHighContrast: boolean;
}
