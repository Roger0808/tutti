package api

import (
	"context"
	"testing"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	workspacebiz "github.com/tutti-os/tutti/services/nextopd/biz/workspace"
	workspaceservice "github.com/tutti-os/tutti/services/nextopd/service/workspace"
)

func TestUpdateWorkspaceDoesNotTrackWorkspaceRenamedAfterSuccessfulUpdate(t *testing.T) {
	reporter := &recordingAnalyticsReporter{}
	api := DaemonAPI{
		AnalyticsReporter: reporter,
		WorkspaceService: stubCatalogService{
			updateFn: func(_ context.Context, workspaceID string, input workspaceservice.UpdateInput) (workspacebiz.Summary, error) {
				return workspacebiz.Summary{
					ID:   workspaceID,
					Name: input.Name,
				}, nil
			},
		},
	}

	response, err := api.UpdateWorkspace(context.Background(), nextopgenerated.UpdateWorkspaceRequestObject{
		WorkspaceID: nextopgenerated.WorkspaceID("ws-1"),
		Body: &nextopgenerated.UpdateWorkspaceRequest{
			Name: "Renamed Workspace",
		},
	})
	if err != nil {
		t.Fatalf("UpdateWorkspace() error = %v", err)
	}
	if _, ok := response.(nextopgenerated.UpdateWorkspace200JSONResponse); !ok {
		t.Fatalf("response = %T, want %T", response, nextopgenerated.UpdateWorkspace200JSONResponse{})
	}
	if len(reporter.events) != 0 {
		t.Fatalf("analytics events = %d, want 0", len(reporter.events))
	}
}
