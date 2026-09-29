# AAHAT — AI-Powered Predictive Railway Safety & Defect-Monitoring Digital Twin Simulator

**AAHAT** is a 3D/4D browser-based industrial digital twin simulator that models an AI-powered railway safety and defect-monitoring inspection vehicle. The simulator continuously monitors a 470m Catmull-Rom track spline using mounted optical, acoustic, vibration, and thermal sensor suites, combining real-time edge AI detections with a multimodal sensor fusion engine and a 4D temporal degradation profile across multiple inspection passes.

---

## Quick Start (How to Run)

### Prerequisites
- Node.js v18+ 
- npm v9+

### Installation & Development Server
```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

Open your browser at **`http://localhost:3000`** to launch the interactive simulation.

### Production Build
```bash
# Compile TypeScript and bundle Vite production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🏗️ Architecture & Module Structure

```
src/
├── scene/               # Three.js & React Three Fiber (R3F) WebGL Components
│   ├── Scene.tsx        # Canvas root & camera setup
│   ├── Track.tsx        # Extruded rails, ballast bed, instanced concrete sleepers & Pandrol clips
│   ├── InspectionVehicle.tsx # Stylized 3D trolley cart with sensor mounts & curve roll banking
│   ├── Sensors.tsx      # 3D optical frustum, acoustic pulse rings, and vibration signal beams
│   ├── DefectMarkers.tsx# Glowing 3D beacons, procedural crack decals, & multi-sensor halos
│   ├── CameraRig.tsx    # Smooth lerp/damp camera controller (Chase, Orbit, Sensor POV, Top, Cinematic)
│   ├── Effects.tsx      # Toggleable post-processing pipeline (Bloom, Vignette, ToneMapping)
│   └── Environment.tsx  # Dynamic lighting, soft shadows, sky gradient & low-poly foliage
│
├── sim/                 # Procedural Simulation & Mathematical Engines
│   ├── trackGenerator.ts# Catmull-Rom 3D track spline math, tangent frames, & rail profiles
│   ├── defectEngine.ts # Pre-seeded defects, 5-pass degradation profiles, & linear forecast slope math
│   ├── riskEngine.ts   # Multimodal Sensor Fusion Engine & programmatic diagnostic explanation generator
│   ├── sensorSignals.ts # Real-time synthetic vibration oscilloscope, acoustic FFT, & laser profiles
│   └── timeController.ts# RequestAnimationFrame tick loop & 4D time-lapse multiplier controller
│
├── state/
│   └── simStore.ts      # Global Zustand state store (telemetry, timeline, camera mode, selection)
│
└── ui/                  # Industrial HUD & Glassmorphic User Interface (Tailwind CSS)
    ├── Dashboard.tsx    # Main HUD overlay assembling all telemetry panels & 3D canvas
    ├── StatsBar.tsx     # Top industrial status bar with date/pass, play state, & speed controls
    ├── LiveMonitoringPanel.tsx # Left live telemetry panel (Position, Speed, Vib G, Acoustic dB, Temp)
    ├── AlertPanel.tsx   # Right AI Detection feed with natural language diagnostic sentences
    ├── EvidencePanel.tsx# Synchronized live sensor panels (Optical bbox, Acoustic FFT, Vibration wave)
    ├── MapPanel.tsx     # 2D Top-down GIS SVG mini-map with live vehicle tracking & GPS pins
    ├── SegmentHealthMap.tsx # Collapsible 5-segment (Segments A–E) digital track health ribbon
    ├── AnalyticsStrip.tsx   # Bottom analytics counters & animated Overall Route Health Index gauge
    ├── Timeline.tsx     # 4D Pass timeline controller (Day 1 to Day 60) & Forecast Mode toggle
    ├── DefectDetailCard.tsx # Slide-in inspector modal with evidence snippets & 7-stage state machine
    ├── OnboardingModal.tsx  # 4-step dismissible interactive simulator onboarding guide
    ├── RiskLegend.tsx   # On-canvas color coding legend for risk levels & multi-sensor halos
    └── CriticalToastAlert.tsx # Animated top-center banner alert for Critical severity events
```

---

## Procedurally Generated vs. Static Components

| System / Component | Implementation Type | Description |
| :--- | :--- | :--- |
| **3D Track Geometry** | **Procedural (Catmull-Rom Spline)** | Generated from a 470m 3D spline with gentle curves and elevation shifts. Extrudes custom I-beam rail profiles, ballast bed geometry, and calculates tangent/normal orientation frames. |
| **Sleepers & Fasteners** | **Procedural (`InstancedMesh`)** | 700+ concrete sleepers and 2800+ steel Pandrol clips instanced dynamically along the track spline with zero memory leaks. |
| **4D Defect Degradation** | **Procedural Temporal Math** | Defects evolve across 5 inspection passes (`Day 1` to `Day 60`) from *Normal* to *Critical*, procedurally altering marker colors, pulsing frequencies, and 3D crack mesh decal sizes. |
| **Predictive Forecast** | **Procedural Regression Math** | Calculates degradation slopes ($\Delta \text{score}/\text{day}$) to project days remaining until critical failure, rendering 3D ghosted forecast rings and dashed trend lines. |
| **Sensor Telemetry Streams**| **Procedural Synthetic Noise** | Real-time vibration G-forces, acoustic FFT frequency spikes, thermal anomalies, and gauge deviation profiles are synthesized based on vehicle proximity to defect locations. |
| **Multimodal Sensor Fusion**| **Procedural Fusion Engine** | Fuses Vision %, Acoustic dB, and Vibration G into unified risk scores (`Normal` $\rightarrow$ `Monitor` $\rightarrow$ `Warning` $\rightarrow$ `Critical`) with a $+12\%$ multi-sensor cross-validation bonus. |
| **Diagnostic Explanations** | **Programmatic Sentence Generator**| Constructs natural language diagnostic explanations (e.g. *"Potential rail crack detected in highlighted region; abnormal vertical vibration (2.4G) recorded simultaneously..."*) directly from sensor values without external LLM calls. |
| **2D GIS Mini-Map** | **Procedural SVG Projection** | Top-down 2D map projects the 3D spline into 2D SVG coordinates, mapping real-time vehicle position, GPS pseudo-coordinates (`12.9737° N, 77.5980° E`), and KM markers. |
| **Vehicle Model & Icons** | **Stylized Geometry & Vector SVGs** | Low-poly procedural 3D inspection trolley mesh, mounted sensor modules, and Lucide SVG icons. |

---

## 🎮 Key Simulator Controls

- **Camera Modes**: `Chase Cam` (3rd person behind cart), `Sensor View` (Bumper POV), `Top Map` (Orthographic overhead), `Free Orbit` (Interactive pan/zoom), `Cinematic` (Sweeping fly-through).
- **Time Controls**: Play/Pause, speed multipliers (`0.5x`, `1x`, `4x`, `20x Time-Lapse Mode`), and 4D pass selectors (`Day 1` to `Day 60`).
- **Defect Inspection**: Click any 3D track beacon or 2D GIS map pin to fly the camera to the defect location and open the evidence inspector drawer.
- **Maintenance State Machine**: Update defect status from `Detected` $\rightarrow$ `Under Verification` $\rightarrow$ `Confirmed` $\rightarrow$ `Scheduled` $\rightarrow$ `Repaired` $\rightarrow$ `Resolved`.
- **Post-Processing FX**: Toggle `FX ON` / `FX OFF` on the top status bar to adjust performance on mid-range devices.
