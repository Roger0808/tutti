package api

import (
	"context"
	"encoding/json"
	"strings"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	workspaceapi "github.com/tutti-os/tutti/services/nextopd/api/workspace"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
	workspacebiz "github.com/tutti-os/tutti/services/nextopd/biz/workspace"
	workspaceservice "github.com/tutti-os/tutti/services/nextopd/service/workspace"
)

type AppFactoryService interface {
	Cancel(context.Context, string, string) (workspacebiz.AppFactoryJob, error)
	Create(context.Context, string, workspaceservice.CreateAppFactoryJobInput) (workspacebiz.AppFactoryJob, error)
	Delete(context.Context, string, string) error
	Fix(context.Context, string, string, workspaceservice.FixAppFactoryJobInput) (workspacebiz.AppFactoryJob, error)
	Get(context.Context, string, string) (workspacebiz.AppFactoryJob, error)
	List(context.Context, string) ([]workspacebiz.AppFactoryJob, error)
	PrepareModification(context.Context, string, string) (workspacebiz.AppFactoryJob, error)
	Publish(context.Context, string, string) (workspacebiz.AppFactoryJob, workspacebiz.WorkspaceApp, error)
	RetryValidation(context.Context, string, string) (workspacebiz.AppFactoryJob, error)
}

func workspaceAppFactoryServiceUnavailableError() nextopgenerated.ServiceUnavailableErrorJSONResponse {
	return serviceUnavailableError(
		apierrors.WorkspaceAppServiceUnavailable(
			apierrors.WithDeveloperMessage("workspace app factory service is unavailable"),
		),
	)
}

func (api DaemonAPI) ListWorkspaceAppFactoryJobs(ctx context.Context, request nextopgenerated.ListWorkspaceAppFactoryJobsRequestObject) (nextopgenerated.ListWorkspaceAppFactoryJobsResponseObject, error) {
	if api.AppFactoryService == nil {
		return nextopgenerated.ListWorkspaceAppFactoryJobs503JSONResponse{ServiceUnavailableErrorJSONResponse: workspaceAppFactoryServiceUnavailableError()}, nil
	}
	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.ListWorkspaceAppFactoryJobs400JSONResponse{InvalidRequestErrorJSONResponse: invalidWorkspaceIDError()}, nil
	}
	jobs, err := api.AppFactoryService.List(ctx, workspaceID)
	if err != nil {
		return writeListWorkspaceAppFactoryJobsError(err), nil
	}
	return nextopgenerated.ListWorkspaceAppFactoryJobs200JSONResponse{
		WorkspaceId: workspaceID,
		Jobs:        generatedAppFactoryJobs(jobs),
	}, nil
}

func (api DaemonAPI) CreateWorkspaceAppFactoryJob(ctx context.Context, request nextopgenerated.CreateWorkspaceAppFactoryJobRequestObject) (nextopgenerated.CreateWorkspaceAppFactoryJobResponseObject, error) {
	if api.AppFactoryService == nil {
		return nextopgenerated.CreateWorkspaceAppFactoryJob503JSONResponse{ServiceUnavailableErrorJSONResponse: workspaceAppFactoryServiceUnavailableError()}, nil
	}
	workspaceID := strings.TrimSpace(string(request.WorkspaceID))
	if workspaceID == "" {
		return nextopgenerated.CreateWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: invalidWorkspaceIDError()}, nil
	}
	if request.Body == nil || strings.TrimSpace(request.Body.Prompt) == "" {
		return nextopgenerated.CreateWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(apierrors.MalformedRequest(apierrors.WithDeveloperMessage("app factory prompt is required")))}, nil
	}
	if strings.TrimSpace(request.Body.DisplayName) == "" {
		return nextopgenerated.CreateWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(apierrors.MalformedRequest(apierrors.WithDeveloperMessage("app factory display name is required")))}, nil
	}
	job, err := api.AppFactoryService.Create(ctx, workspaceID, workspaceservice.CreateAppFactoryJobInput{
		Prompt:      request.Body.Prompt,
		DisplayName: request.Body.DisplayName,
		Description: optionalStringValue(request.Body.Description),
		Provider:    optionalStringValue(request.Body.Provider),
		Model:       optionalStringValue(request.Body.Model),
		PermissionModeID: optionalStringValue(
			request.Body.PermissionModeId,
		),
		ReasoningEffort: optionalStringValue(request.Body.ReasoningEffort),
	})
	if err != nil {
		return writeCreateWorkspaceAppFactoryJobError(err), nil
	}
	return nextopgenerated.CreateWorkspaceAppFactoryJob201JSONResponse{
		WorkspaceId: workspaceID,
		Job:         generatedAppFactoryJob(job),
	}, nil
}

