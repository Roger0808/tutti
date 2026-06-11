import type { ApiErrorDetails, ApiErrorResponse } from "./generated/index.ts";

export type NextopdProtocolErrorCode = ApiErrorDetails["code"];
export type NextopdProtocolErrorParams = NonNullable<ApiErrorDetails["params"]>;

const nextopdProtocolErrorCodes = new Set<NextopdProtocolErrorCode>([
  "invalid_request",
  "method_not_allowed",
  "unauthorized",
  "service_unavailable",
  "workspace_not_found",
  "workspace_file_not_found",
  "workspace_issue_resource_exists",
  "workspace_issue_resource_not_found",
  "workspace_terminal_not_found",
  "workspace_app_not_found",
  "workspace_operation_failed",
  "preferences_operation_failed"
]);

export interface NextopdProtocolErrorOptions {
  code: NextopdProtocolErrorCode;
  correlationId?: string;
  developerMessage?: string;
  params?: NextopdProtocolErrorParams;
  reason?: string;
  retryable?: boolean;
  statusCode: number;
}

export class NextopdProtocolError extends Error {
  readonly code: NextopdProtocolErrorCode;
  readonly correlationId?: string;
  readonly developerMessage?: string;
  readonly params: NextopdProtocolErrorParams;
  readonly reason?: string;
  readonly retryable: boolean;
  readonly statusCode: number;

  constructor(options: NextopdProtocolErrorOptions) {
    super(
      options.developerMessage ??
        `nextopd request failed with protocol code ${options.code}`
    );
    this.name = "NextopdProtocolError";
    this.code = options.code;
    this.correlationId = options.correlationId;
    this.developerMessage = options.developerMessage;
    this.params = options.params ?? {};
    this.reason = options.reason;
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode;
  }
}

export function isNextopdProtocolError(
  error: unknown
): error is NextopdProtocolError {
  return error instanceof NextopdProtocolError;
}

export function getNextopdProtocolErrorCode(error: unknown): string | null {
  const normalizedError = normalizeNextopdError(error);
  return normalizedError?.code ?? null;
}

export function normalizeNextopdError(
  error: unknown,
  statusCode = 0
): NextopdProtocolError | null {
  if (error instanceof NextopdProtocolError) {
    return error;
  }

  const details = extractProtocolErrorDetails(error);
  if (!details) {
    return null;
  }

  return new NextopdProtocolError({
    code: details.code,
    correlationId: details.correlationId,
    developerMessage: details.developerMessage,
    params: details.params,
    reason: details.reason,
    retryable: details.retryable,
    statusCode
  });
}

export function getNextopdErrorI18nCandidates(error: unknown): string[] {
  const normalizedError = normalizeNextopdError(error);
  if (!normalizedError) {
    return [];
  }

  const candidates: string[] = [];
  if (normalizedError.reason) {
    candidates.push(`errors.${normalizedError.code}.${normalizedError.reason}`);
  }
  candidates.push(`errors.${normalizedError.code}.default`);
  candidates.push(`errors.${normalizedError.code}`);
  return candidates;
}

function extractProtocolErrorDetails(error: unknown): ApiErrorDetails | null {
  if (isApiErrorDetails(error)) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    isApiErrorDetails((error as ApiErrorResponse).error)
  ) {
    return (error as ApiErrorResponse).error;
  }

  return null;
}

function isApiErrorDetails(value: unknown): value is ApiErrorDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof value.code === "string" &&
    nextopdProtocolErrorCodes.has(value.code as NextopdProtocolErrorCode)
  );
}
