package api

import (
	"context"
	"encoding/base64"
	"strings"
	"time"

	workspacefiles "github.com/tutti-os/tutti/packages/workspace/files"
	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	workspaceapi "github.com/tutti-os/tutti/services/nextopd/api/workspace"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
)

func (api DaemonAPI) ListWorkspaceFileDirectory(
	ctx context.Context,
	request nextopgenerated.ListWorkspaceFileDirectoryRequestObject,
) (nextopgenerated.ListWorkspaceFileDirectoryResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.ListWorkspaceFileDirectory503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.ListWorkspaceFileDirectory400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	path := ""
	if request.Params.Path != nil {
		path = strings.TrimSpace(*request.Params.Path)
	}
	includeHidden := false
	if request.Params.IncludeHidden != nil {
		includeHidden = *request.Params.IncludeHidden
	}
	listing, err := api.FileService.ListDirectory(ctx, workspaceID, workspacefiles.DirectoryListInput{
		IncludeHidden: includeHidden,
		Path:          path,
	})
	if err != nil {
		return writeListWorkspaceFileDirectoryError(err), nil
	}

	return nextopgenerated.ListWorkspaceFileDirectory200JSONResponse(
		workspaceapi.GeneratedFileDirectoryResponseFromDomain(listing),
	), nil
}

func (api DaemonAPI) CreateWorkspaceFileDirectory(
	ctx context.Context,
	request nextopgenerated.CreateWorkspaceFileDirectoryRequestObject,
) (nextopgenerated.CreateWorkspaceFileDirectoryResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.CreateWorkspaceFileDirectory503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.CreateWorkspaceFileDirectory400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.CreateWorkspaceFileDirectory400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	entry, err := api.FileService.CreateDirectory(ctx, workspaceID, request.Body.Path)
	if err != nil {
		return writeCreateWorkspaceFileDirectoryError(err), nil
	}
	root, err := api.workspaceFileResponseRoot(ctx, workspaceID)
	if err != nil {
		return writeCreateWorkspaceFileDirectoryError(err), nil
	}

	return nextopgenerated.CreateWorkspaceFileDirectory200JSONResponse(
		workspaceapi.GeneratedFileEntryResponseFromDomain(
			workspaceID,
			root,
			entry,
		),
	), nil
}

func (api DaemonAPI) GetWorkspaceFileTreeSnapshot(
	ctx context.Context,
	request nextopgenerated.GetWorkspaceFileTreeSnapshotRequestObject,
) (nextopgenerated.GetWorkspaceFileTreeSnapshotResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.GetWorkspaceFileTreeSnapshot503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.GetWorkspaceFileTreeSnapshot400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	path := ""
	if request.Params.Path != nil {
		path = strings.TrimSpace(*request.Params.Path)
	}
	includeHidden := false
	if request.Params.IncludeHidden != nil {
		includeHidden = *request.Params.IncludeHidden
	}
	prefetchDepth := 0
	if request.Params.PrefetchDepth != nil {
		prefetchDepth = int(*request.Params.PrefetchDepth)
	}
	prefetchBudget := time.Duration(0)
	if request.Params.PrefetchBudgetMs != nil {
		prefetchBudget = time.Duration(*request.Params.PrefetchBudgetMs) * time.Millisecond
	}

	snapshot, err := api.FileService.GetDirectoryTreeSnapshot(
		ctx,
		workspaceID,
		workspacefiles.DirectoryTreeSnapshotInput{
			IncludeHidden:  includeHidden,
			Path:           path,
			PrefetchBudget: prefetchBudget,
			PrefetchDepth:  prefetchDepth,
		},
	)
	if err != nil {
		return writeGetWorkspaceFileTreeSnapshotError(err), nil
	}

	return nextopgenerated.GetWorkspaceFileTreeSnapshot200JSONResponse(
		workspaceapi.GeneratedFileTreeSnapshotResponseFromDomain(snapshot),
	), nil
}

func (api DaemonAPI) SearchWorkspaceFiles(
	ctx context.Context,
	request nextopgenerated.SearchWorkspaceFilesRequestObject,
) (nextopgenerated.SearchWorkspaceFilesResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.SearchWorkspaceFiles503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.SearchWorkspaceFiles400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	limit := 0
	if request.Params.Limit != nil {
		limit = *request.Params.Limit
	}
	includeHidden := false
	if request.Params.IncludeHidden != nil {
		includeHidden = *request.Params.IncludeHidden
	}
	result, err := api.FileService.Search(ctx, workspaceID, workspacefiles.SearchInput{
		Query:         string(request.Params.Query),
		Limit:         limit,
		IncludeKinds:  workspaceapi.DomainSearchKindsFromGenerated(request.Params.IncludeKinds),
		IncludeHidden: includeHidden,
	})
	if err != nil {
		return writeSearchWorkspaceFilesError(err), nil
	}

	return nextopgenerated.SearchWorkspaceFiles200JSONResponse(
		workspaceapi.GeneratedFileSearchResponseFromDomain(result),
	), nil
}

