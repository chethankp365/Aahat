export type RiskCategory = 'Normal' | 'Monitor' | 'Warning' | 'Critical';

export interface MultimodalFusionResult {
  fusedConfidence: number; // 0 to 100%
  riskCategory: RiskCategory;
  agreeingSensorCount: number; // 1, 2, or 3
  isMultiSensorConfirmed: boolean; // true if 2 or 3 sensors agree
  breakdown: {
    visionScore: number;
    acousticScore: number;
    vibrationScore: number;
  };
  fusionReason: string;
  explanationSentence: string; // Programmatic natural language explanation
}

/**
 * Programmatically generates a plain-language explanation sentence from underlying sensor signals
 */
export function generateDiagnosticExplanation(
  defectTitle: string,
  visionConfidencePercent: number,
  acousticDb: number,
  vibrationG: number
): string {
  const fusion = fuseMultimodalSignals(visionConfidencePercent, acousticDb, vibrationG, defectTitle);
  return fusion.explanationSentence;
}

/**
 * Multimodal Sensor Fusion Engine
 * Combines Vision confidence + Acoustic anomaly score + Vibration G-force score
 * into a single fused confidence percentage & risk category (Normal -> Monitor -> Warning -> Critical).
 */
export function fuseMultimodalSignals(
  visionConfidencePercent: number, // e.g. 94.8%
  acousticDb: number, // e.g. 85 dB
  vibrationG: number, // e.g. 2.4 G
  defectTitle: string = 'Rail surface anomaly'
): MultimodalFusionResult {
  // 1. Normalize individual signal anomaly scores (0 to 100 scale)
  const visionScore = Math.max(0, Math.min(100, visionConfidencePercent));
  const acousticScore = Math.max(0, Math.min(100, ((acousticDb - 55) / 50) * 100));
  const vibrationScore = Math.max(0, Math.min(100, ((vibrationG - 0.25) / 3.0) * 100));

  // 2. Count active signal detections exceeding threshold (>35 pts)
  let agreeingSensorCount = 0;
  if (visionScore >= 35) agreeingSensorCount++;
  if (acousticScore >= 35) agreeingSensorCount++;
  if (vibrationScore >= 35) agreeingSensorCount++;

  // 3. Weighted fusion calculation (Vision 40%, Acoustic 30%, Vibration 30%)
  let baseFused = visionScore * 0.40 + acousticScore * 0.30 + vibrationScore * 0.30;

  // 4. Multi-Sensor Confirmation Bonus: when 2 or 3 signals agree, boost confidence
  const isMultiSensorConfirmed = agreeingSensorCount >= 2;
  if (isMultiSensorConfirmed) {
    baseFused = Math.min(100, baseFused + 12.0); // +12% multi-sensor cross-validation boost
  }

  const fusedConfidence = Number(baseFused.toFixed(1));

  // 5. Categorize risk level based on fused confidence score
  let riskCategory: RiskCategory = 'Normal';
  if (fusedConfidence >= 78) {
    riskCategory = 'Critical';
  } else if (fusedConfidence >= 52) {
    riskCategory = 'Warning';
  } else if (fusedConfidence >= 28) {
    riskCategory = 'Monitor';
  }

  let fusionReason = 'Single sensor baseline monitoring.';
  if (agreeingSensorCount === 3) {
    fusionReason = 'MULTI-SENSOR CONFIRMED: 3/3 Vision + Acoustic + Vibration consensus!';
  } else if (agreeingSensorCount === 2) {
    fusionReason = 'MULTI-SENSOR CONFIRMED: 2/3 Sensors cross-validated anomaly.';
  }

  // 6. Programmatically construct plain-language diagnostic sentence from underlying signals
  const hasVibSpike = vibrationG >= 1.2;
  const hasAcousticNoise = acousticDb >= 75;

  let secondaryPhrase = 'routine sensor telemetry recorded at this location';
  if (hasVibSpike && hasAcousticNoise) {
    secondaryPhrase = `abnormal vertical vibration (${vibrationG.toFixed(1)}G) and high-frequency acoustic emission (${acousticDb.toFixed(0)}dB) were simultaneously recorded at the exact same location`;
  } else if (hasVibSpike) {
    secondaryPhrase = `an abnormal axle vibration spike (${vibrationG.toFixed(1)}G) was simultaneously recorded at the same location`;
  } else if (hasAcousticNoise) {
    secondaryPhrase = `high-frequency acoustic chatter (${acousticDb.toFixed(0)}dB) was simultaneously recorded during wheel-rail contact`;
  }

  const explanationSentence = `${defectTitle} detected in the highlighted region; ${secondaryPhrase}, raising fused confidence to ${fusedConfidence}%.`;

  return {
    fusedConfidence,
    riskCategory,
    agreeingSensorCount,
    isMultiSensorConfirmed,
    breakdown: {
      visionScore: Math.round(visionScore),
      acousticScore: Math.round(acousticScore),
      vibrationScore: Math.round(vibrationScore),
    },
    fusionReason,
    explanationSentence,
  };
}

export interface RiskAnalysis {
  overallRiskScore: number; // 0-100
  tqi: number; // Track Quality Index (0-100)
  derailmentHazard: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  urgencyLabel: string;
  criticalDefectCount: number;
  highDefectCount: number;
}

export function computeRiskAnalysis(defects: { severity: string }[], speedKmH: number): RiskAnalysis {
  const criticals = defects.filter((d) => d.severity === 'critical');
  const highs = defects.filter((d) => d.severity === 'high');
  const mediums = defects.filter((d) => d.severity === 'medium');

  // Weighted risk contribution
  const defectRiskSum = criticals.length * 40 + highs.length * 20 + mediums.length * 8;
  const speedFactor = Math.pow(speedKmH / 60, 1.2);

  const overallRiskScore = Math.min(100, Math.round(defectRiskSum * speedFactor));
  const tqi = Math.max(40, Math.round(98 - overallRiskScore * 0.45));

  let derailmentHazard: RiskAnalysis['derailmentHazard'] = 'LOW';
  let urgencyLabel = 'Routine Monitoring';

  if (criticals.length > 0 || overallRiskScore > 75) {
    derailmentHazard = 'CRITICAL';
    urgencyLabel = 'IMMEDIATE TRACK INTERVENTION REQUIRED';
  } else if (highs.length > 0 || overallRiskScore > 50) {
    derailmentHazard = 'HIGH';
    urgencyLabel = 'Schedule Maintenance within 7 Days';
  } else if (mediums.length > 0 || overallRiskScore > 25) {
    derailmentHazard = 'MODERATE';
    urgencyLabel = 'Plan Maintenance in Next Window';
  }

  return {
    overallRiskScore,
    tqi,
    derailmentHazard,
    urgencyLabel,
    criticalDefectCount: criticals.length,
    highDefectCount: highs.length,
  };
}
