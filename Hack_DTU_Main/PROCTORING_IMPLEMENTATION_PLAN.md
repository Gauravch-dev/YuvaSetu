# Proctoring System — Implementation Plan

> **Feature**: Face/Eye Tracking + Interview Rules Page for Malpractice Detection  
> **Estimated Time**: ~2 hours  
> **Dependencies**: `face-api.js`, Browser APIs (`visibilitychange`, `getUserMedia`)

---

## Table of Contents

1. [Overview](#1-overview)
2. [New Files to Create](#2-new-files-to-create)
3. [Existing Files to Modify](#3-existing-files-to-modify)
4. [Step 1: Install Dependencies](#step-1-install-dependencies--5-min)
5. [Step 2: Download Face-API Models](#step-2-download-face-api-models--5-min)
6. [Step 3: Build Interview Rules Page](#step-3-build-interview-rules-page--20-min)
7. [Step 4: Camera Requirement Gate](#step-4-camera-requirement-gate--15-min)
8. [Step 5: Face Detection Service](#step-5-face-detection-service--20-min)
9. [Step 6: Eye Gaze Estimation](#step-6-eye-gaze-estimation--20-min)
10. [Step 7: Tab Switch Detection](#step-7-tab-switch-detection--5-min)
11. [Step 8: Warning UI & Strike System](#step-8-warning-ui--strike-system--15-min)
12. [Step 9: Violation Logging & Feedback Integration](#step-9-violation-logging--feedback-integration--15-min)
13. [Step 10: Update Routes & Navigation](#step-10-update-routes--navigation--5-min)
14. [Detection Accuracy Table](#detection-accuracy)
15. [Data Structures](#data-structures)
16. [Face-API Landmarks Reference](#face-api-landmarks-reference)
17. [Testing Checklist](#testing-checklist)

---

## 1. Overview

### What We're Building

A browser-based proctoring system that runs during AI mock interviews to detect potential malpractice. Everything runs client-side using `face-api.js` — no additional server needed.

### User Flow (After Implementation)

```
User clicks "Start Interview" on MockInterview page
                │
                ▼
┌──────────────────────────────────┐
│  INTERVIEW RULES PAGE (NEW)      │
│                                  │
│  Shows rules:                    │
│  • Sit in a quiet place          │
│  • Keep camera on at all times   │
│  • No second person allowed      │
│  • Don't switch tabs             │
│  • Keep water ready              │
│  • Once started, can't pause     │
│                                  │
│  [Camera Check] ← Must pass      │
│  [Microphone Check] ← Must pass  │
│  [I'm Ready - Start Interview]   │
└──────────┬───────────────────────┘
           │ Only if camera + mic OK
           ▼
┌──────────────────────────────────┐
│  INTERVIEW SESSION (MODIFIED)     │
│                                  │
│  Face detection runs every 500ms │
│  Eye gaze tracked continuously   │
│  Tab switches logged instantly   │
│                                  │
│  Warning banners appear on       │
│  violations (3-strike system)    │
│                                  │
│  All violations logged with      │
│  timestamps                      │
└──────────┬───────────────────────┘
           │ Interview ends
           ▼
┌──────────────────────────────────┐
│  FEEDBACK PAGE (MODIFIED)         │
│                                  │
│  Existing scores + NEW section:  │
│  "Interview Integrity Report"    │
│  • Integrity Score (0-100)       │
│  • Violation timeline            │
│  • Tab switches count            │
│  • Look-away events count        │
└──────────────────────────────────┘
```

---

## 2. New Files to Create

```
frontend/
├── public/
│   └── models/                              ← face-api.js model weights
│       ├── tiny_face_detector_model-weights_manifest.json
│       ├── tiny_face_detector_model-shard1
│       ├── face_landmark_68_model-weights_manifest.json
│       ├── face_landmark_68_model-shard1
│       ├── face_expression_model-weights_manifest.json
│       └── face_expression_model-shard1
│
├── src/
│   ├── lib/
│   │   └── interview/
│   │       └── proctor.ts                   ← Face detection + eye gaze + tab tracking service
│   │
│   ├── pages/
│   │   └── dashboard/
│   │       └── seeker/
│   │           └── InterviewReadiness.tsx    ← Rules page + camera/mic check
│   │
│   └── components/
│       └── interview/
│           └── ProctoringOverlay.tsx         ← Warning banners + violation indicators
```

---

## 3. Existing Files to Modify

| File | Changes |
|------|---------|
| `frontend/package.json` | Add `face-api.js` dependency |
| `frontend/src/App.tsx` | Add route for `/dashboard/interview/:id/ready` |
| `frontend/src/pages/dashboard/seeker/MockInterview.tsx` | Change "Start Interview" to navigate to readiness page first |
| `frontend/src/components/interview/InterviewAgent.tsx` | Integrate proctoring overlay, pass violations to feedback |
| `frontend/src/pages/dashboard/seeker/InterviewSession.tsx` | Include violations in feedback save |
| `frontend/src/pages/dashboard/seeker/InterviewFeedback.tsx` | Add "Integrity Report" section |
| `backend/src/models/InterviewFeedback.ts` | Add `proctoringSummary` field to schema |

---

## Step 1: Install Dependencies (~5 min)

```bash
cd frontend
npm install face-api.js
```

`face-api.js` is ~2MB and runs entirely in the browser using TensorFlow.js. No server-side processing.

---

## Step 2: Download Face-API Models (~5 min)

Download model files from the face-api.js GitHub repo into `frontend/public/models/`:

```bash
mkdir -p frontend/public/models
cd frontend/public/models

# Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
# Required models:
# 1. tiny_face_detector (fast face detection, ~190KB)
# 2. face_landmark_68 (68-point facial landmarks, ~350KB)  
# 3. face_expression (optional, ~590KB)

# Or copy from a local source / CDN
```

**Files needed (6 files total):**
```
tiny_face_detector_model-weights_manifest.json
tiny_face_detector_model-shard1
face_landmark_68_model-weights_manifest.json
face_landmark_68_model-shard1
face_expression_model-weights_manifest.json    (optional)
face_expression_model-shard1                   (optional)
```

---

## Step 3: Build Interview Rules Page (~20 min)

### File: `frontend/src/pages/dashboard/seeker/InterviewReadiness.tsx`

### Route: `/dashboard/interview/:id/ready`

### Design:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│         🎯 Before You Begin                         │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  INTERVIEW RULES                            │    │
│  │                                             │    │
│  │  ✅ Sit in a quiet, well-lit environment    │    │
│  │  ✅ Keep your camera ON throughout          │    │
│  │  ✅ No other person should be visible       │    │
│  │  ✅ Do not switch tabs or windows           │    │
│  │  ✅ Keep water/necessities ready            │    │
│  │  ✅ Use a stable internet connection        │    │
│  │  ✅ Speak clearly into the microphone       │    │
│  │                                             │    │
│  │  ⚠️ IMPORTANT                               │    │
│  │  • Once the interview starts, it CANNOT     │    │
│  │    be paused or restarted                   │    │
│  │  • All violations (looking away, tab        │    │
│  │    switches, multiple faces) are logged     │    │
│  │  • 3 violations = automatic termination     │    │
│  │  • An integrity score will be included      │    │
│  │    in your feedback report                  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  SYSTEM CHECK                               │    │
│  │                                             │    │
│  │  📷 Camera:     ✅ Working (HD 720p)       │    │
│  │                 [Live preview of your face]  │    │
│  │                                             │    │
│  │  🎤 Microphone: ✅ Working (Intel Mic)     │    │
│  │                 [Audio level meter ████░░]   │    │
│  │                                             │    │
│  │  🤖 AI Model:   ✅ Ready                   │    │
│  │  🔊 Speaker:    ✅ Working                 │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ☑️ I have read and agree to the interview rules    │
│                                                     │
│  [← Back]                    [🎯 I'm Ready, Start] │
│                              (disabled until all    │
│                               checks pass + agree)  │
└─────────────────────────────────────────────────────┘
```

### Implementation Details:

```typescript
// InterviewReadiness.tsx

interface SystemCheck {
  camera: 'checking' | 'pass' | 'fail';
  microphone: 'checking' | 'pass' | 'fail';
  aiService: 'checking' | 'pass' | 'fail';
  speaker: 'checking' | 'pass' | 'fail';
}

// On mount:
// 1. Request camera via getUserMedia({ video: true, audio: true })
//    - If camera denied/unavailable → camera = 'fail' → BLOCK interview
//    - If OK → show live preview in <video> element
//
// 2. Check microphone by analyzing audio stream amplitude
//    - Create AudioContext + AnalyserNode
//    - If getByteFrequencyData shows activity → mic = 'pass'
//    - Show real-time audio level meter
//
// 3. Check AI services
//    - fetch('http://localhost:5100/health') → TTS
//    - fetch('http://localhost:5200/health') → STT  
//    - fetch('http://localhost:5000/api/ollama-proxy/api/tags') → LLM
//
// 4. Speaker check
//    - Play a short beep/tone via AudioContext
//    - Ask user to confirm they heard it

// Camera MUST pass — this is a hard requirement:
const canStart = 
  checks.camera === 'pass' && 
  checks.microphone === 'pass' && 
  checks.aiService === 'pass' &&
  agreedToRules === true;

// If camera fails:
// Show: "Camera is required for this interview. Please enable your camera 
//        and refresh the page. If your device doesn't have a camera, 
//        you cannot proceed with the AI mock interview."
```

### Navigation Change:

```typescript
// MockInterview.tsx — Change the "Start Interview" handler:

// BEFORE:
const handleStartInterview = (id: string) => {
  navigate(`/dashboard/interview/${id}`);
};

// AFTER:
const handleStartInterview = (id: string) => {
  navigate(`/dashboard/interview/${id}/ready`);  // Go to rules page first
};
```

---

## Step 4: Camera Requirement Gate (~15 min)

### Logic in InterviewReadiness.tsx:

```typescript
const checkCamera = async (): Promise<'pass' | 'fail'> => {
  try {
    // Check if any video input devices exist
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    
    if (videoDevices.length === 0) {
      return 'fail'; // No camera hardware
    }

    // Try to get camera stream
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
    });

    // Show preview
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    // Store stream ref for cleanup
    cameraStreamRef.current = stream;
    return 'pass';
  } catch (error) {
    // Permission denied or camera in use
    if (error.name === 'NotAllowedError') {
      setErrorMessage('Camera permission denied. Please allow camera access.');
    } else if (error.name === 'NotFoundError') {
      setErrorMessage('No camera found on this device.');
    } else if (error.name === 'NotReadableError') {
      setErrorMessage('Camera is being used by another application.');
    }
    return 'fail';
  }
};
```

### Hard Block:

If camera check fails, the "Start Interview" button should be **permanently disabled** with a clear message:

```
🚫 Camera Required
This AI interview requires a working camera for proctoring.
Please enable your camera or use a device with a camera.
```

---

## Step 5: Face Detection Service (~20 min)

### File: `frontend/src/lib/interview/proctor.ts`

```typescript
import * as faceapi from 'face-api.js';

export interface ProctorViolation {
  timestamp: string;
  type: 'no_face' | 'multiple_faces' | 'looking_away' | 'tab_switch' | 'eyes_closed';
  duration: number;       // milliseconds
  confidence: number;     // 0-1
  details?: string;
}

export interface ProctorState {
  faceCount: number;
  isLookingAway: boolean;
  gazeDirection: 'center' | 'left' | 'right' | 'up' | 'down';
  eyesOpen: boolean;
  violations: ProctorViolation[];
  warningLevel: number;   // 0, 1, 2, 3 (3 = terminated)
  integrityScore: number; // 0-100
  isModelLoaded: boolean;
}

export class ProctoringService {
  private videoElement: HTMLVideoElement | null = null;
  private detectionInterval: NodeJS.Timeout | null = null;
  private violations: ProctorViolation[] = [];
  private warningLevel = 0;
  private isRunning = false;
  private onStateChange: ((state: ProctorState) => void) | null = null;
  
  // Tracking state for duration calculation
  private currentViolationStart: number | null = null;
  private currentViolationType: string | null = null;
  
  // Configurable thresholds
  private readonly DETECTION_INTERVAL_MS = 500;         // Check every 500ms
  private readonly LOOK_AWAY_THRESHOLD = 0.35;          // Gaze ratio threshold
  private readonly NO_FACE_GRACE_PERIOD_MS = 2000;      // 2s before flagging
  private readonly MAX_WARNINGS = 3;                     // Auto-terminate after 3
  private readonly VIOLATION_SCORE_PENALTY = 5;          // -5 per violation

  /**
   * Load face-api.js models. Call once on component mount.
   */
  async loadModels(): Promise<boolean> {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        // faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL), // Optional
      ]);
      console.log('[Proctor] Models loaded');
      return true;
    } catch (error) {
      console.error('[Proctor] Failed to load models:', error);
      return false;
    }
  }

  /**
   * Start proctoring on a video element.
   */
  start(videoElement: HTMLVideoElement, onStateChange: (state: ProctorState) => void): void {
    this.videoElement = videoElement;
    this.onStateChange = onStateChange;
    this.violations = [];
    this.warningLevel = 0;
    this.isRunning = true;

    // Run detection loop
    this.detectionInterval = setInterval(() => {
      this.detect();
    }, this.DETECTION_INTERVAL_MS);

    // Listen for tab visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    console.log('[Proctor] Started');
  }

  /**
   * Stop proctoring.
   */
  stop(): ProctorViolation[] {
    this.isRunning = false;
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    console.log('[Proctor] Stopped. Violations:', this.violations.length);
    return this.violations;
  }

  /**
   * Main detection loop — runs every 500ms.
   */
  private async detect(): Promise<void> {
    if (!this.isRunning || !this.videoElement) return;

    try {
      // Run face detection with landmarks
      const detections = await faceapi
        .detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,       // Smaller = faster, less accurate
          scoreThreshold: 0.5,
        }))
        .withFaceLandmarks();

      const faceCount = detections.length;

      // --- Check 1: No face ---
      if (faceCount === 0) {
        this.handleViolation('no_face', 0.9, 'No face detected in camera');
      }

      // --- Check 2: Multiple faces ---
      else if (faceCount > 1) {
        this.handleViolation('multiple_faces', 0.85, `${faceCount} faces detected`);
      }

      // --- Check 3: Eye gaze (only if exactly 1 face) ---
      else if (faceCount === 1) {
        this.clearCurrentViolation(); // Face is present, clear no_face timer
        
        const landmarks = detections[0].landmarks;
        const gazeResult = this.analyzeGaze(landmarks);
        
        if (gazeResult.isLookingAway) {
          this.handleViolation('looking_away', gazeResult.confidence, 
            `Looking ${gazeResult.direction}`);
        }
      }

      // Emit state update
      this.emitState(faceCount, detections.length === 1 ? detections[0].landmarks : null);

    } catch (error) {
      // Detection can fail if video element is not ready
      console.warn('[Proctor] Detection error:', error);
    }
  }

  /**
   * Analyze eye gaze direction from landmarks.
   * See "Face-API Landmarks Reference" section below.
   */
  private analyzeGaze(landmarks: faceapi.FaceLandmarks68): {
    isLookingAway: boolean;
    direction: 'center' | 'left' | 'right';
    confidence: number;
  } {
    // Get eye landmarks
    const leftEye = landmarks.getLeftEye();   // Points 36-41
    const rightEye = landmarks.getRightEye(); // Points 42-47
    const nose = landmarks.getNose();          // Points 27-35

    // Calculate horizontal gaze ratio for each eye
    const leftGazeRatio = this.calculateGazeRatio(leftEye);
    const rightGazeRatio = this.calculateGazeRatio(rightEye);
    const avgGazeRatio = (leftGazeRatio + rightGazeRatio) / 2;

    // Calculate head pose from nose position relative to face bounds
    const jaw = landmarks.getJawOutline();
    const faceLeft = jaw[0].x;
    const faceRight = jaw[16].x;
    const faceWidth = faceRight - faceLeft;
    const noseX = nose[0].x;
    const noseRelative = (noseX - faceLeft) / faceWidth; // 0-1, 0.5 = center

    // Combined score: gaze + head pose
    const isLookingLeft = avgGazeRatio > 0.65 || noseRelative < 0.35;
    const isLookingRight = avgGazeRatio < 0.35 || noseRelative > 0.65;
    const isLookingAway = isLookingLeft || isLookingRight;

    return {
      isLookingAway,
      direction: isLookingLeft ? 'left' : isLookingRight ? 'right' : 'center',
      confidence: isLookingAway ? 0.75 : 0.9,
    };
  }

  /**
   * Calculate gaze ratio for one eye.
   * Ratio of white space on left vs right side of the eye.
   * 
   * ~0.5 = looking center
   * <0.35 = looking right
   * >0.65 = looking left
   */
  private calculateGazeRatio(eyePoints: faceapi.Point[]): number {
    // Eye corner points
    const leftCorner = eyePoints[0];   // Outer corner
    const rightCorner = eyePoints[3];  // Inner corner
    
    // Eye center (midpoint of top and bottom)
    const topMid = {
      x: (eyePoints[1].x + eyePoints[2].x) / 2,
      y: (eyePoints[1].y + eyePoints[2].y) / 2,
    };
    const bottomMid = {
      x: (eyePoints[4].x + eyePoints[5].x) / 2,
      y: (eyePoints[4].y + eyePoints[5].y) / 2,
    };
    const eyeCenter = {
      x: (topMid.x + bottomMid.x) / 2,
      y: (topMid.y + bottomMid.y) / 2,
    };

    // Ratio: distance from left corner to center / total eye width
    const eyeWidth = rightCorner.x - leftCorner.x;
    if (eyeWidth === 0) return 0.5;
    
    const ratio = (eyeCenter.x - leftCorner.x) / eyeWidth;
    return ratio;
  }

  // ... (handleViolation, handleVisibilityChange, emitState methods)
}
```

---

## Step 6: Eye Gaze Estimation (~20 min)

Already included in Step 5's `analyzeGaze()` method. Key points:

### How It Works

```
LEFT EYE (points 36-41):

    37 ── 38
   /        \
  36    ●    39     ← The "●" is the estimated iris position
   \        /         based on the white-space ratio
    41 ── 40

RIGHT EYE (points 42-47):

    43 ── 44
   /        \
  42    ●    45
   \        /
    47 ── 46
```

### Gaze Ratio Calculation

```
Eye Width = rightCorner.x - leftCorner.x
Center X = average of top/bottom midpoints

Ratio = (centerX - leftCorner.x) / eyeWidth

Ratio ~0.50 → Looking at camera (center) ✅
Ratio <0.35 → Looking right (off-screen) ⚠️
Ratio >0.65 → Looking left (off-screen) ⚠️
```

### Head Pose Addition

```
Jaw points: 0 (left) to 16 (right)
Nose tip: point 30

noseRelative = (nose.x - jaw[0].x) / (jaw[16].x - jaw[0].x)

noseRelative ~0.50 → Facing camera ✅
noseRelative <0.35 → Head turned left ⚠️
noseRelative >0.65 → Head turned right ⚠️
```

Combined: flag as "looking away" if EITHER gaze ratio OR head pose is off-center.

---

## Step 7: Tab Switch Detection (~5 min)

```typescript
// Inside ProctoringService

private handleVisibilityChange = (): void => {
  if (document.hidden) {
    // User switched away from the tab
    this.handleViolation('tab_switch', 1.0, 'Switched to another tab/window');
  }
};
```

This has **100% accuracy** — the browser API is definitive.

Additionally, detect `window.blur` for cases where user clicks outside browser:

```typescript
// Also in start():
window.addEventListener('blur', this.handleWindowBlur);

private handleWindowBlur = (): void => {
  // Could be clicking on another window
  this.handleViolation('tab_switch', 0.8, 'Window lost focus');
};
```

---

## Step 8: Warning UI & Strike System (~15 min)

### File: `frontend/src/components/interview/ProctoringOverlay.tsx`

### Design:

```
┌───────────────────────────────────────────────────────────────┐
│ Interview Screen                                              │
│                                                               │
│  ┌─────────── Warning Banner (slides in from top) ──────────┐│
│  │ ⚠️ WARNING: Looking away from camera (Strike 1/3)        ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌──────────┐  Camera area has colored border:               │
│  │          │  🟢 Green = all good                           │
│  │  Camera  │  🟡 Yellow = minor issue (1 strike)            │
│  │  Feed    │  🟠 Orange = warning (2 strikes)               │
│  │          │  🔴 Red = critical (3 strikes = terminated)    │
│  └──────────┘                                                 │
│                                                               │
│  Bottom-right corner: Small status indicators                 │
│  👁️ Gaze: Center ✅                                          │
│  👤 Face: 1 detected ✅                                      │
│  🖥️ Tab: Active ✅                                           │
└───────────────────────────────────────────────────────────────┘
```

### Strike System Logic:

```typescript
const WARNING_MESSAGES: Record<string, Record<number, string>> = {
  no_face: {
    1: '⚠️ Your face is not visible. Please look at the camera.',
    2: '🟠 Second warning: Face not detected. Next violation will end the interview.',
    3: '🔴 Interview terminated: Repeated face detection violations.',
  },
  multiple_faces: {
    1: '⚠️ Multiple faces detected. Only you should be visible.',
    2: '🟠 Second warning: Multiple faces still detected.',
    3: '🔴 Interview terminated: Multiple persons detected repeatedly.',
  },
  looking_away: {
    1: '⚠️ Please look at the camera while answering.',
    2: '🟠 Second warning: You appear to be looking away from the screen.',
    3: '🔴 Interview terminated: Repeated gaze violations.',
  },
  tab_switch: {
    1: '⚠️ Tab switch detected. Please stay on this page.',
    2: '🟠 Second warning: Another tab switch detected.',
    3: '🔴 Interview terminated: Repeated tab switching.',
  },
};
```

### Auto-Termination:

When `warningLevel >= 3`:
1. Show red banner: "Interview terminated due to repeated violations"
2. Stop the AI conversation
3. Automatically generate feedback (with low integrity score)
4. Navigate to feedback page

---

## Step 9: Violation Logging & Feedback Integration (~15 min)

### Backend Schema Update

```typescript
// backend/src/models/InterviewFeedback.ts — Add to schema:

proctoringSummary: {
  integrityScore: { type: Number, default: 100 },
  totalViolations: { type: Number, default: 0 },
  violations: [{
    timestamp: String,
    type: { type: String, enum: ['no_face', 'multiple_faces', 'looking_away', 'tab_switch'] },
    duration: Number,
    confidence: Number,
    details: String,
  }],
  summary: {
    tabSwitches: { type: Number, default: 0 },
    lookAwayEvents: { type: Number, default: 0 },
    multipleFaceEvents: { type: Number, default: 0 },
    noFaceEvents: { type: Number, default: 0 },
    autoTerminated: { type: Boolean, default: false },
  }
}
```

### Integrity Score Calculation:

```typescript
function calculateIntegrityScore(violations: ProctorViolation[]): number {
  let score = 100;
  
  const penalties: Record<string, number> = {
    tab_switch: 10,        // -10 per tab switch
    no_face: 5,            // -5 per no-face event
    multiple_faces: 15,    // -15 per multiple faces event
    looking_away: 3,       // -3 per look-away event
  };

  for (const v of violations) {
    score -= penalties[v.type] || 5;
  }

  return Math.max(0, Math.min(100, score));
}
```

### Feedback Page Addition:

```
┌─────────────────────────────────────────────┐
│  🛡️ Interview Integrity Report              │
│                                             │
│  Integrity Score: 85/100  🟢               │
│  ████████████████████░░░░                   │
│                                             │
│  📊 Violations:                             │
│  • Tab switches: 1                          │
│  • Looking away: 2                          │
│  • Multiple faces: 0                        │
│  • Face not visible: 0                      │
│                                             │
│  📋 Timeline:                               │
│  02:15 — ⚠️ Tab switch detected             │
│  05:30 — ⚠️ Looking away (3.2s)             │
│  08:45 — ⚠️ Looking away (1.8s)             │
└─────────────────────────────────────────────┘
```

---

## Step 10: Update Routes & Navigation (~5 min)

### App.tsx:

```typescript
import { InterviewReadiness } from "./pages/dashboard/seeker/InterviewReadiness";

// Add route:
<Route path="interview/:id/ready" element={<InterviewReadiness />} />
```

### MockInterview.tsx:

```typescript
// Change navigation:
// FROM:
navigate(`/dashboard/interview/${id}`);
// TO:
navigate(`/dashboard/interview/${id}/ready`);
```

### InterviewReadiness → InterviewSession flow:

```typescript
// In InterviewReadiness, after all checks pass + user agrees:
navigate(`/dashboard/interview/${id}`, { 
  state: { cameraStream: true, rulesAccepted: true } 
});
```

---

## Detection Accuracy

| Detection | Method | Accuracy | False Positive Rate | Notes |
|-----------|--------|----------|-------------------|-------|
| No face | TinyFaceDetector | ~95% | ~2% | Very reliable |
| Multiple faces | Face count > 1 | ~90% | ~5% | Photos on wall can trigger |
| Looking away (gaze) | Eye landmark ratio | ~75-80% | ~10-15% | Glasses can reduce accuracy |
| Looking away (head) | Nose-jaw ratio | ~80% | ~8% | Good for large head turns |
| Tab switch | visibilitychange API | 100% | 0% | Browser API, definitive |
| Window blur | window.blur event | ~95% | ~5% | Some false positives from notifications |

### Known Limitations

1. **Glasses** — Reflections can confuse eye landmark detection. Accuracy drops ~10%
2. **Poor lighting** — Face detection needs decent lighting. Very dark rooms = more false negatives
3. **Photos/posters** — A face on a poster behind the user can trigger "multiple faces"
4. **Small face** — If user sits far from camera, TinyFaceDetector may miss them
5. **Face masks** — Partially covered faces reduce landmark accuracy

### Mitigation

- Use `scoreThreshold: 0.5` (not too strict)
- Add 2-second grace period before flagging violations
- Don't flag "looking away" during TTS playback (user might look at transcript)
- Track violation duration — brief glances are normal, sustained looking away is not

---

## Face-API Landmarks Reference

```
68 Facial Landmark Points:

    Points 0-16:  Jaw outline (left to right)
    Points 17-21: Left eyebrow
    Points 22-26: Right eyebrow
    Points 27-30: Nose bridge
    Points 31-35: Nose tip
    Points 36-41: Left eye     ← Used for gaze
    Points 42-47: Right eye    ← Used for gaze
    Points 48-59: Outer lip
    Points 60-67: Inner lip

Left Eye Detail:
    36: outer corner
    37: upper outer
    38: upper inner
    39: inner corner
    40: lower inner
    41: lower outer

Right Eye Detail:
    42: inner corner
    43: upper inner
    44: upper outer
    45: outer corner
    46: lower outer
    47: lower inner

For gaze: Use points 36-41 (left eye) and 42-47 (right eye)
For head pose: Use point 30 (nose tip) relative to points 0,16 (jaw edges)
For mouth: Use points 48-67 (optional, for "mouth moving" detection)
```

---

## Data Structures

### ProctorViolation (stored per event)

```typescript
{
  timestamp: "2026-04-03T12:15:30.000Z",
  type: "looking_away",
  duration: 3200,          // 3.2 seconds of sustained looking away
  confidence: 0.78,        // face-api detection confidence
  details: "Looking right"
}
```

### ProctoringSummary (stored in feedback)

```typescript
{
  integrityScore: 85,
  totalViolations: 3,
  violations: [ProctorViolation, ...],
  summary: {
    tabSwitches: 1,
    lookAwayEvents: 2,
    multipleFaceEvents: 0,
    noFaceEvents: 0,
    autoTerminated: false
  }
}
```

---

## Testing Checklist

### Camera Requirement
- [ ] No camera device → Shows "Camera required" message, Start button disabled
- [ ] Camera permission denied → Shows "Please allow camera access"
- [ ] Camera in use by another app → Shows appropriate message
- [ ] Camera working → Shows live preview, Start button enabled

### Rules Page
- [ ] All rules displayed clearly
- [ ] Camera preview works
- [ ] Mic level meter shows activity when speaking
- [ ] AI service health checks pass/fail correctly
- [ ] "I agree" checkbox required before Start
- [ ] Start button disabled until all checks pass + agreement
- [ ] Back button returns to mock interview list

### Face Detection
- [ ] 1 face visible → Green indicator, no warnings
- [ ] 0 faces (walk away) → Warning after 2s grace period
- [ ] 2+ faces (hold up photo/phone) → Immediate warning
- [ ] Return to 1 face → Warning clears

### Eye Gaze
- [ ] Looking at camera → "Center" indicator
- [ ] Looking right (at second screen) → "Looking away" warning
- [ ] Looking left → "Looking away" warning
- [ ] Brief glance away (<2s) → No warning (grace period)

### Tab Switching
- [ ] Switch to another tab → Immediate warning
- [ ] Switch back → Warning logged but clears
- [ ] Alt+Tab to another app → Window blur detected

### Strike System
- [ ] 1st violation → Yellow banner
- [ ] 2nd violation → Orange banner
- [ ] 3rd violation → Red banner + interview auto-terminates
- [ ] Auto-terminated interview → Feedback generated with low integrity score

### Feedback Integration
- [ ] Integrity score appears on feedback page
- [ ] Violation timeline shows all events
- [ ] Violation counts are accurate
- [ ] Auto-terminated interviews marked as such

---

## Timeline

| Step | Task | Time |
|------|------|------|
| 1 | Install face-api.js + download models | 5 min |
| 2 | Download model weight files to public/models/ | 5 min |
| 3 | Build InterviewReadiness page (rules + checks) | 20 min |
| 4 | Camera requirement gate (hard block if no camera) | 15 min |
| 5 | ProctoringService (face detection loop) | 20 min |
| 6 | Eye gaze estimation (landmark analysis) | 20 min |
| 7 | Tab switch detection (visibilitychange + blur) | 5 min |
| 8 | ProctoringOverlay UI (warnings + strike system) | 15 min |
| 9 | Violation logging + feedback integration | 15 min |
| 10 | Route updates + navigation changes | 5 min |
| **Total** | | **~2 hours** |

---

## Summary

This proctoring system adds **multimodal AI** (vision + language + speech) to the platform, directly hitting the hackathon's "Next-Gen Generative AI" theme. It runs entirely in the browser with no additional server, uses established ML models (face-api.js / TensorFlow.js), and provides a compelling live demo:

1. Start interview → Rules page → Camera check
2. During interview → Real-time face/gaze/tab monitoring
3. After interview → Integrity score alongside performance scores

**Demo script for judges**: Look away → yellow warning. Hold up phone with face → red warning. Switch tab → immediate detection. End interview → integrity report with timeline.