func (api DaemonAPI) CreateWorkspaceFile(
	ctx context.Context,
	request nextopgenerated.CreateWorkspaceFileRequestObject,
) (nextopgenerated.CreateWorkspaceFileResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.CreateWorkspaceFile503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.CreateWorkspaceFile400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.CreateWorkspaceFile400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	entry, err := api.FileService.CreateFile(ctx, workspaceID, request.Body.Path)
	if err != nil {
		return writeCreateWorkspaceFileError(err), nil
	}
	root, err := api.workspaceFileResponseRoot(ctx, workspaceID)
	if err != nil {
		return writeCreateWorkspaceFileError(err), nil
	}

	return nextopgenerated.CreateWorkspaceFile200JSONResponse(
		workspaceapi.GeneratedFileEntryResponseFromDomain(
			workspaceID,
			root,
			entry,
		),
	), nil
}

func (api DaemonAPI) ReadWorkspaceFilePreview(
	ctx context.Context,
	request nextopgenerated.ReadWorkspaceFilePreviewRequestObject,
) (nextopgenerated.ReadWorkspaceFilePreviewResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.ReadWorkspaceFilePreview503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.ReadWorkspaceFilePreview400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}

	path := workspacefiles.DefaultLogicalRoot
	if request.Params.Path != nil {
		path = strings.TrimSpace(*request.Params.Path)
	}
	content, err := api.FileService.ReadFile(ctx, workspaceID, path, workspacefiles.DefaultReadFileMaxBytes)
	if err != nil {
		return writeReadWorkspaceFilePreviewError(err), nil
	}
	root, err := api.workspaceFileResponseRoot(ctx, workspaceID)
	if err != nil {
		return writeReadWorkspaceFilePreviewError(err), nil
	}

	return nextopgenerated.ReadWorkspaceFilePreview200JSONResponse{
		BytesBase64: base64.StdEncoding.EncodeToString(content.Bytes),
		Name:        content.Name,
		Path:        content.Path.String(),
		Root:        root.String(),
		SizeBytes:   content.SizeBytes,
		WorkspaceId: workspaceID,
	}, nil
}

func (api DaemonAPI) WriteWorkspaceFileText(
	ctx context.Context,
	request nextopgenerated.WriteWorkspaceFileTextRequestObject,
) (nextopgenerated.WriteWorkspaceFileTextResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.WriteWorkspaceFileText503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.WriteWorkspaceFileText400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.WriteWorkspaceFileText400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	entry, err := api.FileService.WriteTextFile(ctx, workspaceID, request.Body.Path, request.Body.Content)
	if err != nil {
		return writeWriteWorkspaceFileTextError(err), nil
	}
	root, err := api.workspaceFileResponseRoot(ctx, workspaceID)
	if err != nil {
		return writeWriteWorkspaceFileTextError(err), nil
	}

	return nextopgenerated.WriteWorkspaceFileText200JSONResponse(
		workspaceapi.GeneratedFileEntryResponseFromDomain(
			workspaceID,
			root,
			entry,
		),
	), nil
}

func (api DaemonAPI) DeleteWorkspaceFileEntry(
	ctx context.Context,
	request nextopgenerated.DeleteWorkspaceFileEntryRequestObject,
) (nextopgenerated.DeleteWorkspaceFileEntryResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.DeleteWorkspaceFileEntry503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.DeleteWorkspaceFileEntry400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.DeleteWorkspaceFileEntry400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	path := strings.TrimSpace(request.Body.Path)
	if err := api.FileService.DeleteEntry(
		ctx,
		workspaceID,
		path,
		workspaceapi.DomainEntryKindFromGenerated(request.Body.Kind),
	); err != nil {
		return writeDeleteWorkspaceFileEntryError(err), nil
	}

	normalizedPath, err := workspacefiles.NormalizeLogicalPath(path)
	if err != nil {
		normalizedPath = workspacefiles.LogicalPath(path)
	}
	return nextopgenerated.DeleteWorkspaceFileEntry200JSONResponse{
		WorkspaceId: workspaceID,
		Path:        normalizedPath.String(),
	}, nil
}

func (api DaemonAPI) MoveWorkspaceFileEntry(
	ctx context.Context,
	request nextopgenerated.MoveWorkspaceFileEntryRequestObject,
) (nextopgenerated.MoveWorkspaceFileEntryResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.MoveWorkspaceFileEntry503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.MoveWorkspaceFileEntry400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.MoveWorkspaceFileEntry400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	entry, err := api.FileService.MoveEntry(
		ctx,
		workspaceID,
		request.Body.Path,
		request.Body.TargetDirectoryPath,
	)
	if err != nil {
		return writeMoveWorkspaceFileEntryError(err), nil
	}
	root, err := api.workspaceFileResponseRoot(ctx, workspaceID)
	if err != nil {
		return writeMoveWorkspaceFileEntryError(err), nil
	}

	return nextopgenerated.MoveWorkspaceFileEntry200JSONResponse(
		workspaceapi.GeneratedFileEntryResponseFromDomain(
			workspaceID,
			root,
			entry,
		),
	), nil
}

