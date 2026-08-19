/**
 * faceMath.js - Geometry algorithms for 3D Head Pose, Facial Expressions (EAR, MAR), 
 * and Biometric Feature Vector Extraction for Face Recognition.
 */

// Helper distance in 2D or 3D
export function dist(p1, p2, useZ = false) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  if (!useZ) return Math.sqrt(dx * dx + dy * dy);
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates Pitch, Yaw, and Roll Euler angles in degrees from 3D Face Landmarks.
 * Landmark Indices:
 * - Nose tip: 1
 * - Chin: 152
 * - Left eye corner: 33
 * - Right eye corner: 263
 * - Left mouth corner: 61
 * - Right mouth corner: 291
 */
export function calculateHeadPose(landmarks) {
  if (!landmarks || landmarks.length < 468) {
    return { pitch: 0, yaw: 0, roll: 0, rawPitch: 0, rawYaw: 0, rawRoll: 0 };
  }

  const nose = landmarks[1];
  const chin = landmarks[152];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];

  // 1. Roll: tilt angle between the eyes in 2D (Z-axis rotation)
  const dEyeX = rightEye.x - leftEye.x;
  const dEyeY = rightEye.y - leftEye.y;
  const rollRad = Math.atan2(dEyeY, dEyeX);
  const rollDeg = rollRad * (180 / Math.PI);

  // 2. Yaw: horizontal turning of face (Y-axis rotation)
  // Distance from nose to left eye vs nose to right eye
  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
    z: ((leftEye.z || 0) + (rightEye.z || 0)) / 2
  };
  const eyeDistance = dist(leftEye, rightEye);

  // Relative displacement of nose tip from eyes center
  const noseHorizontalOffset = nose.x - eyeCenter.x;
  const yawRatio = noseHorizontalOffset / (eyeDistance || 0.001);
  // Scale ratio to reasonable degree estimate (approx -60 to +60 deg)
  const yawDeg = Math.max(-75, Math.min(75, yawRatio * -120));

  // 3. Pitch: vertical tilt of head up/down (X-axis rotation)
  const faceHeight = dist(eyeCenter, chin);
  const noseVerticalOffset = nose.y - eyeCenter.y;
  const pitchRatio = (noseVerticalOffset / (faceHeight || 0.001)) - 0.38; // 0.38 is typical neutral center
  const pitchDeg = Math.max(-60, Math.min(60, pitchRatio * 110));

  return {
    pitch: pitchDeg,
    yaw: yawDeg,
    roll: rollDeg,
    // also return normalized translation offset for camera movement
    transX: (nose.x - 0.5) * 2, // -1 to +1
    transY: (0.5 - nose.y) * 2  // -1 to +1
  };
}

/**
 * Calculates Eye Aspect Ratio (EAR) for blinking detection.
 * EAR < 0.18 usually indicates closed eye / blink.
 */
export function calculateEAR(landmarks) {
  if (!landmarks || landmarks.length < 468) return { leftEAR: 0.3, rightEAR: 0.3, avgEAR: 0.3 };

  // Left Eye: 33 (outer), 133 (inner), 159 (top), 145 (bottom), 158 (top2), 144 (bottom2)
  const l_outer = landmarks[33];
  const l_inner = landmarks[133];
  const l_top1 = landmarks[159];
  const l_bot1 = landmarks[145];
  const l_top2 = landmarks[158];
  const l_bot2 = landmarks[144];

  const leftVertical1 = dist(l_top1, l_bot1);
  const leftVertical2 = dist(l_top2, l_bot2);
  const leftHorizontal = dist(l_outer, l_inner);
  const leftEAR = (leftVertical1 + leftVertical2) / (2.0 * (leftHorizontal || 0.001));

  // Right Eye: 263 (outer), 362 (inner), 386 (top), 374 (bottom), 385 (top2), 373 (bottom2)
  const r_outer = landmarks[263];
  const r_inner = landmarks[362];
  const r_top1 = landmarks[386];
  const r_bot1 = landmarks[374];
  const r_top2 = landmarks[385];
  const r_bot2 = landmarks[373];

  const rightVertical1 = dist(r_top1, r_bot1);
  const rightVertical2 = dist(r_top2, r_bot2);
  const rightHorizontal = dist(r_outer, r_inner);
  const rightEAR = (rightVertical1 + rightVertical2) / (2.0 * (rightHorizontal || 0.001));

  return {
    leftEAR,
    rightEAR,
    avgEAR: (leftEAR + rightEAR) / 2,
    isBlinking: leftEAR < 0.19 && rightEAR < 0.19,
    isWinkingLeft: leftEAR < 0.18 && rightEAR > 0.22,
    isWinkingRight: rightEAR < 0.18 && leftEAR > 0.22
  };
}