func (api DaemonAPI) GetWorkspaceAppFactoryJob(ctx context.Context, request nextopgenerated.GetWorkspaceAppFactoryJobRequestObject) (nextopgenerated.GetWorkspaceAppFactoryJobResponseObject, error) {
	if api.AppFactoryService == nil {
		return nextopgenerated.GetWorkspaceAppFactoryJob503JSONResponse{ServiceUnavailableErrorJSONResponse: workspaceAppFactoryServiceUnavailableError()}, nil
	}
	workspaceID, jobID, errResponse := validateWorkspaceAppFactoryJobPath(request.WorkspaceID, request.JobID)
	if errResponse != nil {
		return nextopgenerated.GetWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}
	job, err := api.AppFactoryService.Get(ctx, workspaceID, jobID)
	if err != nil {
		return writeGetWorkspaceAppFactoryJobError(err), nil
	}
	return nextopgenerated.GetWorkspaceAppFactoryJob200JSONResponse{
		WorkspaceId: workspaceID,
		Job:         generatedAppFactoryJob(job),
	}, nil
}

func (api DaemonAPI) DeleteWorkspaceAppFactoryJob(ctx context.Context, request nextopgenerated.DeleteWorkspaceAppFactoryJobRequestObject) (nextopgenerated.DeleteWorkspaceAppFactoryJobResponseObject, error) {
	if api.AppFactoryService == nil {
		return nextopgenerated.DeleteWorkspaceAppFactoryJob503JSONResponse{ServiceUnavailableErrorJSONResponse: workspaceAppFactoryServiceUnavailableError()}, nil
	}
	workspaceID, jobID, errResponse := validateWorkspaceAppFactoryJobPath(request.WorkspaceID, request.JobID)
	if errResponse != nil {
		return nextopgenerated.DeleteWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}
	if err := api.AppFactoryService.Delete(ctx, workspaceID, jobID); err != nil {
		return writeDeleteWorkspaceAppFactoryJobError(err), nil
	}
	jobs, err := api.AppFactoryService.List(ctx, workspaceID)
	if err != nil {
		return writeDeleteWorkspaceAppFactoryJobError(err), nil
	}
	return nextopgenerated.DeleteWorkspaceAppFactoryJob200JSONResponse{
		WorkspaceId: workspaceID,
		Jobs:        generatedAppFactoryJobs(jobs),
	}, nil
}

func (api DaemonAPI) CancelWorkspaceAppFactoryJob(ctx context.Context, request nextopgenerated.CancelWorkspaceAppFactoryJobRequestObject) (nextopgenerated.CancelWorkspaceAppFactoryJobResponseObject, error) {
	if api.AppFactoryService == nil {
		return nextopgenerated.CancelWorkspaceAppFactoryJob503JSONResponse{ServiceUnavailableErrorJSONResponse: workspaceAppFactoryServiceUnavailableError()}, nil
	}
	workspaceID, jobID, errResponse := validateWorkspaceAppFactoryJobPath(request.WorkspaceID, request.JobID)
	if errResponse != nil {
		return nextopgenerated.CancelWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}
	job, err := api.AppFactoryService.Cancel(ctx, workspaceID, jobID)
	if err != nil {
		return writeCancelWorkspaceAppFactoryJobError(err), nil
	}
	return nextopgenerated.CancelWorkspaceAppFactoryJob200JSONResponse{
		WorkspaceId: workspaceID,
		Job:         generatedAppFactoryJob(job),
	}, nil
}

func (api DaemonAPI) RetryWorkspaceAppFactoryJobValidation(ctx context.Context, request nextopgenerated.RetryWorkspaceAppFactoryJobValidationRequestObject) (nextopgenerated.RetryWorkspaceAppFactoryJobValidationResponseObject, error) {
	if api.AppFactoryService == nil {
		return nextopgenerated.RetryWorkspaceAppFactoryJobValidation503JSONResponse{ServiceUnavailableErrorJSONResponse: workspaceAppFactoryServiceUnavailableError()}, nil
	}
	workspaceID, jobID, errResponse := validateWorkspaceAppFactoryJobPath(request.WorkspaceID, request.JobID)
	if errResponse != nil {
		return nextopgenerated.RetryWorkspaceAppFactoryJobValidation400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}
	job, err := api.AppFactoryService.RetryValidation(ctx, workspaceID, jobID)
	if err != nil {
		return writeRetryWorkspaceAppFactoryJobValidationError(err), nil
	}
	return nextopgenerated.RetryWorkspaceAppFactoryJobValidation200JSONResponse{
		WorkspaceId: workspaceID,
		Job:         generatedAppFactoryJob(job),
	}, nil
}

