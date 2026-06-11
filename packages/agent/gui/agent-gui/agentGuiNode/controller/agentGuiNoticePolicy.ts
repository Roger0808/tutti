import { translate } from "../../../i18n/index";
import type { AppErrorCode } from "../../../shared/contracts/dto";
import { getAppErrorCode } from "../../../shared/errors/appError";
import type {
  AgentGUIInlineNotice,
  AgentGUISessionChrome
} from "../model/agentGuiNodeTypes";

export const AGENT_PROVIDER_SESSION_NOT_FOUND_ERROR =
  "agent.provider_session_not_found";
export const AGENT_RESUME_SESSION_NOT_LOCAL_ERROR =
  "agent.resume_session_not_local";
export const AGENT_SETTINGS_REQUIRE_NEW_SESSION_ERROR =
  "agent.settings_require_new_session";
export const AGENT_SESSION_NOT_FOUND_ERROR = "session.not_found";
export const AGENT_GUI_WARNING_INLINE_AUTO_DISMISS_MS = 2_000;

const AGENT_PROVIDER_SESSION_NOT_FOUND_FALLBACK_MESSAGE =
  "The previous agent session can no longer be restored.";
const AGENT_RESUME_SESSION_NOT_LOCAL_FALLBACK_MESSAGE =
  "The previous agent session is not available on this machine.";
const AGENT_SETTINGS_REQUIRE_NEW_SESSION_FALLBACK_MESSAGE =
  "This model can only be used in a new session to preserve context.";

type AgentGUIFollowupAction = NonNullable<
  NonNullable<AgentGUISessionChrome["recovery"]>["followupAction"]
>;

export interface AgentGUIResolvedNotice {
  code: AppErrorCode | null;
  message: string;
  tone: AgentGUIInlineNotice["tone"];
  surface: "inline" | "recovery";
  autoDismissMs: number | null;
  canRetry: boolean;
  followupAction?: AgentGUIFollowupAction;
}

export function getAgentGUIErrorCode(error: unknown): AppErrorCode | null {
  return (
    getAppErrorCode(error) ??
    inferAgentGUIErrorCodeFromMessage(getAgentGUIRawErrorMessage(error))
  );
}

export function inferAgentGUIErrorCodeFromMessage(
  message: string | null
): AppErrorCode | null {
  if (!message) {
    return null;
  }
  switch (message.trim()) {
    case AGENT_PROVIDER_SESSION_NOT_FOUND_FALLBACK_MESSAGE:
      return AGENT_PROVIDER_SESSION_NOT_FOUND_ERROR as AppErrorCode;
    case AGENT_RESUME_SESSION_NOT_LOCAL_FALLBACK_MESSAGE:
      return AGENT_RESUME_SESSION_NOT_LOCAL_ERROR as AppErrorCode;
    case AGENT_SETTINGS_REQUIRE_NEW_SESSION_FALLBACK_MESSAGE:
      return AGENT_SETTINGS_REQUIRE_NEW_SESSION_ERROR as AppErrorCode;
    default:
      return null;
  }
}

export function isProviderSessionNotFoundErrorCode(
  code: AppErrorCode | null | undefined
): boolean {
  return code === AGENT_PROVIDER_SESSION_NOT_FOUND_ERROR;
}

export function isResumeSessionNotLocalErrorCode(
  code: AppErrorCode | null | undefined
): boolean {
  return code === AGENT_RESUME_SESSION_NOT_LOCAL_ERROR;
}

export function isNonRetryableResumeErrorCode(
  code: AppErrorCode | null | undefined
): boolean {
  return (
    isProviderSessionNotFoundErrorCode(code) ||
    isResumeSessionNotLocalErrorCode(code)
  );
}

export function isSessionNotFoundErrorCode(
  code: AppErrorCode | null | undefined
): boolean {
  return code === AGENT_SESSION_NOT_FOUND_ERROR;
}

export function isSettingsRequireNewSessionErrorCode(
  code: AppErrorCode | null | undefined
): boolean {
  return code === AGENT_SETTINGS_REQUIRE_NEW_SESSION_ERROR;
}

export function buildProviderSessionNotFoundActivationError(
  message?: string | null
): {
  code: AppErrorCode;
  message: string;
  debugMessage?: string;
} {
  const localizedMessage = translate("messages.agentProviderSessionNotFound");
  const normalizedMessage =
    typeof message === "string" && message.trim() ? message.trim() : null;
  return {
    code: AGENT_PROVIDER_SESSION_NOT_FOUND_ERROR as AppErrorCode,
    message: localizedMessage,
    ...(normalizedMessage ? { debugMessage: normalizedMessage } : {})
  };
}

