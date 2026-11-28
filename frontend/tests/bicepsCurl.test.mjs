
import test from "node:test";
import assert from "node:assert/strict";

import BicepsCurlDetector from
  "../src/features/workout/detectors/BicepsCurlDetector.js";


// ==========================================
// GENERATE SYNTHETIC BODY LANDMARKS
// ==========================================

function frame(
  angle,
  {
    side = "left",
    drift = 0,
    torso = 0,
    missingHip = false,
    visibility = 0.99,
  } = {}
) {

  const landmarks = Array(33).fill(null);

  const [s, e, w, h] =
    side === "left"
      ? [11, 13, 15, 23]
      : [12, 14, 16, 24];

  const point = (x, y, v = 0.99) => ({
    x,
    y,
    visibility: v,
  });

  const ex = 0.5 + drift;
  const ey = 0.5;

  const alpha =
    Math.atan2(0.3 - ey, 0.5 - ex) +
    angle * Math.PI / 180;

  landmarks[s] = point(0.5, 0.3);

  landmarks[e] = point(ex, ey);

  landmarks[w] = point(
    ex + 0.2 * Math.cos(alpha),
    ey + 0.2 * Math.sin(alpha),
    visibility
  );

  if (!missingHip) {

    landmarks[h] = point(
      0.5 + 0.4 * Math.tan(torso * Math.PI / 180),
      0.7
    );
  }

  return landmarks;
}


const feed = (d, a, opts) =>
  d.process(frame(a, opts), 1000, 1000);


const sequence = (d, angles) =>
  angles.forEach(a => feed(d, a));


// ==========================================
// TEST 1: VALID CONTRACTION
// ==========================================

test("45 degree contraction counts within the valid range", () => {

  const d = new BicepsCurlDetector();

  sequence(d, [170, 45, 170]);

  assert.equal(d.reps, 1);
});


// ==========================================
// TEST 2: EXACT ANGLE BOUNDARIES
// ==========================================

test("exact contracted and extended boundaries are included", () => {

  for (const a of [35, 55]) {

    for (const b of [157, 180]) {

      const d = new BicepsCurlDetector();

      sequence(d, [b, a, b]);

      assert.equal(d.reps, 1);
    }
  }
});


// ==========================================
// TEST 3: INVALID CONTRACTION ANGLES
// ==========================================

test("angles outside contracted range do not qualify", () => {

  for (const a of [34, 56, 60, 66]) {

    const d = new BicepsCurlDetector();

    sequence(d, [170, a, 170]);

    assert.equal(d.reps, 0);
  }
});


// ==========================================
// TEST 4: INCOMPLETE ARM EXTENSION
// ==========================================

test("extension below 157 does not complete a rep", () => {

  const d = new BicepsCurlDetector();

  sequence(d, [170, 45, 156]);

  assert.equal(d.reps, 0);

  assert.equal(feed(d, 157).reps, 1);
});


// ==========================================
// TEST 5: INCORRECT STARTING POSITION
// ==========================================

test("starting contracted does not count", () => {

  const d = new BicepsCurlDetector();

  sequence(d, [45, 170]);

  assert.equal(d.reps, 0);
});


// ==========================================
// TEST 6: PREVENT DUPLICATE REP COUNTING
// ==========================================

test("holding positions never double counts", () => {

  const d = new BicepsCurlDetector();

  sequence(d, [
    170,
    45,
    45,
    170,
    170,
    170,
    45,
    170,
  ]);

  assert.equal(d.reps, 2);
});


// ==========================================
// TEST 7: BAD FORM BLOCKS COUNTING
// ==========================================

test("bad form never counts on the bad frame", () => {

  const d = new BicepsCurlDetector();

  sequence(d, [170, 45]);

  const r = feed(d, 170, {
    drift: 0.08,
  });

  assert.equal(r.reps, 0);

  assert.equal(r.isCorrectForm, false);

  assert.equal(
    r.shoulderStatus,
    "ELBOW DRIFTING"
  );

  assert.equal(r.stage, "up");
});


