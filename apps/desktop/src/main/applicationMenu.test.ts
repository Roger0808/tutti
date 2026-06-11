import assert from "node:assert/strict";
import test from "node:test";
import { createApplicationMenuTemplate } from "./applicationMenu.ts";

test("application menu exposes developer log export from Help", async () => {
  let exported = false;
  const menu = createApplicationMenuTemplate({
    exportDeveloperLogs() {
      exported = true;
    },
    platform: "darwin"
  });

  const helpMenu = menu.find((item) => item.label === "Help");
  assert.ok(helpMenu);
  assert.ok(Array.isArray(helpMenu.submenu));
  const exportItem = helpMenu.submenu.find(
    (item) => item.label === "Export Service Logs..."
  );
  assert.ok(exportItem);

  exportItem.click?.(
    {} as Parameters<NonNullable<typeof exportItem.click>>[0],
    undefined as Parameters<NonNullable<typeof exportItem.click>>[1],
    undefined as unknown as Parameters<NonNullable<typeof exportItem.click>>[2]
  );

  assert.equal(exported, true);
});
