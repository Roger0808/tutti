import assert from "node:assert/strict";
import test from "node:test";
import {
  centerPointFromRect,
  easeInOutCubic,
  easeInQuadratic,
  easeOutQuadratic,
  lerpGenieValue
} from "./genieAnimation.ts";

test("keeps genie easing helpers clamped at key points", () => {
  assert.equal(easeInOutCubic(-1), 0);
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(0.5), 0.5);
  assert.equal(easeInOutCubic(1), 1);
  assert.equal(easeInOutCubic(2), 1);

  assert.equal(easeInQuadratic(0.5), 0.25);
  assert.equal(easeOutQuadratic(0.5), 0.75);
});

test("derives stable genie geometry primitives", () => {
  assert.equal(lerpGenieValue(10, 30, 0.25), 15);
  assert.deepEqual(
    centerPointFromRect({ left: 10, top: 20, width: 40, height: 60 }),
    {
      x: 30,
      y: 50
    }
  );
});