// ==========================================
// TEST 8: TEMPORARY ELBOW DRIFT
// ==========================================

test("two consecutive bad frames pause and recovery can complete rep", () => {

  const d = new BicepsCurlDetector();

  sequence(d, [170, 45]);

  for (let i = 0; i < 2; i++) {

    assert.equal(
      feed(d, 90, {
        drift: 0.08,
      }).reps,
      0
    );
  }

  assert.equal(d.badFormFrames, 2);

  assert.equal(feed(d, 170).reps, 1);

  assert.equal(d.badFormFrames, 0);
});


// ==========================================
// TEST 9: PERSISTENT INCORRECT FORM
// ==========================================

test("three consecutive bad frames cancel incomplete rep but preserve earlier reps", () => {

  const d = new BicepsCurlDetector();

  sequence(d, [170, 45, 170, 45]);

  for (let i = 0; i < 3; i++) {

    feed(d, 90, {
      drift: 0.08,
    });
  }

  assert.equal(d.stage, "waiting");

  assert.equal(feed(d, 170).reps, 1);

  sequence(d, [45, 170]);

  assert.equal(d.reps, 2);
});


// ==========================================
// TEST 10: INCORRECT TORSO POSTURE
// ==========================================

test("torso tilt blocks counting", () => {

  const d = new BicepsCurlDetector();

  sequence(d, [170, 45]);

  const r = feed(d, 170, {
    torso: 25,
  });

  assert.equal(r.reps, 0);

  assert.equal(r.swingStatus, "SWINGING");

  assert.equal(r.isCorrectForm, false);
});


// ==========================================
// TEST 11: MISSING HIP LANDMARK
// ==========================================

test("missing hip immediately cancels movement", () => {

  const d = new BicepsCurlDetector();

  sequence(d, [170, 45]);

  const r = feed(d, 170, {
    missingHip: true,
  });

  assert.equal(r.stage, "waiting");

  assert.equal(r.swingStatus, "N/A");

  assert.equal(r.reps, 0);

  assert.equal(feed(d, 170).reps, 0);
});


// ==========================================
// TEST 12: TRACKING LOSS
// ==========================================

test("tracking loss clears bad-frame counter and cancels movement", () => {

  const d = new BicepsCurlDetector();

  sequence(d, [170, 45]);

  feed(d, 90, {
    drift: 0.08,
  });

  const r = d.process([], 1000, 1000);

  assert.equal(r.tracking, false);

  assert.equal(r.badFormFrames, 0);

  assert.equal(r.elbowDrift, null);

  assert.equal(feed(d, 170).reps, 0);
});


// ==========================================
// TEST 13: LOW LANDMARK VISIBILITY
// ==========================================

test("low visibility is rejected", () => {

  const d = new BicepsCurlDetector();

  assert.equal(
    feed(d, 45, {
      visibility: 0.2,
    }).tracking,
    false
  );
});


// ==========================================
// TEST 14: ARM SWITCHING PROTECTION
// ==========================================

test("switching arms cancels partial movement and resets bad-frame counter", () => {

  const d = new BicepsCurlDetector();

  sequence(d, [170, 45]);

  feed(d, 90, {
    drift: 0.08,
  });

  const r = feed(d, 170, {
    side: "right",
  });

  assert.equal(r.reps, 0);

  assert.equal(r.side, "right");

  assert.equal(r.badFormFrames, 0);
});


// ==========================================
// TEST 15: RESET DETECTOR STATE
// ==========================================

test("reset clears all state", () => {

  const d = new BicepsCurlDetector();

  sequence(d, [170, 45, 170]);

  feed(d, 90, {
    drift: 0.08,
  });

  d.reset();

  assert.equal(d.reps, 0);

  assert.equal(d.side, null);

  assert.equal(d.stage, "waiting");

  assert.equal(d.badFormFrames, 0);
});
