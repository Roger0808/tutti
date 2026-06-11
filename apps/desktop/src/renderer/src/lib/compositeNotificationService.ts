import type {
  NotificationInput,
  NotificationLevel,
  NotificationMessage,
  NotificationService
} from "@tutti-os/ui-notifications";

export interface ForegroundNotificationPresenter {
  show(input: NotificationMessage): void;
}

export interface BackgroundNotificationPresenter {
  show(input: NotificationMessage): Promise<void> | void;
}

export interface HostBackgroundNotificationsApi {
  show(input: {
    body?: string;
    level: NotificationLevel;
    title: string;
  }): Promise<unknown> | void;
}

export interface NotificationVisibilityState {
  isForeground(): boolean;
}

export interface DocumentNotificationVisibilitySource {
  hasFocus(): boolean;
  visibilityState(): DocumentVisibilityState;
}

export interface BackgroundNotificationPolicy {
  shouldNotifyInBackground(input: NotificationMessage): boolean;
}

export function createDefaultBackgroundNotificationPolicy(): BackgroundNotificationPolicy {
  return {
    shouldNotifyInBackground() {
      return true;
    }
  };
}

export function createHostBackgroundNotificationPresenter(
  hostNotificationsApi: HostBackgroundNotificationsApi
): BackgroundNotificationPresenter {
  return {
    async show(input) {
      await hostNotificationsApi.show({
        body: input.description,
        level: input.level,
        title: input.title
      });
    }
  };
}

export function createDocumentNotificationVisibilityState(
  source: DocumentNotificationVisibilitySource
): NotificationVisibilityState {
  return {
    isForeground() {
      return source.visibilityState() === "visible" && source.hasFocus();
    }
  };
}

export function createCompositeNotificationService(input: {
  background: BackgroundNotificationPresenter;
  foreground: ForegroundNotificationPresenter;
  policy: BackgroundNotificationPolicy;
  visibility: NotificationVisibilityState;
}): NotificationService {
  const notify = (message: NotificationMessage): void => {
    input.foreground.show(message);
    if (
      !input.visibility.isForeground() &&
      input.policy.shouldNotifyInBackground(message)
    ) {
      showBackgroundNotification(input.background, message);
    }
  };

  return {
    _serviceBrand: undefined,
    notify,
    success(message) {
      notifyWithLevel(notify, "success", message);
    },
    error(message) {
      notifyWithLevel(notify, "error", message);
    },
    info(message) {
      notifyWithLevel(notify, "info", message);
    },
    warning(message) {
      notifyWithLevel(notify, "warning", message);
    }
  };
}

function showBackgroundNotification(
  background: BackgroundNotificationPresenter,
  message: NotificationMessage
): void {
  try {
    void Promise.resolve(background.show(message)).catch(() => undefined);
  } catch {
    // Background notifications are best-effort; foreground feedback already ran.
  }
}

function notifyWithLevel(
  notify: (message: NotificationMessage) => void,
  level: NotificationLevel,
  message: NotificationInput
): void {
  notify({
    ...message,
    level
  });
}
