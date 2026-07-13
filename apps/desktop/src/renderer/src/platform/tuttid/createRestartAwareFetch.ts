import type { DesktopRuntimeApi } from "@preload/types";

type BackendConfigRuntimeApi = Pick<DesktopRuntimeApi, "getBackendConfig">;

export function createRestartAwareFetch(
  runtimeApi: BackendConfigRuntimeApi,
  nativeFetch: typeof fetch = globalThis.fetch.bind(globalThis)
): typeof fetch {
  return async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const config = await runtimeApi.getBackendConfig();
    const requestUrl = new URL(request.url);
    const backendUrl = new URL(config.baseUrl);
    const rewrittenUrl = new URL(
      `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`,
      backendUrl.origin
    );
    const rewrittenRequest = new Request(rewrittenUrl, request);

    rewrittenRequest.headers.set(
      "Authorization",
      `Bearer ${config.accessToken}`
    );

    return nativeFetch(rewrittenRequest);
  };
}
