export interface DesktopNotificationShowInput {
  body?: string;
  title: string;
}

export interface DesktopNotificationShowResult {
  reason?: "unsupported";
  shown: boolean;
}

interface DesktopNotificationInstance {
  on(
    event: "failed",
    listener: (event: unknown, error: string) => void
  ): DesktopNotificationInstance;
  on(
    event: "click",
    listener: (event: unknown) => void
  ): DesktopNotificationInstance;
  show(): void;
}

export interface DesktopNotificationAccessDependencies {
  createNotification(
    input: DesktopNotificationShowInput
  ): DesktopNotificationInstance;
  isSupported(): boolean;
  onClick?: () => void;
  onFailed?: (error: string) => void;
}

export interface DesktopNotificationAccess {
  show(input: DesktopNotificationShowInput): DesktopNotificationShowResult;
}

export function createDesktopNotificationAccess(
  dependencies: DesktopNotificationAccessDependencies
): DesktopNotificationAccess {
  return {
    show(input) {
      if (!dependencies.isSupported()) {
        return {
          reason: "unsupported",
          shown: false
        };
      }

      const notification = dependencies.createNotification({
        ...input
      });
      notification.on("failed", (_event, error) => {
        dependencies.onFailed?.(error);
      });
      notification.on("click", () => {
        dependencies.onClick?.();
      });
      notification.show();
      return { shown: true };
    }
  };
}
