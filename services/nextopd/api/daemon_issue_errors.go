package api

import (
	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
)

func workspaceIssueResourceNotFoundError(err *apierrors.ProtocolError) nextopgenerated.WorkspaceIssueResourceNotFoundErrorJSONResponse {
	return nextopgenerated.WorkspaceIssueResourceNotFoundErrorJSONResponse(protocolErrorResponse(err))
}

func workspaceIssueResourceExistsError(err *apierrors.ProtocolError) nextopgenerated.WorkspaceIssueResourceExistsErrorJSONResponse {
	return nextopgenerated.WorkspaceIssueResourceExistsErrorJSONResponse(protocolErrorResponse(err))
}

func issueManagerServiceUnavailableError() nextopgenerated.ServiceUnavailableErrorJSONResponse {
	return serviceUnavailableError(
		apierrors.WorkspaceIssueServiceUnavailable(
			apierrors.WithDeveloperMessage("workspace issue-manager service is unavailable"),
		),
	)
}

func writeListWorkspaceIssuesError(err error) nextopgenerated.ListWorkspaceIssuesResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ListWorkspaceIssues400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.ListWorkspaceIssues404JSONResponse{WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.ListWorkspaceIssues404JSONResponse{WorkspaceNotFoundErrorJSONResponse: nextopgenerated.WorkspaceNotFoundErrorJSONResponse(protocolErrorResponse(protocolErr))}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.ListWorkspaceIssues503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.ListWorkspaceIssues502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeListWorkspaceIssueTopicsError(err error) nextopgenerated.ListWorkspaceIssueTopicsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ListWorkspaceIssueTopics400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.ListWorkspaceIssueTopics404JSONResponse{WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.ListWorkspaceIssueTopics503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.ListWorkspaceIssueTopics502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeCreateWorkspaceIssueTopicError(err error) nextopgenerated.CreateWorkspaceIssueTopicResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CreateWorkspaceIssueTopic400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.CreateWorkspaceIssueTopic404JSONResponse{WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceExists:
		return nextopgenerated.CreateWorkspaceIssueTopic409JSONResponse{WorkspaceIssueResourceExistsErrorJSONResponse: workspaceIssueResourceExistsError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.CreateWorkspaceIssueTopic503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.CreateWorkspaceIssueTopic502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeUpdateWorkspaceIssueTopicError(err error) nextopgenerated.UpdateWorkspaceIssueTopicResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.UpdateWorkspaceIssueTopic400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.UpdateWorkspaceIssueTopic404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.UpdateWorkspaceIssueTopic503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.UpdateWorkspaceIssueTopic502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeDeleteWorkspaceIssueTopicError(err error) nextopgenerated.DeleteWorkspaceIssueTopicResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.DeleteWorkspaceIssueTopic400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.DeleteWorkspaceIssueTopic404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceExists:
		return nextopgenerated.DeleteWorkspaceIssueTopic409JSONResponse{WorkspaceIssueResourceExistsErrorJSONResponse: workspaceIssueResourceExistsError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.DeleteWorkspaceIssueTopic503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.DeleteWorkspaceIssueTopic502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeCreateWorkspaceIssueError(err error) nextopgenerated.CreateWorkspaceIssueResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CreateWorkspaceIssue400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.CreateWorkspaceIssue404JSONResponse{WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.CreateWorkspaceIssue404JSONResponse{WorkspaceNotFoundErrorJSONResponse: nextopgenerated.WorkspaceNotFoundErrorJSONResponse(protocolErrorResponse(protocolErr))}
	case nextopgenerated.WorkspaceIssueResourceExists:
		return nextopgenerated.CreateWorkspaceIssue409JSONResponse{WorkspaceIssueResourceExistsErrorJSONResponse: workspaceIssueResourceExistsError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.CreateWorkspaceIssue503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.CreateWorkspaceIssue502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeRemoveWorkspaceIssueContextRefError(err error) nextopgenerated.RemoveWorkspaceIssueContextRefResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.RemoveWorkspaceIssueContextRef400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.RemoveWorkspaceIssueContextRef404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.RemoveWorkspaceIssueContextRef503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.RemoveWorkspaceIssueContextRef502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeRemoveWorkspaceIssueTaskContextRefError(err error) nextopgenerated.RemoveWorkspaceIssueTaskContextRefResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.RemoveWorkspaceIssueTaskContextRef400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.RemoveWorkspaceIssueTaskContextRef404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.RemoveWorkspaceIssueTaskContextRef503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.RemoveWorkspaceIssueTaskContextRef502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeDeleteWorkspaceIssueError(err error) nextopgenerated.DeleteWorkspaceIssueResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.DeleteWorkspaceIssue400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.DeleteWorkspaceIssue404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.DeleteWorkspaceIssue503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.DeleteWorkspaceIssue502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeGetWorkspaceIssueDetailError(err error) nextopgenerated.GetWorkspaceIssueDetailResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.GetWorkspaceIssueDetail400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.GetWorkspaceIssueDetail404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.GetWorkspaceIssueDetail503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.GetWorkspaceIssueDetail502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeUpdateWorkspaceIssueError(err error) nextopgenerated.UpdateWorkspaceIssueResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.UpdateWorkspaceIssue400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.UpdateWorkspaceIssue404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.UpdateWorkspaceIssue503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.UpdateWorkspaceIssue502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeAddWorkspaceIssueContextRefsError(err error) nextopgenerated.AddWorkspaceIssueContextRefsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.AddWorkspaceIssueContextRefs400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.AddWorkspaceIssueContextRefs404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceExists:
		return nextopgenerated.AddWorkspaceIssueContextRefs409JSONResponse{WorkspaceIssueResourceExistsErrorJSONResponse: workspaceIssueResourceExistsError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.AddWorkspaceIssueContextRefs503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.AddWorkspaceIssueContextRefs502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeListWorkspaceIssueTasksError(err error) nextopgenerated.ListWorkspaceIssueTasksResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ListWorkspaceIssueTasks400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.ListWorkspaceIssueTasks404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.ListWorkspaceIssueTasks503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.ListWorkspaceIssueTasks502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeCreateWorkspaceIssueTaskError(err error) nextopgenerated.CreateWorkspaceIssueTaskResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CreateWorkspaceIssueTask400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.CreateWorkspaceIssueTask404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceExists:
		return nextopgenerated.CreateWorkspaceIssueTask409JSONResponse{WorkspaceIssueResourceExistsErrorJSONResponse: workspaceIssueResourceExistsError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.CreateWorkspaceIssueTask503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.CreateWorkspaceIssueTask502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeDeleteWorkspaceIssueTaskError(err error) nextopgenerated.DeleteWorkspaceIssueTaskResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.DeleteWorkspaceIssueTask400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.DeleteWorkspaceIssueTask404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.DeleteWorkspaceIssueTask503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.DeleteWorkspaceIssueTask502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeGetWorkspaceIssueTaskDetailError(err error) nextopgenerated.GetWorkspaceIssueTaskDetailResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.GetWorkspaceIssueTaskDetail400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.GetWorkspaceIssueTaskDetail404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.GetWorkspaceIssueTaskDetail503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.GetWorkspaceIssueTaskDetail502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeUpdateWorkspaceIssueTaskError(err error) nextopgenerated.UpdateWorkspaceIssueTaskResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.UpdateWorkspaceIssueTask400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.UpdateWorkspaceIssueTask404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.UpdateWorkspaceIssueTask503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.UpdateWorkspaceIssueTask502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeAddWorkspaceIssueTaskContextRefsError(err error) nextopgenerated.AddWorkspaceIssueTaskContextRefsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.AddWorkspaceIssueTaskContextRefs400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.AddWorkspaceIssueTaskContextRefs404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceExists:
		return nextopgenerated.AddWorkspaceIssueTaskContextRefs409JSONResponse{WorkspaceIssueResourceExistsErrorJSONResponse: workspaceIssueResourceExistsError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.AddWorkspaceIssueTaskContextRefs503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.AddWorkspaceIssueTaskContextRefs502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeListWorkspaceIssueRunsError(err error) nextopgenerated.ListWorkspaceIssueRunsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ListWorkspaceIssueRuns400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.ListWorkspaceIssueRuns404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.ListWorkspaceIssueRuns503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.ListWorkspaceIssueRuns502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeCreateWorkspaceIssueRunError(err error) nextopgenerated.CreateWorkspaceIssueRunResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CreateWorkspaceIssueRun400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.CreateWorkspaceIssueRun404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceExists:
		return nextopgenerated.CreateWorkspaceIssueRun409JSONResponse{WorkspaceIssueResourceExistsErrorJSONResponse: workspaceIssueResourceExistsError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.CreateWorkspaceIssueRun503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.CreateWorkspaceIssueRun502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeGetWorkspaceIssueRunError(err error) nextopgenerated.GetWorkspaceIssueRunResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.GetWorkspaceIssueRun400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.GetWorkspaceIssueRun404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.GetWorkspaceIssueRun503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.GetWorkspaceIssueRun502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeCompleteWorkspaceIssueRunError(err error) nextopgenerated.CompleteWorkspaceIssueRunResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CompleteWorkspaceIssueRun400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.CompleteWorkspaceIssueRun404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.CompleteWorkspaceIssueRun503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.CompleteWorkspaceIssueRun502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeListWorkspaceIssueTaskRunsError(err error) nextopgenerated.ListWorkspaceIssueTaskRunsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ListWorkspaceIssueTaskRuns400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.ListWorkspaceIssueTaskRuns404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.ListWorkspaceIssueTaskRuns503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.ListWorkspaceIssueTaskRuns502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeCreateWorkspaceIssueTaskRunError(err error) nextopgenerated.CreateWorkspaceIssueTaskRunResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CreateWorkspaceIssueTaskRun400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.CreateWorkspaceIssueTaskRun404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceExists:
		return nextopgenerated.CreateWorkspaceIssueTaskRun409JSONResponse{WorkspaceIssueResourceExistsErrorJSONResponse: workspaceIssueResourceExistsError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.CreateWorkspaceIssueTaskRun503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.CreateWorkspaceIssueTaskRun502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeGetWorkspaceIssueTaskRunError(err error) nextopgenerated.GetWorkspaceIssueTaskRunResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.GetWorkspaceIssueTaskRun400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.GetWorkspaceIssueTaskRun404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.GetWorkspaceIssueTaskRun503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.GetWorkspaceIssueTaskRun502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}

func writeCompleteWorkspaceIssueTaskRunError(err error) nextopgenerated.CompleteWorkspaceIssueTaskRunResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CompleteWorkspaceIssueTaskRun400JSONResponse{InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr)}
	case nextopgenerated.WorkspaceIssueResourceNotFound:
		return nextopgenerated.CompleteWorkspaceIssueTaskRun404JSONResponse{WorkspaceIssueResourceNotFoundErrorJSONResponse: workspaceIssueResourceNotFoundError(protocolErr)}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.CompleteWorkspaceIssueTaskRun503JSONResponse{ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr)}
	default:
		return nextopgenerated.CompleteWorkspaceIssueTaskRun502JSONResponse{WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr)}
	}
}