func (api DaemonAPI) RenameWorkspaceFileEntry(
	ctx context.Context,
	request nextopgenerated.RenameWorkspaceFileEntryRequestObject,
) (nextopgenerated.RenameWorkspaceFileEntryResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.RenameWorkspaceFileEntry503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.RenameWorkspaceFileEntry400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.RenameWorkspaceFileEntry400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	entry, err := api.FileService.RenameEntry(
		ctx,
		workspaceID,
		request.Body.Path,
		request.Body.NewName,
	)
	if err != nil {
		return writeRenameWorkspaceFileEntryError(err), nil
	}
	root, err := api.workspaceFileResponseRoot(ctx, workspaceID)
	if err != nil {
		return writeRenameWorkspaceFileEntryError(err), nil
	}

	return nextopgenerated.RenameWorkspaceFileEntry200JSONResponse(
		workspaceapi.GeneratedFileEntryResponseFromDomain(
			workspaceID,
			root,
			entry,
		),
	), nil
}

func (api DaemonAPI) CopyWorkspaceFileEntry(
	ctx context.Context,
	request nextopgenerated.CopyWorkspaceFileEntryRequestObject,
) (nextopgenerated.CopyWorkspaceFileEntryResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.CopyWorkspaceFileEntry503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.CopyWorkspaceFileEntry400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.CopyWorkspaceFileEntry400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	entry, err := api.FileService.CopyEntry(ctx, workspaceID, request.Body.Path)
	if err != nil {
		return writeCopyWorkspaceFileEntryError(err), nil
	}
	root, err := api.workspaceFileResponseRoot(ctx, workspaceID)
	if err != nil {
		return writeCopyWorkspaceFileEntryError(err), nil
	}

	return nextopgenerated.CopyWorkspaceFileEntry200JSONResponse(
		workspaceapi.GeneratedFileEntryResponseFromDomain(
			workspaceID,
			root,
			entry,
		),
	), nil
}

func (api DaemonAPI) workspaceFileResponseRoot(
	ctx context.Context,
	workspaceID string,
) (workspacefiles.LogicalPath, error) {
	root, err := api.FileService.ResolveWorkspaceRoot(ctx, workspaceID)
	if err != nil {
		return "", err
	}
	return workspacefiles.NormalizeLogicalRoot(root.LogicalRoot), nil
}

func (api DaemonAPI) UploadWorkspaceFiles(
	ctx context.Context,
	request nextopgenerated.UploadWorkspaceFilesRequestObject,
) (nextopgenerated.UploadWorkspaceFilesResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.UploadWorkspaceFiles503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.UploadWorkspaceFiles400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.UploadWorkspaceFiles400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	result, err := api.FileService.UploadFiles(ctx, workspaceID, workspacefiles.UploadInput{
		Overwrite:           request.Body.Overwrite != nil && *request.Body.Overwrite,
		SourcePaths:         request.Body.SourcePaths,
		TargetDirectoryPath: request.Body.TargetDirectoryPath,
	})
	if err != nil {
		return writeUploadWorkspaceFilesError(err), nil
	}

	return nextopgenerated.UploadWorkspaceFiles200JSONResponse(
		workspaceapi.GeneratedFileUploadResponseFromDomain(result),
	), nil
}

func (api DaemonAPI) PreflightUploadWorkspaceFiles(
	ctx context.Context,
	request nextopgenerated.PreflightUploadWorkspaceFilesRequestObject,
) (nextopgenerated.PreflightUploadWorkspaceFilesResponseObject, error) {
	if api.FileService == nil {
		return nextopgenerated.PreflightUploadWorkspaceFiles503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.WorkspaceFileServiceUnavailable(apierrors.WithDeveloperMessage("workspace file service is unavailable")),
			),
		}, nil
	}

	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.PreflightUploadWorkspaceFiles400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MissingWorkspaceID(
					apierrors.WithDeveloperMessage("workspace id is required"),
					apierrors.WithParams(map[string]any{"field": "workspaceId"}),
				),
			),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.PreflightUploadWorkspaceFiles400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	result, err := api.FileService.PreflightUploadFiles(ctx, workspaceID, workspacefiles.PreflightUploadInput{
		SourcePaths:         request.Body.SourcePaths,
		TargetDirectoryPath: request.Body.TargetDirectoryPath,
	})
	if err != nil {
		return writePreflightUploadWorkspaceFilesError(err), nil
	}

	return nextopgenerated.PreflightUploadWorkspaceFiles200JSONResponse(
		workspaceapi.GeneratedFilePreflightUploadResponseFromDomain(result),
	), nil
}
