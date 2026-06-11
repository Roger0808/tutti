package api

import (
	"context"
	"strings"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	workspaceapi "github.com/tutti-os/tutti/services/nextopd/api/workspace"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
)

func workspaceAppServiceUnavailableError() nextopgenerated.ServiceUnavailableErrorJSONResponse {
	return serviceUnavailableError(
		apierrors.WorkspaceAppServiceUnavailable(
			apierrors.WithDeveloperMessage("workspace app service is unavailable"),
		),
	)
}

func (api DaemonAPI) ListWorkspaceApps(ctx context.Context, request nextopgenerated.ListWorkspaceAppsRequestObject) (nextopgenerated.ListWorkspaceAppsResponseObject, error) {
	if api.AppCenterService == nil {
		return nextopgenerated.ListWorkspaceApps503JSONResponse{
			ServiceUnavailableErrorJSONResponse: workspaceAppServiceUnavailableError(),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.ListWorkspaceApps400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	apps, err := api.AppCenterService.List(ctx, workspaceID)
	if err != nil {
		return writeListWorkspaceAppsError(err), nil
	}

	return nextopgenerated.ListWorkspaceApps200JSONResponse{
		WorkspaceId:   workspaceID,
		CatalogStatus: workspaceapi.GeneratedAppCatalogLoadStateFromBiz(api.AppCenterService.CatalogLoadState()),
		Apps:          workspaceapi.GeneratedAppsFromBiz(apps),
	}, nil
}

func (api DaemonAPI) RefreshWorkspaceAppCatalog(ctx context.Context, request nextopgenerated.RefreshWorkspaceAppCatalogRequestObject) (nextopgenerated.RefreshWorkspaceAppCatalogResponseObject, error) {
	if api.AppCenterService == nil {
		return nextopgenerated.RefreshWorkspaceAppCatalog503JSONResponse{
			ServiceUnavailableErrorJSONResponse: workspaceAppServiceUnavailableError(),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.RefreshWorkspaceAppCatalog400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	apps, err := api.AppCenterService.RefreshCatalog(ctx, workspaceID)
	if err != nil {
		return writeRefreshWorkspaceAppCatalogError(err), nil
	}

	return nextopgenerated.RefreshWorkspaceAppCatalog200JSONResponse{
		WorkspaceId:   workspaceID,
		CatalogStatus: workspaceapi.GeneratedAppCatalogLoadStateFromBiz(api.AppCenterService.CatalogLoadState()),
		Apps:          workspaceapi.GeneratedAppsFromBiz(apps),
	}, nil
}

func (api DaemonAPI) InstallWorkspaceApp(ctx context.Context, request nextopgenerated.InstallWorkspaceAppRequestObject) (nextopgenerated.InstallWorkspaceAppResponseObject, error) {
	if api.AppCenterService == nil {
		return nextopgenerated.InstallWorkspaceApp503JSONResponse{
			ServiceUnavailableErrorJSONResponse: workspaceAppServiceUnavailableError(),
		}, nil
	}

	workspaceID, appID, errResponse := validateWorkspaceAppPath(request.WorkspaceID, request.AppID)
	if errResponse != nil {
		return nextopgenerated.InstallWorkspaceApp400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}

	app, err := api.AppCenterService.Install(ctx, workspaceID, appID)
	if err != nil {
		return writeInstallWorkspaceAppError(err), nil
	}

	return nextopgenerated.InstallWorkspaceApp200JSONResponse{
		WorkspaceId: workspaceID,
		App:         workspaceapi.GeneratedAppFromBiz(app),
	}, nil
}

func (api DaemonAPI) ImportWorkspaceApp(ctx context.Context, request nextopgenerated.ImportWorkspaceAppRequestObject) (nextopgenerated.ImportWorkspaceAppResponseObject, error) {
	if api.AppCenterService == nil {
		return nextopgenerated.ImportWorkspaceApp503JSONResponse{
			ServiceUnavailableErrorJSONResponse: workspaceAppServiceUnavailableError(),
		}, nil
	}
	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.ImportWorkspaceApp400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}
	if request.Body == nil || strings.TrimSpace(request.Body.ArchivePath) == "" {
		return nextopgenerated.ImportWorkspaceApp400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MalformedRequest(
					apierrors.WithDeveloperMessage("workspace app archive path is required"),
					apierrors.WithParams(map[string]any{"field": "archivePath"}),
				),
			),
		}, nil
	}
	if _, err := api.WorkspaceService.Get(ctx, workspaceID); err != nil {
		return writeImportWorkspaceAppError(err), nil
	}

	app, err := api.AppCenterService.ImportPackage(ctx, request.Body.ArchivePath)
	if err != nil {
		return writeImportWorkspaceAppError(err), nil
	}
	return nextopgenerated.ImportWorkspaceApp200JSONResponse{
		WorkspaceId: workspaceID,
		App:         workspaceapi.GeneratedAppFromBiz(app),
	}, nil
}

func (api DaemonAPI) ExportWorkspaceApp(ctx context.Context, request nextopgenerated.ExportWorkspaceAppRequestObject) (nextopgenerated.ExportWorkspaceAppResponseObject, error) {
	if api.AppCenterService == nil {
		return nextopgenerated.ExportWorkspaceApp503JSONResponse{
			ServiceUnavailableErrorJSONResponse: workspaceAppServiceUnavailableError(),
		}, nil
	}
	workspaceID, appID, errResponse := validateWorkspaceAppPath(request.WorkspaceID, request.AppID)
	if errResponse != nil {
		return nextopgenerated.ExportWorkspaceApp400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}
	if request.Body == nil || strings.TrimSpace(request.Body.DestinationPath) == "" {
		return nextopgenerated.ExportWorkspaceApp400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MalformedRequest(
					apierrors.WithDeveloperMessage("workspace app export destination path is required"),
					apierrors.WithParams(map[string]any{"field": "destinationPath"}),
				),
			),
		}, nil
	}
	if _, err := api.WorkspaceService.Get(ctx, workspaceID); err != nil {
		return writeExportWorkspaceAppError(err), nil
	}

	version := ""
	if request.Body.Version != nil {
		version = *request.Body.Version
	}
	result, err := api.AppCenterService.ExportPackage(ctx, appID, version, request.Body.DestinationPath)
	if err != nil {
		return writeExportWorkspaceAppError(err), nil
	}
	return nextopgenerated.ExportWorkspaceApp200JSONResponse{
		WorkspaceId:       workspaceID,
		AppId:             result.AppID,
		Version:           result.Version,
		ArchivePath:       result.Path,
		ArtifactSha256:    result.ArtifactSHA256,
		ArtifactSizeBytes: result.ArtifactSizeBytes,
	}, nil
}

