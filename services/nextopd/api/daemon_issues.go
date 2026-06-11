package api

import (
	"context"
	"strings"

	workspaceissues "github.com/tutti-os/tutti/packages/workspace/issues"
	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	workspaceapi "github.com/tutti-os/tutti/services/nextopd/api/workspace"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
	workspaceservice "github.com/tutti-os/tutti/services/nextopd/service/workspace"
)

func (api DaemonAPI) ListWorkspaceIssues(ctx context.Context, request nextopgenerated.ListWorkspaceIssuesRequestObject) (nextopgenerated.ListWorkspaceIssuesResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.ListWorkspaceIssues503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	list, err := api.IssueService.ListIssues(ctx, string(request.WorkspaceID), issueManagerIssueListInputFromGenerated(request.Params))
	if err != nil {
		return writeListWorkspaceIssuesError(err), nil
	}
	return nextopgenerated.ListWorkspaceIssues200JSONResponse(
		workspaceapi.GeneratedIssueManagerIssueListResponseFromDomain(list),
	), nil
}

func (api DaemonAPI) ListWorkspaceIssueTopics(ctx context.Context, request nextopgenerated.ListWorkspaceIssueTopicsRequestObject) (nextopgenerated.ListWorkspaceIssueTopicsResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.ListWorkspaceIssueTopics503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	list, err := api.IssueService.ListTopics(ctx, string(request.WorkspaceID))
	if err != nil {
		return writeListWorkspaceIssueTopicsError(err), nil
	}
	return nextopgenerated.ListWorkspaceIssueTopics200JSONResponse(
		workspaceapi.GeneratedIssueManagerTopicListResponseFromDomain(list),
	), nil
}

func (api DaemonAPI) CreateWorkspaceIssueTopic(ctx context.Context, request nextopgenerated.CreateWorkspaceIssueTopicRequestObject) (nextopgenerated.CreateWorkspaceIssueTopicResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.CreateWorkspaceIssueTopic503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}
	if request.Body == nil {
		return nextopgenerated.CreateWorkspaceIssueTopic400JSONResponse{InvalidRequestErrorJSONResponse: issueManagerEmptyBodyError()}, nil
	}

	topic, err := api.IssueService.CreateTopic(ctx, string(request.WorkspaceID), workspaceservice.CreateIssueManagerTopicInput{
		TopicID: optionalString(request.Body.TopicId),
		Title:   request.Body.Title,
		Summary: optionalString(request.Body.Summary),
	})
	if err != nil {
		return writeCreateWorkspaceIssueTopicError(err), nil
	}
	return nextopgenerated.CreateWorkspaceIssueTopic201JSONResponse(
		workspaceapi.GeneratedIssueManagerTopicResponseFromDomain(topic),
	), nil
}

func (api DaemonAPI) UpdateWorkspaceIssueTopic(ctx context.Context, request nextopgenerated.UpdateWorkspaceIssueTopicRequestObject) (nextopgenerated.UpdateWorkspaceIssueTopicResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.UpdateWorkspaceIssueTopic503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}
	if request.Body == nil {
		return nextopgenerated.UpdateWorkspaceIssueTopic400JSONResponse{InvalidRequestErrorJSONResponse: issueManagerEmptyBodyError()}, nil
	}

	topic, err := api.IssueService.UpdateTopic(ctx, string(request.WorkspaceID), string(request.TopicID), workspaceservice.UpdateIssueManagerTopicInput{
		Title:      optionalString(request.Body.Title),
		HasTitle:   request.Body.Title != nil,
		Summary:    optionalString(request.Body.Summary),
		HasSummary: request.Body.Summary != nil,
		Pinned:     optionalBool(request.Body.Pinned),
		HasPinned:  request.Body.Pinned != nil,
	})
	if err != nil {
		return writeUpdateWorkspaceIssueTopicError(err), nil
	}
	return nextopgenerated.UpdateWorkspaceIssueTopic200JSONResponse(
		workspaceapi.GeneratedIssueManagerTopicResponseFromDomain(topic),
	), nil
}

