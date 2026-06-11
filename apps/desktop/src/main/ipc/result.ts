import type {
  DesktopApiErrorDetails,
  DesktopIpcResult
} from "../../shared/contracts/ipc";
import { normalizeNextopdError } from "@tutti-os/client-nextopd-ts";
import {
  classifyDesktopErrorCode,
  formatErrorMessage
} from "../../shared/errors/desktopErrors.ts";

export async function toDesktopIpcResult<TResult>(
  operation: () => Promise<TResult>
): Promise<DesktopIpcResult<TResult>> {
  try {
    return {
      ok: true,
      data: await operation()
    };
  } catch (error) {
    return {
      ok: false,
      error: toDesktopIpcError(error)
    };
  }
}

function toDesktopIpcError(error: unknown): DesktopApiErrorDetails {
  const protocolError = normalizeNextopdError(error);
  if (protocolError) {
    return {
      code: protocolError.code,
      message: formatErrorMessage(protocolError),
      reason: protocolError.reason,
      params:
        Object.keys(protocolError.params).length > 0
          ? protocolError.params
          : undefined,
      retryable: protocolError.retryable || undefined,
      developerMessage: protocolError.developerMessage,
      correlationId: protocolError.correlationId
    };
  }

  return {
    code: classifyDesktopErrorCode(error),
    message: formatErrorMessage(error)
  };
}
