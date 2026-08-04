export const FINGER_SPECS = [
  {
    name: "thumb",
    tip: 4,
    dip: 3,
    pip: 2,
    mcp: 1,
    widthFactor: 1.08,
    heightFactor: 1.45,
  },
  {
    name: "index",
    tip: 8,
    dip: 7,
    pip: 6,
    mcp: 5,
    widthFactor: 0.74,
    heightFactor: 1.82,
  },
  {
    name: "middle",
    tip: 12,
    dip: 11,
    pip: 10,
    mcp: 9,
    widthFactor: 0.76,
    heightFactor: 1.88,
  },
  {
    name: "ring",
    tip: 16,
    dip: 15,
    pip: 14,
    mcp: 13,
    widthFactor: 0.72,
    heightFactor: 1.82,
  },
  {
    name: "pinky",
    tip: 20,
    dip: 19,
    pip: 18,
    mcp: 17,
    widthFactor: 0.68,
    heightFactor: 1.72,
  },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const normalize = (vector) => {
  const len = Math.hypot(vector.x, vector.y);
  if (len < 0.000001) return { x: 0, y: -1 };
  return { x: vector.x / len, y: vector.y / len };
};

const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const toCanvasPoint = (point, width, height) => ({
  x: point.x * width,
  y: point.y * height,
  z: point.z,
  visibility: point.visibility,
});

const add = (point, vector, scale = 1) => ({
  x: point.x + vector.x * scale,
  y: point.y + vector.y * scale,
});

/**
 * Gets the coordinates of the fingertip.
 */
export function getFingertip(landmark) {
  return {
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    visibility: landmark.visibility,
  };
}

/**
 * Computes the direction vector (axis) of the finger from joint to tip.
 */
export function getFingerAxis(tip, joint) {
  return normalize({
    x: tip.x - joint.x,
    y: tip.y - joint.y,
  });
}

/**
 * Calculates the rotation angle of the finger in radians.
 */
export function getRotationAngle(axis) {
  return Math.atan2(axis.y, axis.x);
}

/**
 * Computes a rotated region of interest around the visible nail zone.
 */
export function getNailROI(center, axis, width, height) {
  const normalizedAxis = normalize(axis);
  const normal = { x: -normalizedAxis.y, y: normalizedAxis.x };
  const halfWidth = width * 0.62;
  const halfHeight = height * 0.58;

  const polygon = [
    add(add(center, normal, -halfWidth), normalizedAxis, -halfHeight),
    add(add(center, normal, halfWidth), normalizedAxis, -halfHeight),
    add(add(center, normal, halfWidth), normalizedAxis, halfHeight),
    add(add(center, normal, -halfWidth), normalizedAxis, halfHeight),
  ];

  return {
    polygon,
    bounds: {
      minX: Math.min(...polygon.map((point) => point.x)),
      minY: Math.min(...polygon.map((point) => point.y)),
      maxX: Math.max(...polygon.map((point) => point.x)),
      maxY: Math.max(...polygon.map((point) => point.y)),
    },
  };
}

/**
 * Computes a per-finger confidence score from hand score and anatomical consistency.
 */
export function getFingerConfidence(handScore, landmarks, fingerIndex) {
  const spec = FINGER_SPECS[fingerIndex];
  if (!spec || !landmarks || landmarks.length < 21) return 0;

  const mcp = landmarks[spec.mcp];
  const pip = landmarks[spec.pip];
  const dip = landmarks[spec.dip];
  const tip = landmarks[spec.tip];
  if (!mcp || !pip || !dip || !tip) return 0;

  // Calculate 3D vectors between consecutive joints
  const getVec3D = (p1, p2) => ({
    x: p2.x - p1.x,
    y: p2.y - p1.y,
    z: (p2.z ?? 0) - (p1.z ?? 0),
  });

  const norm = (v) => {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len < 0.000001) return { x: 0, y: 0, z: 0 };
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  };

  const v1 = norm(getVec3D(mcp, pip));
  const v2 = norm(getVec3D(pip, dip));
  const v3 = norm(getVec3D(dip, tip));

  // Compute cosine of angle between segments
  const cos1 = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const cos2 = v2.x * v3.x + v2.y * v3.y + v2.z * v3.z;

  // Joint straightness is the minimum cosine of the two bends
  const straightness = Math.min(cos1, cos2);

  // Map straightness to extension confidence
  let extensionConfidence = 0;
  if (fingerIndex === 0) {
    // Thumb is naturally more curved, so slightly wider range
    extensionConfidence = smoothstep(0.35, 0.75, straightness);
  } else {
    extensionConfidence = smoothstep(0.48, 0.82, straightness);
  }

  // 3D Reach-to-Length ratio
  const dist3D = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = (a.z ?? 0) - (b.z ?? 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };
  const fullLength = dist3D(mcp, pip) + dist3D(pip, dip) + dist3D(dip, tip);
  const reach = dist3D(mcp, tip);
  const reachRatio = fullLength > 0 ? reach / fullLength : 0;

  const reachConfidence =
    fingerIndex === 0
      ? smoothstep(0.45, 0.75, reachRatio)
      : smoothstep(0.55, 0.82, reachRatio);

  extensionConfidence = Math.min(extensionConfidence, reachConfidence);

  // 2D curl check: if tip is closer to MCP than PIP or DIP, it is folded.
  const dist2D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const dTip = dist2D(tip, mcp);
  const dDip = dist2D(dip, mcp);
  const dPip = dist2D(pip, mcp);
  if (dTip < dDip * 0.92 || dTip < dPip * 0.92) {
    extensionConfidence *= 0.1; // Drastically reduce confidence for clenched/folded fingers
  }

  const visibilityConfidence = [mcp, pip, dip, tip].reduce((score, point) => {
    if (typeof point.visibility !== "number") return score;
    return Math.min(score, clamp(point.visibility, 0, 1));
  }, 1);

  return clamp(handScore * extensionConfidence * visibilityConfidence, 0, 1);
}

