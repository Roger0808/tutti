package agentruntime

import "testing"

func TestIsACPProviderSessionNotFoundAcceptsResourceSuffixDetails(t *testing.T) {
	t.Parallel()

	callErr := &acpCallError{
		Method: acpMethodLoadSession,
		Err: acpError{
			Code:    -32002,
			Message: "Resource not found: a4009694-9d5c-48be-8480-6d1e0ede5410",
		},
	}

	if !isACPProviderSessionNotFound(acpMethodLoadSession, callErr) {
		t.Fatalf("expected load-session missing resource error with suffix details to be classified as provider session missing")
	}
}