func (api DaemonAPI) ReplaceWorkspaceAppIcon(ctx context.Context, request nextopgenerated.ReplaceWorkspaceAppIconRequestObject) (nextopgenerated.ReplaceWorkspaceAppIconResponseObject, error) {
	if api.AppCenterService == nil {
		return nextopgenerated.ReplaceWorkspaceAppIcon503JSONResponse{
			ServiceUnavailableErrorJSONResponse: workspaceAppServiceUnavailableError(),
		}, nil
	}
	workspaceID, appID, errResponse := validateWorkspaceAppPath(request.WorkspaceID, request.AppID)
	if errResponse != nil {
		return nextopgenerated.ReplaceWorkspaceAppIcon400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}
	if request.Body == nil || strings.TrimSpace(request.Body.SourcePath) == "" {
		return nextopgenerated.ReplaceWorkspaceAppIcon400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MalformedRequest(
					apierrors.WithDeveloperMessage("workspace app icon source path is required"),
					apierrors.WithParams(map[string]any{"field": "sourcePath"}),
				),
			),
		}, nil
	}

	app, err := api.AppCenterService.ReplaceIcon(ctx, workspaceID, appID, request.Body.SourcePath)
	if err != nil {
		return writeReplaceWorkspaceAppIconError(err), nil
	}
	return nextopgenerated.ReplaceWorkspaceAppIcon200JSONResponse{
		WorkspaceId: workspaceID,
		App:         workspaceapi.GeneratedAppFromBiz(app),
	}, nil
}

func (api DaemonAPI) UninstallWorkspaceApp(ctx context.Context, request nextopgenerated.UninstallWorkspaceAppRequestObject) (nextopgenerated.UninstallWorkspaceAppResponseObject, error) {
	if api.AppCenterService == nil {
		return nextopgenerated.UninstallWorkspaceApp503JSONResponse{
			ServiceUnavailableErrorJSONResponse: workspaceAppServiceUnavailableError(),
		}, nil
	}

	workspaceID, appID, errResponse := validateWorkspaceAppPath(request.WorkspaceID, request.AppID)
	if errResponse != nil {
		return nextopgenerated.UninstallWorkspaceApp400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}

	app, err := api.AppCenterService.Uninstall(ctx, workspaceID, appID)
	if err != nil {
		return writeUninstallWorkspaceAppError(err), nil
	}

	return nextopgenerated.UninstallWorkspaceApp200JSONResponse{
		WorkspaceId: workspaceID,
		App:         workspaceapi.GeneratedAppFromBiz(app),
	}, nil
}

