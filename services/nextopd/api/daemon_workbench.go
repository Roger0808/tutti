package api

import (
	"context"
	"strings"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	workspaceapi "github.com/tutti-os/tutti/services/nextopd/api/workspace"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
)

func (api DaemonAPI) GetWorkspaceWorkbench(ctx context.Context, request nextopgenerated.GetWorkspaceWorkbenchRequestObject) (nextopgenerated.GetWorkspaceWorkbenchResponseObject, error) {
	if api.WorkbenchService == nil {
		return nextopgenerated.GetWorkspaceWorkbench503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceWorkbenchUnavailable(apierrors.WithDeveloperMessage("workspace workbench service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.GetWorkspaceWorkbench400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	snapshot, err := api.WorkbenchService.GetSnapshot(ctx, workspaceID)
	if err != nil {
		return writeGetWorkspaceWorkbenchError(err), nil
	}

	response, err := workspaceapi.GeneratedWorkbenchResponseFromBiz(snapshot)
	if err != nil {
		return nextopgenerated.GetWorkspaceWorkbench502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(
				apierrors.WorkspaceOperationFailed(apierrors.WithCause(err)),
			),
		}, nil
	}

	return nextopgenerated.GetWorkspaceWorkbench200JSONResponse(response), nil
}

func (api DaemonAPI) PutWorkspaceWorkbench(ctx context.Context, request nextopgenerated.PutWorkspaceWorkbenchRequestObject) (nextopgenerated.PutWorkspaceWorkbenchResponseObject, error) {
	if api.WorkbenchService == nil {
		return nextopgenerated.PutWorkspaceWorkbench503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceWorkbenchUnavailable(apierrors.WithDeveloperMessage("workspace workbench service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.PutWorkspaceWorkbench400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	if request.Body == nil {
		return nextopgenerated.PutWorkspaceWorkbench400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	snapshotInput := workspaceapi.WorkbenchSnapshotFromGenerated(request.Body.Snapshot)
	snapshot, err := api.WorkbenchService.PutSnapshot(ctx, workspaceID, snapshotInput)
	if err != nil {
		return writePutWorkspaceWorkbenchError(err), nil
	}

	response, err := workspaceapi.GeneratedWorkbenchResponseFromBiz(snapshot)
	if err != nil {
		return nextopgenerated.PutWorkspaceWorkbench502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(
				apierrors.WorkspaceOperationFailed(apierrors.WithCause(err)),
			),
		}, nil
	}

	return nextopgenerated.PutWorkspaceWorkbench200JSONResponse(response), nil
}
