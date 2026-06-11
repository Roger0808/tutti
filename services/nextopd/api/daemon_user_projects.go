package api

import (
	"context"
	"errors"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
	userprojectbiz "github.com/tutti-os/tutti/services/nextopd/biz/userproject"
	userprojectservice "github.com/tutti-os/tutti/services/nextopd/service/userproject"
)

type UserProjectService interface {
	CheckPath(context.Context, userprojectservice.CheckPathInput) (userprojectservice.PathCheck, error)
	Delete(context.Context, userprojectservice.DeleteInput) error
	List(context.Context) ([]userprojectbiz.Project, error)
	Use(context.Context, userprojectservice.UseInput) (userprojectbiz.Project, error)
}

func (api DaemonAPI) CheckUserProjectPath(ctx context.Context, request nextopgenerated.CheckUserProjectPathRequestObject) (nextopgenerated.CheckUserProjectPathResponseObject, error) {
	if api.UserProjectService == nil {
		return nextopgenerated.CheckUserProjectPath503JSONResponse{
			ServiceUnavailableErrorJSONResponse: userProjectServiceUnavailableError(),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.CheckUserProjectPath400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body"))),
		}, nil
	}
	check, err := api.UserProjectService.CheckPath(ctx, userprojectservice.CheckPathInput{
		Path: request.Body.Path,
	})
	if err != nil {
		if errors.Is(err, userprojectservice.ErrInvalidArgument) {
			return nextopgenerated.CheckUserProjectPath400JSONResponse{
				InvalidRequestErrorJSONResponse: invalidRequestError(
					apierrors.InvalidRequest(
						apierrors.ReasonInvalidPath,
						apierrors.WithDeveloperMessage("user project path is invalid"),
						apierrors.WithParams(map[string]any{"field": "path"}),
					),
				),
			}, nil
		}
		return nextopgenerated.CheckUserProjectPath502JSONResponse{
			PreferencesOperationErrorJSONResponse: preferencesOperationError(
				apierrors.PreferencesOperationFailed(apierrors.WithCause(err)),
			),
		}, nil
	}
	return nextopgenerated.CheckUserProjectPath200JSONResponse{
		Exists:      check.Exists,
		IsDirectory: check.IsDirectory,
		Path:        check.Path,
	}, nil
}

func (api DaemonAPI) ListUserProjects(ctx context.Context, _ nextopgenerated.ListUserProjectsRequestObject) (nextopgenerated.ListUserProjectsResponseObject, error) {
	if api.UserProjectService == nil {
		return nextopgenerated.ListUserProjects503JSONResponse{
			ServiceUnavailableErrorJSONResponse: userProjectServiceUnavailableError(),
		}, nil
	}
	projects, err := api.UserProjectService.List(ctx)
	if err != nil {
		return nextopgenerated.ListUserProjects502JSONResponse{
			PreferencesOperationErrorJSONResponse: preferencesOperationError(
				apierrors.PreferencesOperationFailed(apierrors.WithCause(err)),
			),
		}, nil
	}
	return nextopgenerated.ListUserProjects200JSONResponse{
		Projects: generatedUserProjects(projects),
	}, nil
}

func (api DaemonAPI) DeleteUserProject(ctx context.Context, request nextopgenerated.DeleteUserProjectRequestObject) (nextopgenerated.DeleteUserProjectResponseObject, error) {
	if api.UserProjectService == nil {
		return nextopgenerated.DeleteUserProject503JSONResponse{
			ServiceUnavailableErrorJSONResponse: userProjectServiceUnavailableError(),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.DeleteUserProject400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body"))),
		}, nil
	}
	err := api.UserProjectService.Delete(ctx, userprojectservice.DeleteInput{
		Path: request.Body.Path,
	})
	if err != nil {
		if errors.Is(err, userprojectservice.ErrInvalidArgument) {
			return nextopgenerated.DeleteUserProject400JSONResponse{
				InvalidRequestErrorJSONResponse: invalidRequestError(
					apierrors.InvalidRequest(
						apierrors.ReasonInvalidPath,
						apierrors.WithDeveloperMessage("user project path is invalid"),
						apierrors.WithParams(map[string]any{"field": "path"}),
					),
				),
			}, nil
		}
		return nextopgenerated.DeleteUserProject502JSONResponse{
			PreferencesOperationErrorJSONResponse: preferencesOperationError(
				apierrors.PreferencesOperationFailed(apierrors.WithCause(err)),
			),
		}, nil
	}
	return nextopgenerated.DeleteUserProject204Response{}, nil
}

func (api DaemonAPI) UseUserProject(ctx context.Context, request nextopgenerated.UseUserProjectRequestObject) (nextopgenerated.UseUserProjectResponseObject, error) {
	if api.UserProjectService == nil {
		return nextopgenerated.UseUserProject503JSONResponse{
			ServiceUnavailableErrorJSONResponse: userProjectServiceUnavailableError(),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.UseUserProject400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body"))),
		}, nil
	}
	project, err := api.UserProjectService.Use(ctx, userprojectservice.UseInput{
		Path: request.Body.Path,
	})
	if err != nil {
		if errors.Is(err, userprojectservice.ErrInvalidArgument) ||
			errors.Is(err, userprojectservice.ErrNotDirectory) {
			return nextopgenerated.UseUserProject400JSONResponse{
				InvalidRequestErrorJSONResponse: invalidRequestError(
					apierrors.InvalidRequest(
						apierrors.ReasonInvalidPath,
						apierrors.WithDeveloperMessage("user project path is invalid"),
						apierrors.WithParams(map[string]any{"field": "path"}),
					),
				),
			}, nil
		}
		return nextopgenerated.UseUserProject502JSONResponse{
			PreferencesOperationErrorJSONResponse: preferencesOperationError(
				apierrors.PreferencesOperationFailed(apierrors.WithCause(err)),
			),
		}, nil
	}
	return nextopgenerated.UseUserProject201JSONResponse{
		Project: generatedUserProject(project),
	}, nil
}

func userProjectServiceUnavailableError() nextopgenerated.ServiceUnavailableErrorJSONResponse {
	return serviceUnavailableError(
		apierrors.PreferencesServiceUnavailable(
			apierrors.WithDeveloperMessage("user project service is unavailable"),
		),
	)
}

func generatedUserProjects(projects []userprojectbiz.Project) []nextopgenerated.UserProject {
	result := make([]nextopgenerated.UserProject, 0, len(projects))
	for _, project := range projects {
		result = append(result, generatedUserProject(project))
	}
	return result
}

func generatedUserProject(project userprojectbiz.Project) nextopgenerated.UserProject {
	return nextopgenerated.UserProject{
		CreatedAtUnixMs:  project.CreatedAtUnixMS,
		Id:               project.ID,
		Label:            project.Label,
		LastUsedAtUnixMs: int64Pointer(project.LastUsedAtUnixMS),
		Path:             project.Path,
		UpdatedAtUnixMs:  project.UpdatedAtUnixMS,
	}
}
