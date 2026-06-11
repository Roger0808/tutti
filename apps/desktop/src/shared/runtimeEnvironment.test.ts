import assert from "node:assert/strict";
import test from "node:test";
import { isDesktopDevelopmentRuntime } from "./runtimeEnvironment.ts";

test("isDesktopDevelopmentRuntime follows explicit NEXTOP_ENV before NODE_ENV", () => {
  assert.equal(
    isDesktopDevelopmentRuntime({
      nextopEnv: "development",
      nodeEnv: "production"
    }),
    true
  );
  assert.equal(
    isDesktopDevelopmentRuntime({
      nextopEnv: "production",
      nodeEnv: "development"
    }),
    false
  );
});

test("isDesktopDevelopmentRuntime falls back to NODE_ENV when NEXTOP_ENV is unset", () => {
  assert.equal(
    isDesktopDevelopmentRuntime({
      nextopEnv: undefined,
      nodeEnv: "development"
    }),
    true
  );
  assert.equal(
    isDesktopDevelopmentRuntime({
      nextopEnv: "",
      nodeEnv: "production"
    }),
    false
  );
});