func (api DaemonAPI) DeleteWorkspaceIssueTopic(ctx context.Context, request nextopgenerated.DeleteWorkspaceIssueTopicRequestObject) (nextopgenerated.DeleteWorkspaceIssueTopicResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.DeleteWorkspaceIssueTopic503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	removed, err := api.IssueService.DeleteTopic(ctx, string(request.WorkspaceID), string(request.TopicID))
	if err != nil {
		return writeDeleteWorkspaceIssueTopicError(err), nil
	}
	return nextopgenerated.DeleteWorkspaceIssueTopic200JSONResponse{Removed: removed}, nil
}

func (api DaemonAPI) CreateWorkspaceIssue(ctx context.Context, request nextopgenerated.CreateWorkspaceIssueRequestObject) (nextopgenerated.CreateWorkspaceIssueResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.CreateWorkspaceIssue503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}
	if request.Body == nil {
		return nextopgenerated.CreateWorkspaceIssue400JSONResponse{InvalidRequestErrorJSONResponse: issueManagerEmptyBodyError()}, nil
	}

	issue, err := api.IssueService.CreateIssue(ctx, string(request.WorkspaceID), workspaceservice.CreateIssueManagerIssueInput{
		IssueID: optionalString(request.Body.IssueId),
		TopicID: request.Body.TopicId,
		Title:   request.Body.Title,
		Content: optionalString(request.Body.Content),
	})
	if err != nil {
		return writeCreateWorkspaceIssueError(err), nil
	}
	return nextopgenerated.CreateWorkspaceIssue201JSONResponse(
		workspaceapi.GeneratedIssueManagerIssueResponseFromDomain(issue),
	), nil
}

func (api DaemonAPI) RemoveWorkspaceIssueContextRef(ctx context.Context, request nextopgenerated.RemoveWorkspaceIssueContextRefRequestObject) (nextopgenerated.RemoveWorkspaceIssueContextRefResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.RemoveWorkspaceIssueContextRef503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	removed, err := api.IssueService.RemoveIssueContextRef(ctx, string(request.WorkspaceID), string(request.IssueID), string(request.ContextRefID))
	if err != nil {
		return writeRemoveWorkspaceIssueContextRefError(err), nil
	}
	return nextopgenerated.RemoveWorkspaceIssueContextRef200JSONResponse{Removed: removed}, nil
}

func (api DaemonAPI) RemoveWorkspaceIssueTaskContextRef(ctx context.Context, request nextopgenerated.RemoveWorkspaceIssueTaskContextRefRequestObject) (nextopgenerated.RemoveWorkspaceIssueTaskContextRefResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.RemoveWorkspaceIssueTaskContextRef503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	removed, err := api.IssueService.RemoveTaskContextRef(ctx, string(request.WorkspaceID), string(request.IssueID), string(request.TaskID), string(request.ContextRefID))
	if err != nil {
		return writeRemoveWorkspaceIssueTaskContextRefError(err), nil
	}
	return nextopgenerated.RemoveWorkspaceIssueTaskContextRef200JSONResponse{Removed: removed}, nil
}

func (api DaemonAPI) DeleteWorkspaceIssue(ctx context.Context, request nextopgenerated.DeleteWorkspaceIssueRequestObject) (nextopgenerated.DeleteWorkspaceIssueResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.DeleteWorkspaceIssue503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	removed, err := api.IssueService.DeleteIssue(ctx, string(request.WorkspaceID), string(request.IssueID))
	if err != nil {
		return writeDeleteWorkspaceIssueError(err), nil
	}
	return nextopgenerated.DeleteWorkspaceIssue200JSONResponse{Removed: removed}, nil
}

func (api DaemonAPI) GetWorkspaceIssueDetail(ctx context.Context, request nextopgenerated.GetWorkspaceIssueDetailRequestObject) (nextopgenerated.GetWorkspaceIssueDetailResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.GetWorkspaceIssueDetail503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	detail, err := api.IssueService.GetIssueDetail(ctx, string(request.WorkspaceID), string(request.IssueID))
	if err != nil {
		return writeGetWorkspaceIssueDetailError(err), nil
	}
	return nextopgenerated.GetWorkspaceIssueDetail200JSONResponse(
		workspaceapi.GeneratedIssueManagerIssueDetailResponseFromDomain(detail),
	), nil
}

