export interface VibrationPoint {
  timeMs: number;
  accelG: number;
  baseline: number;
  threshold: number;
}

export interface AcousticBin {
  freqHz: string;
  amplitudeDb: number;
}

export interface LaserProfilePoint {
  xMm: number;
  yMm: number;
  nominalY: number;
}

export interface ThermalGridCell {
  x: number;
  y: number;
  tempC: number;
}

/**
 * Generates dynamic time-series vibration accelerometer waveform data
 */
export function generateVibrationWaveform(currentG: number, speedKmH: number): VibrationPoint[] {
  const points: VibrationPoint[] = [];
  const now = Date.now();
  const sampleCount = 30;

  for (let i = 0; i < sampleCount; i++) {
    const timeMs = i * 20; // 20ms sample interval
    const t = (now / 1000) * 8 + i * 0.4;
    
    // Multi-frequency harmonic vibration + noise
    const harmonic1 = Math.sin(t * 1.5) * 0.12;
    const harmonic2 = Math.sin(t * 4.2) * 0.08;
    const transientNoise = (Math.sin(i * 37) * 0.5 + Math.cos(i * 91) * 0.5) * 0.05;
    
    // Scale by vehicle speed and active defect shock
    const accelG = Math.max(0.02, currentG + harmonic1 + harmonic2 + transientNoise);

    points.push({
      timeMs: i * 20,
      accelG: Number(accelG.toFixed(3)),
      baseline: 0.15 + (speedKmH / 120) * 0.1,
      threshold: 1.2, // Safety alert threshold
    });
  }

  return points;
}

/**
 * Generates FFT acoustic frequency spectrum
 */
export function generateAcousticSpectrum(currentDb: number): AcousticBin[] {
  const bands = ['50Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '12kHz', '16kHz', '20kHz'];
  const bins: AcousticBin[] = [];

  bands.forEach((freq, idx) => {
    // Peak at mid/high frequencies during rail friction
    const freqFactor = idx > 3 && idx < 8 ? 1.4 : 0.8;
    const noise = Math.sin(Date.now() / 400 + idx) * 4;
    const amp = Math.max(20, Math.min(110, currentDb * freqFactor + noise));

    bins.push({
      freqHz: freq,
      amplitudeDb: Number(amp.toFixed(1)),
    });
  });

  return bins;
}

/**
 * Generates 2D laser cross-section of rail head profile vs nominal profile
 */
export function generateLaserProfile(gaugeDevMm: number): LaserProfilePoint[] {
  const points: LaserProfilePoint[] = [];
  const widthSamples = 25;

  for (let i = 0; i <= widthSamples; i++) {
    const x = -35 + (i / widthSamples) * 70; // Rail head width -35mm to +35mm
    
    // Nominal parabolic rail crown shape
    const nominalY = 40 - Math.pow(x / 6.0, 2);
    
    // Apply gauge displacement & surface wear distortion
    const distortion = Math.exp(-Math.pow(x / 12.0, 2)) * (gaugeDevMm * 0.4);
    const measuredY = nominalY - Math.max(0, distortion);

    points.push({
      xMm: Number(x.toFixed(1)),
      yMm: Number(measuredY.toFixed(2)),
      nominalY: Number(nominalY.toFixed(2)),
    });
  }

  return points;
}

/**
 * Generates 6x6 thermal camera temperature grid matrix
 */
export function generateThermalMatrix(baseTempC: number): ThermalGridCell[] {
  const matrix: ThermalGridCell[] = [];
  const rows = 6;
  const cols = 6;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Rail running line runs down center columns (2 and 3)
      const isRail = c === 2 || c === 3;
      const spotHeat = isRail ? baseTempC : baseTempC - 8.0;
      const noise = (Math.sin(r * 1.5 + c * 2.1 + Date.now() / 600) + 1) * 1.2;

      matrix.push({
        x: c,
        y: r,
        tempC: Number((spotHeat + noise).toFixed(1)),
      });
    }
  }

  return matrix;
}