/**
 * Calculates Mouth Aspect Ratio (MAR) for speech/open mouth detection.
 * MAR > 0.5 indicates open mouth / talking / smiling.
 */
export function calculateMAR(landmarks) {
  if (!landmarks || landmarks.length < 468) return { mar: 0, isOpen: false, isSmiling: false };

  const topLip = landmarks[13];
  const botLip = landmarks[14];
  const leftCorner = landmarks[61];
  const rightCorner = landmarks[291];

  const vertical = dist(topLip, botLip);
  const horizontal = dist(leftCorner, rightCorner);
  const mar = vertical / (horizontal || 0.001);

  // Smile metric: ratio of mouth width to eye distance
  const eyeDist = dist(landmarks[33], landmarks[263]);
  const mouthWidthRatio = horizontal / (eyeDist || 0.001);

  return {
    mar,
    isOpen: mar > 0.45,
    isSmiling: mouthWidthRatio > 0.85
  };
}

/**
 * Generates an invariant 10-dimensional biometric feature vector from 3D face mesh.
 * Used for enrolling and recognizing user face profiles.
 */
export function extractBiometricVector(landmarks) {
  if (!landmarks || landmarks.length < 468) return null;

  const eyeDist = dist(landmarks[33], landmarks[263]);
  if (eyeDist === 0) return null;

  // Key distances relative to Eye Distance (scale-invariant)
  const noseToChin = dist(landmarks[1], landmarks[152]) / eyeDist;
  const noseToLeftEye = dist(landmarks[1], landmarks[33]) / eyeDist;
  const noseToRightEye = dist(landmarks[1], landmarks[263]) / eyeDist;
  const mouthWidth = dist(landmarks[61], landmarks[291]) / eyeDist;
  const jawWidth = dist(landmarks[234], landmarks[454]) / eyeDist;
  const foreheadToNose = dist(landmarks[10], landmarks[1]) / eyeDist;
  const leftEyeWidth = dist(landmarks[33], landmarks[133]) / eyeDist;
  const rightEyeWidth = dist(landmarks[263], landmarks[362]) / eyeDist;
  const noseWidth = dist(landmarks[129], landmarks[358]) / eyeDist;
  const chinToMouth = dist(landmarks[152], landmarks[14]) / eyeDist;

  return [
    noseToChin,
    noseToLeftEye,
    noseToRightEye,
    mouthWidth,
    jawWidth,
    foreheadToNose,
    leftEyeWidth,
    rightEyeWidth,
    noseWidth,
    chinToMouth
  ];
}

/**
 * Compares two biometric vectors and returns a match confidence score (0 to 100%).
 */
export function matchBiometricVector(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) return 0;

  let sumSqDiff = 0;
  for (let i = 0; i < vectorA.length; i++) {
    const diff = vectorA[i] - vectorB[i];
    sumSqDiff += diff * diff;
  }
  const euclideanDist = Math.sqrt(sumSqDiff);
  
  // Similarity mapping: 0 dist -> 100%, 0.3 dist -> 0%
  const similarity = Math.max(0, 100 * (1 - (euclideanDist / 0.35)));
  return Math.round(similarity * 10) / 10;
}
