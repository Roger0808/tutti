package workspace_unavailable

import (
	"context"

	reporterservice "github.com/tutti-os/tutti/services/nextopd/service/reporter"
	reporterevents "github.com/tutti-os/tutti/services/nextopd/service/reporter/events"
)

type Params map[string]any

func Track(ctx context.Context, reporter reporterservice.Reporter, params Params) {
	reporterevents.Track(ctx, reporter, "error.workspace_unavailable", map[string]any(params))
}