func (api DaemonAPI) FixWorkspaceAppFactoryJob(ctx context.Context, request nextopgenerated.FixWorkspaceAppFactoryJobRequestObject) (nextopgenerated.FixWorkspaceAppFactoryJobResponseObject, error) {
	if api.AppFactoryService == nil {
		return nextopgenerated.FixWorkspaceAppFactoryJob503JSONResponse{ServiceUnavailableErrorJSONResponse: workspaceAppFactoryServiceUnavailableError()}, nil
	}
	workspaceID, jobID, errResponse := validateWorkspaceAppFactoryJobPath(request.WorkspaceID, request.JobID)
	if errResponse != nil {
		return nextopgenerated.FixWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}
	if request.Body == nil || strings.TrimSpace(request.Body.Prompt) == "" {
		return nextopgenerated.FixWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(apierrors.MalformedRequest(apierrors.WithDeveloperMessage("app factory fix prompt is required")))}, nil
	}
	job, err := api.AppFactoryService.Fix(ctx, workspaceID, jobID, workspaceservice.FixAppFactoryJobInput{Prompt: request.Body.Prompt})
	if err != nil {
		return writeFixWorkspaceAppFactoryJobError(err), nil
	}
	return nextopgenerated.FixWorkspaceAppFactoryJob200JSONResponse{
		WorkspaceId: workspaceID,
		Job:         generatedAppFactoryJob(job),
	}, nil
}

func (api DaemonAPI) PrepareWorkspaceAppFactoryJobModification(ctx context.Context, request nextopgenerated.PrepareWorkspaceAppFactoryJobModificationRequestObject) (nextopgenerated.PrepareWorkspaceAppFactoryJobModificationResponseObject, error) {
	if api.AppFactoryService == nil {
		return nextopgenerated.PrepareWorkspaceAppFactoryJobModification503JSONResponse{ServiceUnavailableErrorJSONResponse: workspaceAppFactoryServiceUnavailableError()}, nil
	}
	workspaceID, jobID, errResponse := validateWorkspaceAppFactoryJobPath(request.WorkspaceID, request.JobID)
	if errResponse != nil {
		return nextopgenerated.PrepareWorkspaceAppFactoryJobModification400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}
	job, err := api.AppFactoryService.PrepareModification(ctx, workspaceID, jobID)
	if err != nil {
		return writePrepareWorkspaceAppFactoryJobModificationError(err), nil
	}
	return nextopgenerated.PrepareWorkspaceAppFactoryJobModification200JSONResponse{
		WorkspaceId: workspaceID,
		Job:         generatedAppFactoryJob(job),
	}, nil
}

func (api DaemonAPI) PublishWorkspaceAppFactoryJob(ctx context.Context, request nextopgenerated.PublishWorkspaceAppFactoryJobRequestObject) (nextopgenerated.PublishWorkspaceAppFactoryJobResponseObject, error) {
	if api.AppFactoryService == nil {
		return nextopgenerated.PublishWorkspaceAppFactoryJob503JSONResponse{ServiceUnavailableErrorJSONResponse: workspaceAppFactoryServiceUnavailableError()}, nil
	}
	workspaceID, jobID, errResponse := validateWorkspaceAppFactoryJobPath(request.WorkspaceID, request.JobID)
	if errResponse != nil {
		return nextopgenerated.PublishWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: *errResponse}, nil
	}
	job, app, err := api.AppFactoryService.Publish(ctx, workspaceID, jobID)
	if err != nil {
		return writePublishWorkspaceAppFactoryJobError(err), nil
	}
	return nextopgenerated.PublishWorkspaceAppFactoryJob200JSONResponse{
		WorkspaceId: workspaceID,
		Job:         generatedAppFactoryJob(job),
		App:         workspaceapi.GeneratedAppFromBiz(app),
	}, nil
}

func generatedAppFactoryJobs(jobs []workspacebiz.AppFactoryJob) []nextopgenerated.WorkspaceAppFactoryJob {
	result := make([]nextopgenerated.WorkspaceAppFactoryJob, 0, len(jobs))
	for _, job := range jobs {
		result = append(result, generatedAppFactoryJob(job))
	}
	return result
}

func generatedAppFactoryJob(job workspacebiz.AppFactoryJob) nextopgenerated.WorkspaceAppFactoryJob {
	return nextopgenerated.WorkspaceAppFactoryJob{
		AgentSessionId:   nullableGeneratedString(job.AgentSessionID),
		AppId:            nullableGeneratedString(job.AppID),
		CreatedAtUnixMs:  job.CreatedAtUnixMs,
		Description:      nullableGeneratedString(job.Description),
		DisplayName:      strings.TrimSpace(job.DisplayName),
		FailureReason:    nullableGeneratedString(job.FailureReason),
		JobId:            job.JobID,
		Model:            nullableGeneratedString(job.Model),
		Prompt:           job.Prompt,
		Provider:         nullableGeneratedString(job.Provider),
		ReasoningEffort:  nullableGeneratedString(job.ReasoningEffort),
		PublishedVersion: nullableGeneratedString(job.PublishedVersion),
		Status:           nextopgenerated.WorkspaceAppFactoryJobStatus(job.Status),
		UpdatedAtUnixMs:  job.UpdatedAtUnixMs,
		ValidationResult: generatedValidationResult(job.ValidationResultJSON),
		WorkspaceId:      job.WorkspaceID,
	}
}

