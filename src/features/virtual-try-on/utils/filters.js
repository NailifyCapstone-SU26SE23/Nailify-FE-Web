/**
 * Exponential Moving Average (EMA) filter for scalar values.
 */
export class EMAFilter {
  value = null;

  constructor(alpha = 0.25) {
    this.alpha = alpha;
  }

  filter(newValue) {
    if (this.value === null) {
      this.value = newValue;
    } else {
      this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  reset() {
    this.value = null;
  }
}

/**
 * Exponential Moving Average (EMA) filter for 2D points.
 */
export class EMAFilterPoint {
  point = null;

  constructor(alpha = 0.25) {
    this.alpha = alpha;
  }

  filter(newPoint) {
    if (this.point === null) {
      this.point = { ...newPoint };
    } else {
      this.point.x = this.alpha * newPoint.x + (1 - this.alpha) * this.point.x;
      this.point.y = this.alpha * newPoint.y + (1 - this.alpha) * this.point.y;
    }
    return { x: this.point.x, y: this.point.y };
  }

  reset() {
    this.point = null;
  }
}

/**
 * Exponential Moving Average (EMA) filter specifically for angles (in radians).
 * Corrects wrap-around boundary issues between -PI and PI to prevent 360-degree spinning artifacts.
 */
export class EMAFilterAngle {
  value = null;

  constructor(alpha = 0.25) {
    this.alpha = alpha;
  }

  filter(newAngle) {
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

  reset() {
    this.value = null;
  }
}
