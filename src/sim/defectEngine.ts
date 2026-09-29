export type DefectType = 
  | 'squat' 
  | 'crack' 
  | 'gauge_spread' 
  | 'thermal_anomaly' 
  | 'fastener_missing' 
  | 'ballast_void';

export type DefectSeverity = 'critical' | 'high' | 'medium' | 'low' | 'normal';

export type DefectStatus = 
  | 'unseen' 
  | 'detected' 
  | 'under_verification' 
  | 'confirmed' 
  | 'scheduled' 
  | 'repaired' 
  | 'ai_reinspected' 
  | 'resolved';

export interface InspectionPassRecord {
  passNumber: number; // 1, 2, 3, 4, 5...
  dayNumber: number; // Day 1, Day 15, Day 30, Day 45, Day 60
  dateLabel: string; // e.g. "Day 1 (Pass #1)"
  severity: DefectSeverity;
  riskScore: number; // 0 to 100
  crackLengthMm: number; // Visual crack size growth
  vibrationG: number;
  acousticDb: number;
  gaugeDevMm: number;
}

export interface PredictiveForecast {
  predictedCriticalDay: number;
  daysRemainingUntilCritical: number;
  trendSlope: number; // Risk growth per day
  historicalPoints: { day: number; riskScore: number }[];
  forecastPoints: { day: number; projectedRisk: number }[];
}

export interface RailDefect {
  id: string;
  distance: number; // distance in meters from start (0 to 450)
  locationKm: number; // e.g. 0.042
  type: DefectType;
  railSide: 'left' | 'right' | 'both';
  status: DefectStatus;
  title: string;
  description: string;
  recommendedAction: string;

  // 4D Degradation Profile across Passes
  passRecords: InspectionPassRecord[];
}

/**
 * Computes defect state for a given active inspection pass (1 to 5)
 */
export function getDefectStateAtPass(defect: RailDefect, currentPassNumber: number) {
  const rec = defect.passRecords.find(p => p.passNumber === currentPassNumber) 
    || defect.passRecords[defect.passRecords.length - 1];

  return {
    ...rec,
    id: defect.id,
    distance: defect.distance,
    locationKm: defect.locationKm,
    type: defect.type,
    railSide: defect.railSide,
    status: defect.status,
    title: defect.title,
    description: defect.description,
    recommendedAction: defect.recommendedAction,
  };
}

/**
 * Calculates linear regression trend and projects future risk curve
 */
export function computePredictiveForecast(defect: RailDefect, currentPassNumber: number): PredictiveForecast {
  // Use historical records up to current active pass
  const historical = defect.passRecords.filter(p => p.passNumber <= currentPassNumber);
  
  if (historical.length === 0) {
    const defaultRec = defect.passRecords[0];
    historical.push(defaultRec);
  }

  // Calculate simple linear regression trend slope (Risk vs Day)
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  const n = historical.length;

  historical.forEach(pt => {
    sumX += pt.dayNumber;
    sumY += pt.riskScore;
    sumXY += pt.dayNumber * pt.riskScore;
    sumXX += pt.dayNumber * pt.dayNumber;
  });

  const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 1.2;
  const intercept = n > 1 ? (sumY - slope * sumX) / n : historical[0].riskScore;

  const currentPt = historical[historical.length - 1];
  const targetCriticalRisk = 85;

  // Estimate day when risk reaches 85 (Critical)
  let predictedCriticalDay = slope > 0 ? Math.round((targetCriticalRisk - intercept) / slope) : 90;
  if (predictedCriticalDay < currentPt.dayNumber) {
    predictedCriticalDay = currentPt.dayNumber + 5;
  }

  const daysRemaining = Math.max(0, predictedCriticalDay - currentPt.dayNumber);

  // Generate historical data points for charts
  const historicalPoints = historical.map(p => ({
    day: p.dayNumber,
    riskScore: p.riskScore
  }));

  // Generate ghosted/projected forecast curve into the future
  const forecastPoints = [];
  const startDay = currentPt.dayNumber;
  for (let d = startDay; d <= Math.min(100, startDay + 40); d += 5) {
    const projectedRisk = Math.min(100, Math.round(intercept + slope * d));
    forecastPoints.push({
      day: d,
      projectedRisk
    });
  }

  return {
    predictedCriticalDay,
    daysRemainingUntilCritical: daysRemaining,
    trendSlope: Number(slope.toFixed(2)),
    historicalPoints,
    forecastPoints
  };
}

export const INSPECTION_PASSES = [
  { passNumber: 1, dayNumber: 1, dateLabel: 'Day 1 (Baseline)' },
  { passNumber: 2, dayNumber: 15, dateLabel: 'Day 15 (Pass #2)' },
  { passNumber: 3, dayNumber: 30, dateLabel: 'Day 30 (Pass #3)' },
  { passNumber: 4, dayNumber: 45, dateLabel: 'Day 45 (Pass #4)' },
  { passNumber: 5, dayNumber: 60, dateLabel: 'Day 60 (Pass #5)' },
];