func (api DaemonAPI) UpdateWorkspaceIssue(ctx context.Context, request nextopgenerated.UpdateWorkspaceIssueRequestObject) (nextopgenerated.UpdateWorkspaceIssueResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.UpdateWorkspaceIssue503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}
	if request.Body == nil {
		return nextopgenerated.UpdateWorkspaceIssue400JSONResponse{InvalidRequestErrorJSONResponse: issueManagerEmptyBodyError()}, nil
	}

	issue, err := api.IssueService.UpdateIssue(ctx, string(request.WorkspaceID), string(request.IssueID), workspaceservice.UpdateIssueManagerIssueInput{
		Title:      optionalString(request.Body.Title),
		HasTitle:   request.Body.Title != nil,
		Content:    optionalString(request.Body.Content),
		HasContent: request.Body.Content != nil,
		Status:     optionalIssueManagerStatus(request.Body.Status),
		HasStatus:  request.Body.Status != nil,
	})
	if err != nil {
		return writeUpdateWorkspaceIssueError(err), nil
	}
	return nextopgenerated.UpdateWorkspaceIssue200JSONResponse(
		workspaceapi.GeneratedIssueManagerIssueResponseFromDomain(issue),
	), nil
}

func (api DaemonAPI) AddWorkspaceIssueContextRefs(ctx context.Context, request nextopgenerated.AddWorkspaceIssueContextRefsRequestObject) (nextopgenerated.AddWorkspaceIssueContextRefsResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.AddWorkspaceIssueContextRefs503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}
	if request.Body == nil {
		return nextopgenerated.AddWorkspaceIssueContextRefs400JSONResponse{InvalidRequestErrorJSONResponse: issueManagerEmptyBodyError()}, nil
	}

	refs, err := api.IssueService.AddIssueContextRefs(ctx, string(request.WorkspaceID), string(request.IssueID), workspaceservice.AddIssueManagerContextRefsInput{
		Refs: issueManagerContextRefsInputFromGenerated(request.Body.Refs),
	})
	if err != nil {
		return writeAddWorkspaceIssueContextRefsError(err), nil
	}
	return nextopgenerated.AddWorkspaceIssueContextRefs200JSONResponse(
		workspaceapi.GeneratedIssueManagerContextRefsResponseFromDomain(refs),
	), nil
}

func (api DaemonAPI) ListWorkspaceIssueTasks(ctx context.Context, request nextopgenerated.ListWorkspaceIssueTasksRequestObject) (nextopgenerated.ListWorkspaceIssueTasksResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.ListWorkspaceIssueTasks503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	list, err := api.IssueService.ListTasks(ctx, string(request.WorkspaceID), string(request.IssueID), issueManagerTaskListInputFromGenerated(request.Params))
	if err != nil {
		return writeListWorkspaceIssueTasksError(err), nil
	}
	return nextopgenerated.ListWorkspaceIssueTasks200JSONResponse(
		workspaceapi.GeneratedIssueManagerTaskListResponseFromDomain(list),
	), nil
}

func (api DaemonAPI) CreateWorkspaceIssueTask(ctx context.Context, request nextopgenerated.CreateWorkspaceIssueTaskRequestObject) (nextopgenerated.CreateWorkspaceIssueTaskResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.CreateWorkspaceIssueTask503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}
	if request.Body == nil {
		return nextopgenerated.CreateWorkspaceIssueTask400JSONResponse{InvalidRequestErrorJSONResponse: issueManagerEmptyBodyError()}, nil
	}

	task, err := api.IssueService.CreateTask(ctx, string(request.WorkspaceID), string(request.IssueID), workspaceservice.CreateIssueManagerTaskInput{
		TaskID:      optionalString(request.Body.TaskId),
		Title:       request.Body.Title,
		Content:     optionalString(request.Body.Content),
		Priority:    optionalIssueManagerPriority(request.Body.Priority),
		DueAtUnixMS: optionalUnixMillis(request.Body.DueAtUnix),
	})
	if err != nil {
		return writeCreateWorkspaceIssueTaskError(err), nil
	}
	return nextopgenerated.CreateWorkspaceIssueTask201JSONResponse(
		workspaceapi.GeneratedIssueManagerTaskResponseFromDomain(task),
	), nil
}