func generatedValidationResult(raw string) *map[string]interface{} {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(raw), &result); err != nil {
		return nil
	}
	return &result
}

func nullableGeneratedString(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}

func validateWorkspaceAppFactoryJobPath(workspaceIDValue nextopgenerated.WorkspaceID, jobIDValue nextopgenerated.WorkspaceAppFactoryJobID) (string, string, *nextopgenerated.InvalidRequestErrorJSONResponse) {
	workspaceID := strings.TrimSpace(string(workspaceIDValue))
	if workspaceID == "" {
		response := invalidWorkspaceIDError()
		return "", "", &response
	}
	jobID := strings.TrimSpace(string(jobIDValue))
	if jobID == "" {
		response := invalidRequestError(apierrors.MalformedRequest(apierrors.WithDeveloperMessage("app factory job id is required"), apierrors.WithParams(map[string]any{"field": "jobId"})))
		return "", "", &response
	}
	return workspaceID, jobID, nil
}

func invalidWorkspaceIDError() nextopgenerated.InvalidRequestErrorJSONResponse {
	return invalidRequestError(apierrors.MissingWorkspaceID(apierrors.WithDeveloperMessage("workspace id is required"), apierrors.WithParams(map[string]any{"field": "workspaceId"})))
}

func writeListWorkspaceAppFactoryJobsError(err error) nextopgenerated.ListWorkspaceAppFactoryJobsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.ListWorkspaceAppFactoryJobs404JSONResponse{WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr)}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ListWorkspaceAppFactoryJobs400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	default:
		return nextopgenerated.ListWorkspaceAppFactoryJobs502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeCreateWorkspaceAppFactoryJobError(err error) nextopgenerated.CreateWorkspaceAppFactoryJobResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.CreateWorkspaceAppFactoryJob404JSONResponse{WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr)}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CreateWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	default:
		return nextopgenerated.CreateWorkspaceAppFactoryJob502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeGetWorkspaceAppFactoryJobError(err error) nextopgenerated.GetWorkspaceAppFactoryJobResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.GetWorkspaceAppFactoryJob404JSONResponse{WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr)}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.GetWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	default:
		return nextopgenerated.GetWorkspaceAppFactoryJob502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeCancelWorkspaceAppFactoryJobError(err error) nextopgenerated.CancelWorkspaceAppFactoryJobResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.CancelWorkspaceAppFactoryJob404JSONResponse{WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr)}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CancelWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	default:
		return nextopgenerated.CancelWorkspaceAppFactoryJob502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeDeleteWorkspaceAppFactoryJobError(err error) nextopgenerated.DeleteWorkspaceAppFactoryJobResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.DeleteWorkspaceAppFactoryJob404JSONResponse{WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr)}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.DeleteWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	default:
		return nextopgenerated.DeleteWorkspaceAppFactoryJob502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeRetryWorkspaceAppFactoryJobValidationError(err error) nextopgenerated.RetryWorkspaceAppFactoryJobValidationResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.RetryWorkspaceAppFactoryJobValidation404JSONResponse{WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr)}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.RetryWorkspaceAppFactoryJobValidation400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	default:
		return nextopgenerated.RetryWorkspaceAppFactoryJobValidation502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeFixWorkspaceAppFactoryJobError(err error) nextopgenerated.FixWorkspaceAppFactoryJobResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.FixWorkspaceAppFactoryJob404JSONResponse{WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr)}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.FixWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	default:
		return nextopgenerated.FixWorkspaceAppFactoryJob502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writePrepareWorkspaceAppFactoryJobModificationError(err error) nextopgenerated.PrepareWorkspaceAppFactoryJobModificationResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.PrepareWorkspaceAppFactoryJobModification404JSONResponse{WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr)}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.PrepareWorkspaceAppFactoryJobModification400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	default:
		return nextopgenerated.PrepareWorkspaceAppFactoryJobModification502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writePublishWorkspaceAppFactoryJobError(err error) nextopgenerated.PublishWorkspaceAppFactoryJobResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceAppNotFound:
		return nextopgenerated.PublishWorkspaceAppFactoryJob404JSONResponse{WorkspaceAppNotFoundErrorJSONResponse: workspaceAppNotFoundError(protocolErr)}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.PublishWorkspaceAppFactoryJob400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	default:
		return nextopgenerated.PublishWorkspaceAppFactoryJob502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}
