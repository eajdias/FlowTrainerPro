/**
 * Latency models for order execution simulation.
 *
 * Ported from ordersim (https://github.com/tradingexpert/ordersim)
 * MIT License
 *
 * Latency is represented in two explicit legs:
 * - entry latency: local order send to simulated venue receipt;
 * - response latency: simulated venue event to local strategy observation.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LatencySample {
  entryNs: number;
  responseNs: number;
}

export interface LatencyMeasurement {
  tsNs: number;
  entryNs: number;
  responseNs: number;
  regime?: string;
}

// ─── Model interface ──────────────────────────────────────────────────────────

export interface LatencyModel {
  sample(tsNs: number, regime?: string): LatencySample;
}

// ─── Constant latency ─────────────────────────────────────────────────────────

export class ConstantLatency implements LatencyModel {
  entryNs: number;
  responseNs: number;

  constructor(entryNs: number = 0, responseNs: number = 0) {
    if (entryNs < 0) throw new Error('entryNs must be non-negative');
    if (responseNs < 0) throw new Error('responseNs must be non-negative');
    this.entryNs = entryNs;
    this.responseNs = responseNs;
  }

  sample(tsNs: number, _regime?: string): LatencySample {
    if (tsNs < 0) throw new Error('tsNs must be non-negative');
    return { entryNs: this.entryNs, responseNs: this.responseNs };
  }
}

// ─── Jittered latency ─────────────────────────────────────────────────────────

export class JitteredLatency implements LatencyModel {
  entryNs: number;
  responseNs: number;
  jitterNs: number;
  private _rng: () => number;

  constructor(entryNs: number, responseNs: number, jitterNs: number, seed?: number) {
    if (entryNs < 0) throw new Error('entryNs must be non-negative');
    if (responseNs < 0) throw new Error('responseNs must be non-negative');
    if (jitterNs < 0) throw new Error('jitterNs must be non-negative');
    this.entryNs = entryNs;
    this.responseNs = responseNs;
    this.jitterNs = jitterNs;

    let state = seed ?? 0;
    this._rng = () => {
      state |= 0;
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  sample(tsNs: number, _regime?: string): LatencySample {
    if (tsNs < 0) throw new Error('tsNs must be non-negative');
    return {
      entryNs: this._jitter(this.entryNs),
      responseNs: this._jitter(this.responseNs),
    };
  }

  private _jitter(baseNs: number): number {
    if (this.jitterNs === 0) return baseNs;
    const offset = Math.floor(this._rng() * (2 * this.jitterNs + 1)) - this.jitterNs;
    return Math.max(0, baseNs + offset);
  }
}

// ─── Empirical playback ──────────────────────────────────────────────────────

export class EmpiricalPlayback implements LatencyModel {
  private _cursors: Map<string | null, number> = new Map();
  private _samples: readonly LatencySample[];
  private _samplesByRegime: Map<string | null, readonly LatencySample[]>;

  constructor(measurements: readonly LatencyMeasurement[]) {
    const ordered = [...measurements].sort((a, b) => a.tsNs - b.tsNs);
    if (ordered.length === 0) {
      throw new Error('measurements must not be empty');
    }

    this._samples = ordered.map((m) => ({ entryNs: m.entryNs, responseNs: m.responseNs }));
    this._samplesByRegime = _samplesByRegime(ordered);
  }

  static fromMeasurements(measurements: readonly LatencyMeasurement[]): EmpiricalPlayback {
    return new EmpiricalPlayback(measurements);
  }

  sample(tsNs: number, regime?: string): LatencySample {
    if (tsNs < 0) throw new Error('tsNs must be non-negative');
    const samples = this._selectSamples(regime);
    const cursor = this._cursors.get(regime ?? null) ?? 0;
    if (cursor >= samples.length) {
      throw new Error('empirical playback is exhausted');
    }
    this._cursors.set(regime ?? null, cursor + 1);
    return samples[cursor]!;
  }

  reset(): void {
    this._cursors.clear();
  }

  private _selectSamples(regime?: string): readonly LatencySample[] {
    if (regime === undefined || regime === null) {
      return this._samples;
    }
    const samples = this._samplesByRegime.get(regime);
    if (!samples || samples.length === 0) {
      throw new Error(`no latency measurements for regime: ${regime}`);
    }
    return samples;
  }
}

// ─── Empirical bootstrap ─────────────────────────────────────────────────────

export class EmpiricalBootstrap implements LatencyModel {
  private _rng: () => number;
  private _samples: readonly LatencySample[];
  private _samplesByRegime: Map<string | null, readonly LatencySample[]>;

  constructor(measurements: readonly LatencyMeasurement[], seed?: number) {
    const ordered = [...measurements].sort((a, b) => a.tsNs - b.tsNs);
    if (ordered.length === 0) {
      throw new Error('measurements must not be empty');
    }

    this._samples = ordered.map((m) => ({ entryNs: m.entryNs, responseNs: m.responseNs }));
    this._samplesByRegime = _samplesByRegime(ordered);

    let state = seed ?? 0;
    this._rng = () => {
      state |= 0;
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  static fromMeasurements(measurements: readonly LatencyMeasurement[], seed?: number): EmpiricalBootstrap {
    return new EmpiricalBootstrap(measurements, seed);
  }

  sample(tsNs: number, regime?: string): LatencySample {
    if (tsNs < 0) throw new Error('tsNs must be non-negative');
    const samples = this._selectSamples(regime);
    const idx = Math.floor(this._rng() * samples.length);
    return samples[idx]!;
  }

  private _selectSamples(regime?: string): readonly LatencySample[] {
    if (regime === undefined || regime === null) {
      return this._samples;
    }
    const samples = this._samplesByRegime.get(regime);
    if (!samples || samples.length === 0) {
      throw new Error(`no latency measurements for regime: ${regime}`);
    }
    return samples;
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function defaultLatencyModel(): LatencyModel {
  return new ConstantLatency(0, 0);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _samplesByRegime(
  measurements: readonly LatencyMeasurement[],
): Map<string | null, readonly LatencySample[]> {
  const regimes = new Set(measurements.map((m) => m.regime ?? null));
  const result = new Map<string | null, readonly LatencySample[]>();
  for (const regime of regimes) {
    const samples = measurements
      .filter((m) => (m.regime ?? null) === regime)
      .map((m) => ({ entryNs: m.entryNs, responseNs: m.responseNs }));
    result.set(regime, samples);
  }
  return result;
}