func (api DaemonAPI) DeleteWorkspaceIssueTask(ctx context.Context, request nextopgenerated.DeleteWorkspaceIssueTaskRequestObject) (nextopgenerated.DeleteWorkspaceIssueTaskResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.DeleteWorkspaceIssueTask503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	removed, err := api.IssueService.DeleteTask(ctx, string(request.WorkspaceID), string(request.IssueID), string(request.TaskID))
	if err != nil {
		return writeDeleteWorkspaceIssueTaskError(err), nil
	}
	return nextopgenerated.DeleteWorkspaceIssueTask200JSONResponse{Removed: removed}, nil
}

func (api DaemonAPI) GetWorkspaceIssueTaskDetail(ctx context.Context, request nextopgenerated.GetWorkspaceIssueTaskDetailRequestObject) (nextopgenerated.GetWorkspaceIssueTaskDetailResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.GetWorkspaceIssueTaskDetail503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	detail, err := api.IssueService.GetTaskDetail(ctx, string(request.WorkspaceID), string(request.IssueID), string(request.TaskID))
	if err != nil {
		return writeGetWorkspaceIssueTaskDetailError(err), nil
	}
	return nextopgenerated.GetWorkspaceIssueTaskDetail200JSONResponse(
		workspaceapi.GeneratedIssueManagerTaskDetailResponseFromDomain(detail),
	), nil
}

func (api DaemonAPI) UpdateWorkspaceIssueTask(ctx context.Context, request nextopgenerated.UpdateWorkspaceIssueTaskRequestObject) (nextopgenerated.UpdateWorkspaceIssueTaskResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.UpdateWorkspaceIssueTask503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}
	if request.Body == nil {
		return nextopgenerated.UpdateWorkspaceIssueTask400JSONResponse{InvalidRequestErrorJSONResponse: issueManagerEmptyBodyError()}, nil
	}

	task, err := api.IssueService.UpdateTask(ctx, string(request.WorkspaceID), string(request.IssueID), string(request.TaskID), workspaceservice.UpdateIssueManagerTaskInput{
		Title:       optionalString(request.Body.Title),
		HasTitle:    request.Body.Title != nil,
		Content:     optionalString(request.Body.Content),
		HasContent:  request.Body.Content != nil,
		Status:      optionalIssueManagerStatus(request.Body.Status),
		HasStatus:   request.Body.Status != nil,
		Priority:    optionalIssueManagerPriority(request.Body.Priority),
		HasPriority: request.Body.Priority != nil,
		DueAtUnixMS: optionalUnixMillis(request.Body.DueAtUnix),
		HasDueAt:    request.Body.DueAtUnix != nil,
	})
	if err != nil {
		return writeUpdateWorkspaceIssueTaskError(err), nil
	}
	return nextopgenerated.UpdateWorkspaceIssueTask200JSONResponse(
		workspaceapi.GeneratedIssueManagerTaskResponseFromDomain(task),
	), nil
}