export const initialDefects: RailDefect[] = [
  {
    id: 'DEF-101',
    distance: 42,
    locationKm: 0.042,
    type: 'crack',
    railSide: 'right',
    status: 'unseen',
    title: 'Railhead Micro-Crack',
    description: 'Surface rolling contact fatigue (RCF) micro-cracking evolving on right rail running surface.',
    recommendedAction: 'Grind rail surface within 15 days to prevent deep transverse fracture propagation.',
    passRecords: [
      { passNumber: 1, dayNumber: 1, dateLabel: 'Day 1', severity: 'normal', riskScore: 12, crackLengthMm: 0, vibrationG: 0.15, acousticDb: 55, gaugeDevMm: 0.2 },
      { passNumber: 2, dayNumber: 15, dateLabel: 'Day 15', severity: 'low', riskScore: 32, crackLengthMm: 3.5, vibrationG: 0.45, acousticDb: 68, gaugeDevMm: 0.5 },
      { passNumber: 3, dayNumber: 30, dateLabel: 'Day 30', severity: 'medium', riskScore: 58, crackLengthMm: 8.2, vibrationG: 0.85, acousticDb: 82, gaugeDevMm: 1.2 },
      { passNumber: 4, dayNumber: 45, dateLabel: 'Day 45', severity: 'high', riskScore: 78, crackLengthMm: 16.4, vibrationG: 1.65, acousticDb: 94, gaugeDevMm: 2.1 },
      { passNumber: 5, dayNumber: 60, dateLabel: 'Day 60', severity: 'critical', riskScore: 94, crackLengthMm: 28.0, vibrationG: 2.85, acousticDb: 104, gaugeDevMm: 3.4 },
    ]
  },
  {
    id: 'DEF-102',
    distance: 115,
    locationKm: 0.115,
    type: 'squat',
    railSide: 'left',
    status: 'unseen',
    title: 'Subsurface Railhead Squat',
    description: 'Subsurface horizontal crack causing localized rail top indentation. High derailment hazard as wheel impact increases.',
    recommendedAction: 'IMMEDIATE: Impose speed restriction and schedule rail section replacement.',
    passRecords: [
      { passNumber: 1, dayNumber: 1, dateLabel: 'Day 1', severity: 'normal', riskScore: 18, crackLengthMm: 1.0, vibrationG: 0.22, acousticDb: 58, gaugeDevMm: 0.4 },
      { passNumber: 2, dayNumber: 15, dateLabel: 'Day 15', severity: 'medium', riskScore: 48, crackLengthMm: 6.0, vibrationG: 0.95, acousticDb: 76, gaugeDevMm: 1.1 },
      { passNumber: 3, dayNumber: 30, dateLabel: 'Day 30', severity: 'high', riskScore: 74, crackLengthMm: 14.5, vibrationG: 1.85, acousticDb: 89, gaugeDevMm: 2.4 },
      { passNumber: 4, dayNumber: 45, dateLabel: 'Day 45', severity: 'critical', riskScore: 92, crackLengthMm: 24.0, vibrationG: 3.10, acousticDb: 102, gaugeDevMm: 3.8 },
      { passNumber: 5, dayNumber: 60, dateLabel: 'Day 60', severity: 'critical', riskScore: 98, crackLengthMm: 35.0, vibrationG: 4.20, acousticDb: 112, gaugeDevMm: 5.2 },
    ]
  },
  {
    id: 'DEF-103',
    distance: 185,
    locationKm: 0.185,
    type: 'gauge_spread',
    railSide: 'both',
    status: 'unseen',
    title: 'Gauge Widening Deviation',
    description: 'Track gauge expanding due to progressive sleeper clip loosening and tie plate wear on curve section.',
    recommendedAction: 'Re-gauge curve sleepers and replace worn fastening insulator pads.',
    passRecords: [
      { passNumber: 1, dayNumber: 1, dateLabel: 'Day 1', severity: 'normal', riskScore: 10, crackLengthMm: 0, vibrationG: 0.18, acousticDb: 54, gaugeDevMm: 1.0 },
      { passNumber: 2, dayNumber: 15, dateLabel: 'Day 15', severity: 'low', riskScore: 28, crackLengthMm: 0, vibrationG: 0.40, acousticDb: 62, gaugeDevMm: 4.2 },
      { passNumber: 3, dayNumber: 30, dateLabel: 'Day 30', severity: 'medium', riskScore: 52, crackLengthMm: 0, vibrationG: 0.85, acousticDb: 74, gaugeDevMm: 8.5 },
      { passNumber: 4, dayNumber: 45, dateLabel: 'Day 45', severity: 'high', riskScore: 78, crackLengthMm: 0, vibrationG: 1.45, acousticDb: 86, gaugeDevMm: 12.4 },
      { passNumber: 5, dayNumber: 60, dateLabel: 'Day 60', severity: 'critical', riskScore: 90, crackLengthMm: 0, vibrationG: 2.10, acousticDb: 96, gaugeDevMm: 16.8 },
    ]
  },
  {
    id: 'DEF-104',
    distance: 260,
    locationKm: 0.260,
    type: 'thermal_anomaly',
    railSide: 'right',
    status: 'unseen',
    title: 'Localized Friction Overheating',
    description: 'Thermal IR scanner detected friction heating hotspot near switch transition.',
    recommendedAction: 'Inspect rail flange lubrication system and wheel flange contact angle.',
    passRecords: [
      { passNumber: 1, dayNumber: 1, dateLabel: 'Day 1', severity: 'normal', riskScore: 15, crackLengthMm: 0, vibrationG: 0.20, acousticDb: 56, gaugeDevMm: 0.5 },
      { passNumber: 2, dayNumber: 15, dateLabel: 'Day 15', severity: 'low', riskScore: 30, crackLengthMm: 0, vibrationG: 0.35, acousticDb: 64, gaugeDevMm: 0.8 },
      { passNumber: 3, dayNumber: 30, dateLabel: 'Day 30', severity: 'medium', riskScore: 55, crackLengthMm: 0, vibrationG: 0.65, acousticDb: 75, gaugeDevMm: 1.1 },
      { passNumber: 4, dayNumber: 45, dateLabel: 'Day 45', severity: 'medium', riskScore: 68, crackLengthMm: 0, vibrationG: 0.95, acousticDb: 84, gaugeDevMm: 1.5 },
      { passNumber: 5, dayNumber: 60, dateLabel: 'Day 60', severity: 'high', riskScore: 82, crackLengthMm: 0, vibrationG: 1.35, acousticDb: 92, gaugeDevMm: 2.0 },
    ]
  },
  {
    id: 'DEF-105',
    distance: 330,
    locationKm: 0.330,
    type: 'fastener_missing',
    railSide: 'left',
    status: 'unseen',
    title: 'Missing Pandrol Fastener Clips',
    description: 'Computer vision camera identified missing sleeper clips on left rail base plate.',
    recommendedAction: 'Install replacement e-clips and re-torque fastening bolts.',
    passRecords: [
      { passNumber: 1, dayNumber: 1, dateLabel: 'Day 1', severity: 'normal', riskScore: 10, crackLengthMm: 0, vibrationG: 0.16, acousticDb: 52, gaugeDevMm: 0.6 },
      { passNumber: 2, dayNumber: 15, dateLabel: 'Day 15', severity: 'low', riskScore: 25, crackLengthMm: 0, vibrationG: 0.32, acousticDb: 61, gaugeDevMm: 1.5 },
      { passNumber: 3, dayNumber: 30, dateLabel: 'Day 30', severity: 'medium', riskScore: 48, crackLengthMm: 0, vibrationG: 0.75, acousticDb: 72, gaugeDevMm: 3.1 },
      { passNumber: 4, dayNumber: 45, dateLabel: 'Day 45', severity: 'high', riskScore: 71, crackLengthMm: 0, vibrationG: 1.45, acousticDb: 85, gaugeDevMm: 4.8 },
      { passNumber: 5, dayNumber: 60, dateLabel: 'Day 60', severity: 'critical', riskScore: 88, crackLengthMm: 0, vibrationG: 2.10, acousticDb: 95, gaugeDevMm: 7.2 },
    ]
  },
  {
    id: 'DEF-106',
    distance: 405,
    locationKm: 0.405,
    type: 'ballast_void',
    railSide: 'both',
    status: 'unseen',
    title: 'Ballast Voiding / Mud Pumping',
    description: 'Dynamic accelerometer detected mud pumping and slight sleeper voiding under cyclic load.',
    recommendedAction: 'Schedule tamping maintenance train during night shift window.',
    passRecords: [
      { passNumber: 1, dayNumber: 1, dateLabel: 'Day 1', severity: 'normal', riskScore: 8, crackLengthMm: 0, vibrationG: 0.14, acousticDb: 50, gaugeDevMm: 0.3 },
      { passNumber: 2, dayNumber: 15, dateLabel: 'Day 15', severity: 'low', riskScore: 20, crackLengthMm: 0, vibrationG: 0.28, acousticDb: 58, gaugeDevMm: 0.8 },
      { passNumber: 3, dayNumber: 30, dateLabel: 'Day 30', severity: 'low', riskScore: 32, crackLengthMm: 0, vibrationG: 0.55, acousticDb: 66, gaugeDevMm: 1.4 },
      { passNumber: 4, dayNumber: 45, dateLabel: 'Day 45', severity: 'medium', riskScore: 48, crackLengthMm: 0, vibrationG: 0.95, acousticDb: 75, gaugeDevMm: 2.1 },
      { passNumber: 5, dayNumber: 60, dateLabel: 'Day 60', severity: 'high', riskScore: 68, crackLengthMm: 0, vibrationG: 1.40, acousticDb: 83, gaugeDevMm: 3.2 },
    ]
  },
];