func (api DaemonAPI) DeleteWorkspaceApp(ctx context.Context, request nextopgenerated.DeleteWorkspaceAppRequestObject) (nextopgenerated.DeleteWorkspaceAppResponseObject, error) {
	if api.AppCenterService == nil {
		return nextopgenerated.DeleteWorkspaceApp503JSONResponse{
			ServiceUnavailableErrorJSONResponse: workspaceAppServiceUnavailableError(),
		}, nil
	}

	workspaceID, appID, errResponse := validateWorkspaceAppPath(request.WorkspaceID, request.AppID)
	if errResponse != nil {
		return nextopgenerated.DeleteWorkspaceApp400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}

	if err := api.AppCenterService.DeletePackage(ctx, workspaceID, appID); err != nil {
		return writeDeleteWorkspaceAppError(err), nil
	}

	return nextopgenerated.DeleteWorkspaceApp200JSONResponse{
		WorkspaceId: workspaceID,
		AppId:       appID,
		Deleted:     true,
	}, nil
}

func (api DaemonAPI) RetryWorkspaceApp(ctx context.Context, request nextopgenerated.RetryWorkspaceAppRequestObject) (nextopgenerated.RetryWorkspaceAppResponseObject, error) {
	if api.AppCenterService == nil {
		return nextopgenerated.RetryWorkspaceApp503JSONResponse{
			ServiceUnavailableErrorJSONResponse: workspaceAppServiceUnavailableError(),
		}, nil
	}

	workspaceID, appID, errResponse := validateWorkspaceAppPath(request.WorkspaceID, request.AppID)
	if errResponse != nil {
		return nextopgenerated.RetryWorkspaceApp400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}

	app, err := api.AppCenterService.Retry(ctx, workspaceID, appID)
	if err != nil {
		return writeRetryWorkspaceAppError(err), nil
	}

	return nextopgenerated.RetryWorkspaceApp200JSONResponse{
		WorkspaceId: workspaceID,
		App:         workspaceapi.GeneratedAppFromBiz(app),
	}, nil
}

func (api DaemonAPI) RollbackWorkspaceApp(ctx context.Context, request nextopgenerated.RollbackWorkspaceAppRequestObject) (nextopgenerated.RollbackWorkspaceAppResponseObject, error) {
	if api.AppCenterService == nil {
		return nextopgenerated.RollbackWorkspaceApp503JSONResponse{
			ServiceUnavailableErrorJSONResponse: workspaceAppServiceUnavailableError(),
		}, nil
	}
	workspaceID, appID, errResponse := validateWorkspaceAppPath(request.WorkspaceID, request.AppID)
	if errResponse != nil {
		return nextopgenerated.RollbackWorkspaceApp400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}
	if request.Body == nil || strings.TrimSpace(request.Body.Version) == "" {
		return nextopgenerated.RollbackWorkspaceApp400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MalformedRequest(
					apierrors.WithDeveloperMessage("workspace app rollback version is required"),
					apierrors.WithParams(map[string]any{"field": "version"}),
				),
			),
		}, nil
	}

	app, err := api.AppCenterService.Rollback(ctx, workspaceID, appID, request.Body.Version)
	if err != nil {
		return writeRollbackWorkspaceAppError(err), nil
	}
	return nextopgenerated.RollbackWorkspaceApp200JSONResponse{
		WorkspaceId: workspaceID,
		App:         workspaceapi.GeneratedAppFromBiz(app),
	}, nil
}

