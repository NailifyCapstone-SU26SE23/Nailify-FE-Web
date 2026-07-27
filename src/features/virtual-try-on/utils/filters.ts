import { Point2D } from './handGeometry';

/**
 * Exponential Moving Average (EMA) filter for scalar values.
 */
export class EMAFilter {
  private alpha: number;
  private value: number | null = null;

  constructor(alpha: number = 0.25) {
    this.alpha = alpha;
  }

  public filter(newValue: number): number {
    if (this.value === null) {
      this.value = newValue;
    } else {
      this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  public reset(): void {
    this.value = null;
  }
}

/**
 * Exponential Moving Average (EMA) filter for 2D points.
 */
export class EMAFilterPoint {
  private alpha: number;
  private point: Point2D | null = null;

  constructor(alpha: number = 0.25) {
    this.alpha = alpha;
  }

  public filter(newPoint: Point2D): Point2D {
    if (this.point === null) {
      this.point = { ...newPoint };
    } else {
      this.point.x = this.alpha * newPoint.x + (1 - this.alpha) * this.point.x;
      this.point.y = this.alpha * newPoint.y + (1 - this.alpha) * this.point.y;
    }
    return { x: this.point.x, y: this.point.y };
  }

  public reset(): void {
    this.point = null;
  }
}

/**
 * Exponential Moving Average (EMA) filter specifically for angles (in radians).
 * Corrects wrap-around boundary issues between -PI and PI to prevent 360-degree spinning artifacts.
 */
export class EMAFilterAngle {
  private alpha: number;
  private value: number | null = null;

  constructor(alpha: number = 0.25) {
    this.alpha = alpha;
  }

  public filter(newAngle: number): number {
    if (this.value === null) {
      this.value = newAngle;
      return this.value;
    }

    // Compute the shortest modular distance
    let diff = newAngle - this.value;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    this.value = this.value + this.alpha * diff;

    // Normalize output to range [-PI, PI]
    while (this.value < -Math.PI) this.value += 2 * Math.PI;
    while (this.value > Math.PI) this.value -= 2 * Math.PI;

    return this.value;
  }

  public reset(): void {
    this.value = null;
  }
}