export function buildResumeSessionNotLocalActivationError(
  message?: string | null
): {
  code: AppErrorCode;
  message: string;
  debugMessage?: string;
} {
  const normalizedMessage =
    typeof message === "string" && message.trim() ? message.trim() : null;
  return {
    code: AGENT_RESUME_SESSION_NOT_LOCAL_ERROR as AppErrorCode,
    message: translate("messages.agentResumeSessionNotLocal"),
    ...(normalizedMessage ? { debugMessage: normalizedMessage } : {})
  };
}

export function getAgentGUIErrorMessage(error: unknown): string {
  const code = getAgentGUIErrorCode(error);
  if (isProviderSessionNotFoundErrorCode(code)) {
    return translate("messages.agentProviderSessionNotFound");
  }
  if (isResumeSessionNotLocalErrorCode(code)) {
    return translate("messages.agentResumeSessionNotLocal");
  }
  if (isSettingsRequireNewSessionErrorCode(code)) {
    return translate("messages.agentSettingsRequireNewSession");
  }
  if (error && typeof error === "object") {
    const debugMessage = (error as { debugMessage?: unknown }).debugMessage;
    if (typeof debugMessage === "string" && debugMessage.trim()) {
      return debugMessage.trim();
    }
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }
  return error instanceof Error ? error.message : String(error);
}

export function getAgentGUIRawErrorMessage(error: unknown): string | null {
  if (error && typeof error === "object") {
    const debugMessage = (error as { debugMessage?: unknown }).debugMessage;
    if (typeof debugMessage === "string" && debugMessage.trim()) {
      return debugMessage.trim();
    }
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  return null;
}

export function resolveAgentGUIErrorNotice(
  error: unknown
): AgentGUIResolvedNotice {
  return classifyAgentGUIErrorNotice({
    code: getAgentGUIErrorCode(error),
    message: getAgentGUIErrorMessage(error)
  });
}

export function resolveAgentGUIInlineNotice(
  error: unknown
): Omit<AgentGUIInlineNotice, "id"> {
  const notice = resolveAgentGUIErrorNotice(error);
  return {
    message: notice.message,
    tone: notice.tone,
    autoDismissMs: notice.autoDismissMs
  };
}

export function resolveAgentGUIRecoveryNotice(input: {
  message: string | null;
  code?: AppErrorCode | null;
}): AgentGUISessionChrome["recovery"] {
  const normalizedMessage = input.message?.trim() ?? "";
  if (normalizedMessage === "") {
    return null;
  }
  const code =
    input.code ?? inferAgentGUIErrorCodeFromMessage(normalizedMessage);
  const notice = classifyAgentGUIErrorNotice({
    code,
    message: getAgentGUIErrorMessage(
      code
        ? {
            code,
            message: normalizedMessage,
            debugMessage: normalizedMessage
          }
        : normalizedMessage
    )
  });
  return {
    kind: notice.tone === "warning" ? "warning" : "failed",
    message: notice.message,
    canRetry: notice.canRetry,
    ...(notice.followupAction ? { followupAction: notice.followupAction } : {})
  };
}

function classifyAgentGUIErrorNotice(input: {
  code: AppErrorCode | null;
  message: string;
}): AgentGUIResolvedNotice {
  if (isSettingsRequireNewSessionErrorCode(input.code)) {
    return {
      code: input.code,
      message: input.message,
      tone: "warning",
      surface: "inline",
      autoDismissMs: AGENT_GUI_WARNING_INLINE_AUTO_DISMISS_MS,
      canRetry: false
    };
  }

  if (isProviderSessionNotFoundErrorCode(input.code)) {
    return {
      code: input.code,
      message: input.message,
      tone: "error",
      surface: "recovery",
      autoDismissMs: null,
      canRetry: false
    };
  }

  if (isResumeSessionNotLocalErrorCode(input.code)) {
    return {
      code: input.code,
      message: input.message,
      tone: "error",
      surface: "recovery",
      autoDismissMs: null,
      canRetry: false,
      followupAction: "continue-in-new-conversation"
    };
  }

  return {
    code: input.code,
    message: input.message,
    tone: "error",
    surface: "inline",
    autoDismissMs: null,
    canRetry: true
  };
}
