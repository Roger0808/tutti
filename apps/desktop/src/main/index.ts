import { app } from "electron";
import { bootstrapDesktopApp } from "./bootstrap";
import { recordStartupFailureEvent } from "./startupFailureAnalytics.ts";

void bootstrapDesktopApp().catch(async (error) => {
  await recordStartupFailureEvent({
    error,
    name: "app.startup_failed",
    process: "main"
  }).catch((recordError) => {
    process.stderr.write(
      `[desktop] record startup failure analytics failed: ${recordError instanceof Error ? (recordError.stack ?? recordError.message) : String(recordError)}\n`
    );
  });
  process.stderr.write(
    `[desktop] bootstrap failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`
  );
  app.exit(1);
});