/**
 * Converts MediaPipe landmarks into all geometry needed by the try-on renderer and later AI service calls.
 */
export function computeFingerGeometry(
  landmarks,
  fingerIndex,
  canvasWidth,
  canvasHeight,
  handScore,
) {
  const spec = FINGER_SPECS[fingerIndex];
  if (
    !spec ||
    !landmarks ||
    landmarks.length < 21 ||
    canvasWidth <= 0 ||
    canvasHeight <= 0
  )
    return null;

  const tip = toCanvasPoint(landmarks[spec.tip], canvasWidth, canvasHeight);
  const dip = toCanvasPoint(landmarks[spec.dip], canvasWidth, canvasHeight);
  const pip = toCanvasPoint(landmarks[spec.pip], canvasWidth, canvasHeight);
  const mcp = toCanvasPoint(landmarks[spec.mcp], canvasWidth, canvasHeight);

  const longAxis = normalize({
    x: tip.x - (fingerIndex === 0 ? mcp.x : pip.x),
    y: tip.y - (fingerIndex === 0 ? mcp.y : pip.y),
  });
  const distalAxis = getFingerAxis(tip, dip);
  const axis = normalize({
    x: longAxis.x * 0.65 + distalAxis.x * 0.35,
    y: longAxis.y * 0.65 + distalAxis.y * 0.35,
  });
  const normal = { x: -axis.y, y: axis.x };

  const canvasMin = Math.min(canvasWidth, canvasHeight);
  const distalLength = distance(dip, tip);
  const middleLength = distance(pip, dip);
  const rawWidth = Math.max(
    distalLength * 1.25,
    middleLength * spec.widthFactor,
  );
  const width = clamp(rawWidth, canvasMin * 0.012, canvasMin * 0.085);
  const height = width * spec.heightFactor;

  const center = add(tip, axis, -height * 0.34);
  const confidence = getFingerConfidence(handScore, landmarks, fingerIndex);
  const fitStatus =
    confidence < 0.35
      ? "low_confidence"
      : width > canvasMin * 0.12
        ? "too_wide"
        : "ok";

  return {
    fingerIndex,
    fingerName: spec.name,
    tip,
    joint: dip,
    base: mcp,
    center,
    axis,
    normal,
    rotation: getRotationAngle(axis),
    width,
    height,
    roi: getNailROI(center, axis, width, height),
    confidence,
    fitStatus,
  };
}