func (api DaemonAPI) StartEnabledWorkspaceApps(ctx context.Context, request nextopgenerated.StartEnabledWorkspaceAppsRequestObject) (nextopgenerated.StartEnabledWorkspaceAppsResponseObject, error) {
	if api.AppCenterService == nil {
		return nextopgenerated.StartEnabledWorkspaceApps503JSONResponse{
			ServiceUnavailableErrorJSONResponse: workspaceAppServiceUnavailableError(),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.StartEnabledWorkspaceApps400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	apps, err := api.AppCenterService.StartEnabled(ctx, workspaceID)
	if err != nil {
		return writeStartEnabledWorkspaceAppsError(err), nil
	}

	return nextopgenerated.StartEnabledWorkspaceApps200JSONResponse{
		WorkspaceId:   workspaceID,
		CatalogStatus: workspaceapi.GeneratedAppCatalogLoadStateFromBiz(api.AppCenterService.CatalogLoadState()),
		Apps:          workspaceapi.GeneratedAppsFromBiz(apps),
	}, nil
}

func (api DaemonAPI) StopAllWorkspaceApps(ctx context.Context, request nextopgenerated.StopAllWorkspaceAppsRequestObject) (nextopgenerated.StopAllWorkspaceAppsResponseObject, error) {
	if api.AppCenterService == nil {
		return nextopgenerated.StopAllWorkspaceApps503JSONResponse{
			ServiceUnavailableErrorJSONResponse: workspaceAppServiceUnavailableError(),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.StopAllWorkspaceApps400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	apps, err := api.AppCenterService.StopAll(ctx, workspaceID)
	if err != nil {
		return writeStopAllWorkspaceAppsError(err), nil
	}

	return nextopgenerated.StopAllWorkspaceApps200JSONResponse{
		WorkspaceId:   workspaceID,
		CatalogStatus: workspaceapi.GeneratedAppCatalogLoadStateFromBiz(api.AppCenterService.CatalogLoadState()),
		Apps:          workspaceapi.GeneratedAppsFromBiz(apps),
	}, nil
}

func validateWorkspaceAppPath(workspaceIDValue nextopgenerated.WorkspaceID, appIDValue nextopgenerated.WorkspaceAppID) (string, string, *nextopgenerated.InvalidRequestErrorJSONResponse) {
	workspaceID := strings.TrimSpace(string(workspaceIDValue))
	if workspaceID == "" {
		response := invalidRequestError(
			apierrors.MissingWorkspaceID(
				apierrors.WithDeveloperMessage("workspace id is required"),
				apierrors.WithParams(map[string]any{"field": "workspaceId"}),
			),
		)
		return "", "", &response
	}

	appID := strings.TrimSpace(string(appIDValue))
	if appID == "" {
		response := invalidRequestError(
			apierrors.MalformedRequest(
				apierrors.WithDeveloperMessage("workspace app id is required"),
				apierrors.WithParams(map[string]any{"field": "appId"}),
			),
		)
		return "", "", &response
	}

	return workspaceID, appID, nil
}

func writeListWorkspaceAppsError(err error) nextopgenerated.ListWorkspaceAppsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.ListWorkspaceApps404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ListWorkspaceApps400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.ListWorkspaceApps502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeRefreshWorkspaceAppCatalogError(err error) nextopgenerated.RefreshWorkspaceAppCatalogResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.RefreshWorkspaceAppCatalog404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.RefreshWorkspaceAppCatalog400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.RefreshWorkspaceAppCatalog502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeStartEnabledWorkspaceAppsError(err error) nextopgenerated.StartEnabledWorkspaceAppsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.StartEnabledWorkspaceApps404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.StartEnabledWorkspaceApps400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.StartEnabledWorkspaceApps502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeStopAllWorkspaceAppsError(err error) nextopgenerated.StopAllWorkspaceAppsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.StopAllWorkspaceApps404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.StopAllWorkspaceApps400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.StopAllWorkspaceApps502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeInstallWorkspaceAppError(err error) nextopgenerated.InstallWorkspaceAppResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.InstallWorkspaceApp404JSONResponse{
			WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.InstallWorkspaceApp400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.InstallWorkspaceApp502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeImportWorkspaceAppError(err error) nextopgenerated.ImportWorkspaceAppResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.ImportWorkspaceApp404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ImportWorkspaceApp400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.ImportWorkspaceApp502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeExportWorkspaceAppError(err error) nextopgenerated.ExportWorkspaceAppResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.ExportWorkspaceApp404JSONResponse{
			WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ExportWorkspaceApp400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.ExportWorkspaceApp502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeReplaceWorkspaceAppIconError(err error) nextopgenerated.ReplaceWorkspaceAppIconResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.ReplaceWorkspaceAppIcon404JSONResponse{
			WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ReplaceWorkspaceAppIcon400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.ReplaceWorkspaceAppIcon502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeUninstallWorkspaceAppError(err error) nextopgenerated.UninstallWorkspaceAppResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.UninstallWorkspaceApp404JSONResponse{
			WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.UninstallWorkspaceApp400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.UninstallWorkspaceApp502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeDeleteWorkspaceAppError(err error) nextopgenerated.DeleteWorkspaceAppResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.DeleteWorkspaceApp404JSONResponse{
			WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.DeleteWorkspaceApp400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.DeleteWorkspaceApp502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeRetryWorkspaceAppError(err error) nextopgenerated.RetryWorkspaceAppResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.RetryWorkspaceApp404JSONResponse{
			WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.RetryWorkspaceApp400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.RetryWorkspaceApp502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeRollbackWorkspaceAppError(err error) nextopgenerated.RollbackWorkspaceAppResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.RollbackWorkspaceApp404JSONResponse{
			WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.RollbackWorkspaceApp400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.RollbackWorkspaceApp502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}
