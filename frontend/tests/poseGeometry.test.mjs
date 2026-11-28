import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAngle, calculateJointAngle, getPoint, LANDMARKS } from '../src/features/workout/utils/poseGeometry.js';

const p = (x, y) => ({x, y});
const near = (actual, expected) => {
  assert.notEqual(actual, null);
  assert.ok(Math.abs(actual - expected) < 1e-8);
};

test('right angle', () => near(calculateAngle(p(0,1), p(0,0), p(1,0)), 90));
test('straight angle', () => near(calculateAngle(p(-1,0), p(0,0), p(1,0)), 180));
test('folded angle', () => near(calculateAngle(p(1,0), p(0,0), p(2,0)), 0));
test('45 degree angle', () => near(calculateAngle(p(0,1), p(0,0), p(1,1)), 45));
test('coincident joint is invalid', () => assert.equal(calculateAngle(p(0,0), p(0,0), p(1,0)), null));
test('missing point is invalid', () => assert.equal(calculateAngle(null, p(0,0), p(1,0)), null));
test('nonfinite point is invalid', () => assert.equal(calculateAngle(p(NaN,0), p(0,0), p(1,0)), null));
const landmarks = Array(33).fill(null);
landmarks[11] = {x: 0.5, y: 0.25, visibility: 0.99};
landmarks[13] = {x: 0.5, y: 0.5, visibility: 0.99};
landmarks[15] = {x: 0.625, y: 0.25, visibility: 0.99};
// In a 1280x640 image, the last vector is (160,-160), not (0.125,-0.25).
test('corrects non-square image aspect ratio', () => near(calculateJointAngle(landmarks, 11, 13, 15, 1280, 640),45));
test('rejects low visibility', () => {
  const hidden = [...landmarks]; hidden[15] = {...hidden[15],visibility: 0.2};
  assert.equal(calculateJointAngle(hidden,11,13,15,1280,640),null);
});
test('rejects unavailable video dimensions', () => assert.equal(getPoint(landmarks,11,0,640),null));
test('rejects missing landmark', () => assert.equal(getPoint(landmarks,12,1280,640),null));
test('landmark indices map to expected joints', () => assert.equal(LANDMARKS.LEFT_ELBOW,13));
