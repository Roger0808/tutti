package api

import (
	"context"
	"strings"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	workspaceapi "github.com/tutti-os/tutti/services/nextopd/api/workspace"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
	workspaceservice "github.com/tutti-os/tutti/services/nextopd/service/workspace"
)

func (api DaemonAPI) ListWorkspaces(ctx context.Context, _ nextopgenerated.ListWorkspacesRequestObject) (nextopgenerated.ListWorkspacesResponseObject, error) {
	if api.WorkspaceService == nil {
		return nextopgenerated.ListWorkspaces503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceServiceUnavailable(apierrors.WithDeveloperMessage("workspace service is unavailable")),
			),
		}, nil
	}

	workspaces, err := api.WorkspaceService.List(ctx)
	if err != nil {
		return nextopgenerated.ListWorkspaces502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(
				apierrors.WorkspaceOperationFailed(apierrors.WithCause(err)),
			),
		}, nil
	}

	return nextopgenerated.ListWorkspaces200JSONResponse{
		Workspaces: workspaceapi.GeneratedSummariesFromBiz(workspaces),
		TotalCount: len(workspaces),
	}, nil
}

func (api DaemonAPI) CreateWorkspace(ctx context.Context, request nextopgenerated.CreateWorkspaceRequestObject) (nextopgenerated.CreateWorkspaceResponseObject, error) {
	if api.WorkspaceService == nil {
		return nextopgenerated.CreateWorkspace503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceServiceUnavailable(apierrors.WithDeveloperMessage("workspace service is unavailable")),
			),
		}, nil
	}

	if request.Body == nil {
		return nextopgenerated.CreateWorkspace400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	name := strings.TrimSpace(request.Body.Name)
	if name == "" {
		return nextopgenerated.CreateWorkspace400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceName(
					apierrors.WithDeveloperMessage("workspace name is required"),
					apierrors.WithParams(map[string]any{"field": "name"}),
				),
			),
		}, nil
	}

	workspace, err := api.WorkspaceService.Create(ctx, workspaceservice.CreateInput{
		Name: name,
	})
	if err != nil {
		return writeCreateWorkspaceError(err), nil
	}

	return nextopgenerated.CreateWorkspace201JSONResponse(workspaceapi.GeneratedEnvelopeResponseFromBiz(workspace)), nil
}

func (api DaemonAPI) GetStartupWorkspace(ctx context.Context, _ nextopgenerated.GetStartupWorkspaceRequestObject) (nextopgenerated.GetStartupWorkspaceResponseObject, error) {
	if api.WorkspaceService == nil {
		return nextopgenerated.GetStartupWorkspace503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceServiceUnavailable(apierrors.WithDeveloperMessage("workspace service is unavailable")),
			),
		}, nil
	}

	response, err := api.WorkspaceService.Startup(ctx)
	if err != nil {
		return nextopgenerated.GetStartupWorkspace502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(
				apierrors.WorkspaceOperationFailed(apierrors.WithCause(err)),
			),
		}, nil
	}

	return nextopgenerated.GetStartupWorkspace200JSONResponse(workspaceapi.GeneratedStartupResponseFromBiz(response)), nil
}

func (api DaemonAPI) DeleteWorkspace(ctx context.Context, request nextopgenerated.DeleteWorkspaceRequestObject) (nextopgenerated.DeleteWorkspaceResponseObject, error) {
	if api.WorkspaceService == nil {
		return nextopgenerated.DeleteWorkspace503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceServiceUnavailable(apierrors.WithDeveloperMessage("workspace service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.DeleteWorkspace400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	response, err := api.WorkspaceService.Delete(ctx, workspaceID)
	if err != nil {
		return writeDeleteWorkspaceError(err), nil
	}

	return nextopgenerated.DeleteWorkspace200JSONResponse{
		WorkspaceId: response.WorkspaceID,
	}, nil
}

func (api DaemonAPI) GetWorkspace(ctx context.Context, request nextopgenerated.GetWorkspaceRequestObject) (nextopgenerated.GetWorkspaceResponseObject, error) {
	if api.WorkspaceService == nil {
		return nextopgenerated.GetWorkspace503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceServiceUnavailable(apierrors.WithDeveloperMessage("workspace service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.GetWorkspace400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	workspace, err := api.WorkspaceService.Get(ctx, workspaceID)
	if err != nil {
		return writeGetWorkspaceError(err), nil
	}

	return nextopgenerated.GetWorkspace200JSONResponse(workspaceapi.GeneratedEnvelopeResponseFromBiz(workspace)), nil
}

func (api DaemonAPI) UpdateWorkspace(ctx context.Context, request nextopgenerated.UpdateWorkspaceRequestObject) (nextopgenerated.UpdateWorkspaceResponseObject, error) {
	if api.WorkspaceService == nil {
		return nextopgenerated.UpdateWorkspace503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceServiceUnavailable(apierrors.WithDeveloperMessage("workspace service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.UpdateWorkspace400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	if request.Body == nil {
		return nextopgenerated.UpdateWorkspace400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	name := strings.TrimSpace(request.Body.Name)
	if name == "" {
		return nextopgenerated.UpdateWorkspace400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceName(
					apierrors.WithDeveloperMessage("workspace name is required"),
					apierrors.WithParams(map[string]any{"field": "name"}),
				),
			),
		}, nil
	}

	workspace, err := api.WorkspaceService.Update(ctx, workspaceID, workspaceservice.UpdateInput{
		Name: name,
	})
	if err != nil {
		return writeUpdateWorkspaceError(err), nil
	}

	return nextopgenerated.UpdateWorkspace200JSONResponse(workspaceapi.GeneratedEnvelopeResponseFromBiz(workspace)), nil
}

func (api DaemonAPI) OpenWorkspace(ctx context.Context, request nextopgenerated.OpenWorkspaceRequestObject) (nextopgenerated.OpenWorkspaceResponseObject, error) {
	if api.WorkspaceService == nil {
		return nextopgenerated.OpenWorkspace503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceServiceUnavailable(apierrors.WithDeveloperMessage("workspace service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.OpenWorkspace400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	workspace, err := api.WorkspaceService.Open(ctx, workspaceID)
	if err != nil {
		return writeOpenWorkspaceError(err), nil
	}

	return nextopgenerated.OpenWorkspace200JSONResponse(workspaceapi.GeneratedEnvelopeResponseFromBiz(workspace)), nil
}