func (api DaemonAPI) AddWorkspaceIssueTaskContextRefs(ctx context.Context, request nextopgenerated.AddWorkspaceIssueTaskContextRefsRequestObject) (nextopgenerated.AddWorkspaceIssueTaskContextRefsResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.AddWorkspaceIssueTaskContextRefs503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}
	if request.Body == nil {
		return nextopgenerated.AddWorkspaceIssueTaskContextRefs400JSONResponse{InvalidRequestErrorJSONResponse: issueManagerEmptyBodyError()}, nil
	}

	refs, err := api.IssueService.AddTaskContextRefs(ctx, string(request.WorkspaceID), string(request.IssueID), string(request.TaskID), workspaceservice.AddIssueManagerContextRefsInput{
		Refs: issueManagerContextRefsInputFromGenerated(request.Body.Refs),
	})
	if err != nil {
		return writeAddWorkspaceIssueTaskContextRefsError(err), nil
	}
	return nextopgenerated.AddWorkspaceIssueTaskContextRefs200JSONResponse(
		workspaceapi.GeneratedIssueManagerContextRefsResponseFromDomain(refs),
	), nil
}

func (api DaemonAPI) ListWorkspaceIssueRuns(ctx context.Context, request nextopgenerated.ListWorkspaceIssueRunsRequestObject) (nextopgenerated.ListWorkspaceIssueRunsResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.ListWorkspaceIssueRuns503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	runs, err := api.IssueService.ListRuns(ctx, string(request.WorkspaceID), string(request.IssueID), "")
	if err != nil {
		return writeListWorkspaceIssueRunsError(err), nil
	}
	return nextopgenerated.ListWorkspaceIssueRuns200JSONResponse(
		workspaceapi.GeneratedIssueManagerRunListResponseFromDomain(runs),
	), nil
}

func (api DaemonAPI) CreateWorkspaceIssueRun(ctx context.Context, request nextopgenerated.CreateWorkspaceIssueRunRequestObject) (nextopgenerated.CreateWorkspaceIssueRunResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.CreateWorkspaceIssueRun503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}
	if request.Body == nil {
		return nextopgenerated.CreateWorkspaceIssueRun400JSONResponse{InvalidRequestErrorJSONResponse: issueManagerEmptyBodyError()}, nil
	}

	run, err := api.IssueService.CreateRun(ctx, string(request.WorkspaceID), string(request.IssueID), "", workspaceservice.CreateIssueManagerRunInput{
		RunID:              optionalString(request.Body.RunId),
		AgentProvider:      request.Body.AgentProvider,
		AgentUserID:        optionalString(request.Body.AgentUserId),
		AgentSessionID:     optionalString(request.Body.AgentSessionId),
		ExecutionDirectory: optionalString(request.Body.ExecutionDirectory),
	})
	if err != nil {
		return writeCreateWorkspaceIssueRunError(err), nil
	}
	return nextopgenerated.CreateWorkspaceIssueRun201JSONResponse(
		workspaceapi.GeneratedIssueManagerRunResponseFromDomain(run),
	), nil
}

func (api DaemonAPI) GetWorkspaceIssueRun(ctx context.Context, request nextopgenerated.GetWorkspaceIssueRunRequestObject) (nextopgenerated.GetWorkspaceIssueRunResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.GetWorkspaceIssueRun503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	detail, err := api.IssueService.GetRunDetail(ctx, string(request.WorkspaceID), string(request.IssueID), "", string(request.RunID))
	if err != nil {
		return writeGetWorkspaceIssueRunError(err), nil
	}
	return nextopgenerated.GetWorkspaceIssueRun200JSONResponse(
		workspaceapi.GeneratedIssueManagerRunEnvelopeFromDomain(detail),
	), nil
}

func (api DaemonAPI) CompleteWorkspaceIssueRun(ctx context.Context, request nextopgenerated.CompleteWorkspaceIssueRunRequestObject) (nextopgenerated.CompleteWorkspaceIssueRunResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.CompleteWorkspaceIssueRun503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}
	if request.Body == nil {
		return nextopgenerated.CompleteWorkspaceIssueRun400JSONResponse{InvalidRequestErrorJSONResponse: issueManagerEmptyBodyError()}, nil
	}

	detail, err := api.IssueService.CompleteRun(ctx, string(request.WorkspaceID), string(request.IssueID), "", string(request.RunID), workspaceservice.CompleteIssueManagerRunInput{
		Status:       string(request.Body.Status),
		Summary:      optionalString(request.Body.Summary),
		ErrorMessage: optionalString(request.Body.ErrorMessage),
		Outputs:      issueManagerRunOutputsInputFromGenerated(request.Body.Outputs),
	})
	if err != nil {
		return writeCompleteWorkspaceIssueRunError(err), nil
	}
	return nextopgenerated.CompleteWorkspaceIssueRun200JSONResponse(
		workspaceapi.GeneratedIssueManagerRunEnvelopeFromDomain(detail),
	), nil
}

func (api DaemonAPI) ListWorkspaceIssueTaskRuns(ctx context.Context, request nextopgenerated.ListWorkspaceIssueTaskRunsRequestObject) (nextopgenerated.ListWorkspaceIssueTaskRunsResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.ListWorkspaceIssueTaskRuns503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	runs, err := api.IssueService.ListRuns(ctx, string(request.WorkspaceID), string(request.IssueID), string(request.TaskID))
	if err != nil {
		return writeListWorkspaceIssueTaskRunsError(err), nil
	}
	return nextopgenerated.ListWorkspaceIssueTaskRuns200JSONResponse(
		workspaceapi.GeneratedIssueManagerRunListResponseFromDomain(runs),
	), nil
}

func (api DaemonAPI) CreateWorkspaceIssueTaskRun(ctx context.Context, request nextopgenerated.CreateWorkspaceIssueTaskRunRequestObject) (nextopgenerated.CreateWorkspaceIssueTaskRunResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.CreateWorkspaceIssueTaskRun503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}
	if request.Body == nil {
		return nextopgenerated.CreateWorkspaceIssueTaskRun400JSONResponse{InvalidRequestErrorJSONResponse: issueManagerEmptyBodyError()}, nil
	}

	run, err := api.IssueService.CreateRun(ctx, string(request.WorkspaceID), string(request.IssueID), string(request.TaskID), workspaceservice.CreateIssueManagerRunInput{
		RunID:              optionalString(request.Body.RunId),
		AgentProvider:      request.Body.AgentProvider,
		AgentUserID:        optionalString(request.Body.AgentUserId),
		AgentSessionID:     optionalString(request.Body.AgentSessionId),
		ExecutionDirectory: optionalString(request.Body.ExecutionDirectory),
	})
	if err != nil {
		return writeCreateWorkspaceIssueTaskRunError(err), nil
	}
	return nextopgenerated.CreateWorkspaceIssueTaskRun201JSONResponse(
		workspaceapi.GeneratedIssueManagerRunResponseFromDomain(run),
	), nil
}

func (api DaemonAPI) GetWorkspaceIssueTaskRun(ctx context.Context, request nextopgenerated.GetWorkspaceIssueTaskRunRequestObject) (nextopgenerated.GetWorkspaceIssueTaskRunResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.GetWorkspaceIssueTaskRun503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}

	detail, err := api.IssueService.GetRunDetail(ctx, string(request.WorkspaceID), string(request.IssueID), string(request.TaskID), string(request.RunID))
	if err != nil {
		return writeGetWorkspaceIssueTaskRunError(err), nil
	}
	return nextopgenerated.GetWorkspaceIssueTaskRun200JSONResponse(
		workspaceapi.GeneratedIssueManagerRunEnvelopeFromDomain(detail),
	), nil
}

func (api DaemonAPI) CompleteWorkspaceIssueTaskRun(ctx context.Context, request nextopgenerated.CompleteWorkspaceIssueTaskRunRequestObject) (nextopgenerated.CompleteWorkspaceIssueTaskRunResponseObject, error) {
	if api.IssueService == nil {
		return nextopgenerated.CompleteWorkspaceIssueTaskRun503JSONResponse{ServiceUnavailableErrorJSONResponse: issueManagerServiceUnavailableError()}, nil
	}
	if request.Body == nil {
		return nextopgenerated.CompleteWorkspaceIssueTaskRun400JSONResponse{InvalidRequestErrorJSONResponse: issueManagerEmptyBodyError()}, nil
	}

	detail, err := api.IssueService.CompleteRun(ctx, string(request.WorkspaceID), string(request.IssueID), string(request.TaskID), string(request.RunID), workspaceservice.CompleteIssueManagerRunInput{
		Status:       string(request.Body.Status),
		Summary:      optionalString(request.Body.Summary),
		ErrorMessage: optionalString(request.Body.ErrorMessage),
		Outputs:      issueManagerRunOutputsInputFromGenerated(request.Body.Outputs),
	})
	if err != nil {
		return writeCompleteWorkspaceIssueTaskRunError(err), nil
	}
	return nextopgenerated.CompleteWorkspaceIssueTaskRun200JSONResponse(
		workspaceapi.GeneratedIssueManagerRunEnvelopeFromDomain(detail),
	), nil
}

func issueManagerIssueListInputFromGenerated(params nextopgenerated.ListWorkspaceIssuesParams) workspaceservice.ListIssueManagerItemsInput {
	input := workspaceservice.ListIssueManagerItemsInput{
		TopicID: string(params.TopicId),
	}
	if params.PageSize != nil {
		input.PageSize = int(*params.PageSize)
	}
	if params.PageToken != nil {
		input.PageToken = string(*params.PageToken)
	}
	if params.StatusFilter != nil {
		input.StatusFilter = string(*params.StatusFilter)
	}
	if params.SearchQuery != nil {
		input.SearchQuery = string(*params.SearchQuery)
	}
	return input
}

func issueManagerTaskListInputFromGenerated(params nextopgenerated.ListWorkspaceIssueTasksParams) workspaceservice.ListIssueManagerItemsInput {
	input := workspaceservice.ListIssueManagerItemsInput{}
	if params.PageSize != nil {
		input.PageSize = int(*params.PageSize)
	}
	if params.PageToken != nil {
		input.PageToken = string(*params.PageToken)
	}
	if params.StatusFilter != nil {
		input.StatusFilter = string(*params.StatusFilter)
	}
	if params.SearchQuery != nil {
		input.SearchQuery = string(*params.SearchQuery)
	}
	return input
}

func issueManagerContextRefsInputFromGenerated(items []nextopgenerated.AddIssueManagerContextRefItem) []workspaceissues.AddContextRefInput {
	refs := make([]workspaceissues.AddContextRefInput, 0, len(items))
	for _, item := range items {
		refs = append(refs, workspaceissues.AddContextRefInput{
			ContextRefID: optionalString(item.ContextRefId),
			RefType:      item.RefType,
			Path:         item.Path,
			DisplayName:  optionalString(item.DisplayName),
		})
	}
	return refs
}

func issueManagerRunOutputsInputFromGenerated(items []nextopgenerated.CompleteIssueManagerRunOutputItem) []workspaceissues.CompleteRunOutputInput {
	outputs := make([]workspaceissues.CompleteRunOutputInput, 0, len(items))
	for _, item := range items {
		outputs = append(outputs, workspaceissues.CompleteRunOutputInput{
			OutputID:    optionalString(item.OutputId),
			Path:        item.Path,
			DisplayName: optionalString(item.DisplayName),
			MediaType:   optionalString(item.MediaType),
			SizeBytes:   optionalInt64(item.SizeBytes),
		})
	}
	return outputs
}

func issueManagerEmptyBodyError() nextopgenerated.InvalidRequestErrorJSONResponse {
	return invalidRequestError(apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")))
}

func optionalString(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func optionalInt64(value *int64) int64 {
	if value == nil {
		return 0
	}
	return *value
}

func optionalBool(value *bool) bool {
	if value == nil {
		return false
	}
	return *value
}

func optionalUnixMillis(value *int64) int64 {
	return workspaceapi.UnixMillisFromSeconds(optionalInt64(value))
}

func optionalIssueManagerStatus(value *nextopgenerated.IssueManagerStatus) string {
	if value == nil {
		return ""
	}
	return string(*value)
}

func optionalIssueManagerPriority(value *nextopgenerated.IssueManagerPriority) string {
	if value == nil {
		return ""
	}
	return string(*value)
}
