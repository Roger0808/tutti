package api

import (
	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
)

func invalidRequestError(err *apierrors.ProtocolError) nextopgenerated.InvalidRequestErrorJSONResponse {
	return nextopgenerated.InvalidRequestErrorJSONResponse(protocolErrorResponse(err))
}

func serviceUnavailableError(err *apierrors.ProtocolError) nextopgenerated.ServiceUnavailableErrorJSONResponse {
	return nextopgenerated.ServiceUnavailableErrorJSONResponse(protocolErrorResponse(err))
}

func workspaceNotFoundError(err *apierrors.ProtocolError) nextopgenerated.WorkspaceNotFoundErrorJSONResponse {
	return nextopgenerated.WorkspaceNotFoundErrorJSONResponse(protocolErrorResponse(err))
}

func workspaceFileNotFoundError(err *apierrors.ProtocolError) nextopgenerated.WorkspaceFileNotFoundErrorJSONResponse {
	return nextopgenerated.WorkspaceFileNotFoundErrorJSONResponse(protocolErrorResponse(err))
}

func workspaceTerminalNotFoundError(err *apierrors.ProtocolError) nextopgenerated.WorkspaceTerminalNotFoundErrorJSONResponse {
	return nextopgenerated.WorkspaceTerminalNotFoundErrorJSONResponse(protocolErrorResponse(err))
}

func workspaceAppNotFoundError(err *apierrors.ProtocolError) nextopgenerated.WorkspaceAppNotFoundErrorJSONResponse {
	return nextopgenerated.WorkspaceAppNotFoundErrorJSONResponse(protocolErrorResponse(err))
}

func workspaceOperationError(err *apierrors.ProtocolError) nextopgenerated.WorkspaceOperationErrorJSONResponse {
	return nextopgenerated.WorkspaceOperationErrorJSONResponse(protocolErrorResponse(err))
}

func preferencesOperationError(err *apierrors.ProtocolError) nextopgenerated.PreferencesOperationErrorJSONResponse {
	return nextopgenerated.PreferencesOperationErrorJSONResponse(protocolErrorResponse(err))
}

func protocolErrorResponse(err *apierrors.ProtocolError) nextopgenerated.ApiErrorResponse {
	if err == nil {
		err = apierrors.WorkspaceOperationFailed()
	}

	response := nextopgenerated.ApiErrorResponse{
		Error: nextopgenerated.ApiErrorDetails{
			Code: err.Code,
		},
	}
	if err.Reason != "" {
		response.Error.Reason = stringPointer(err.Reason)
	}
	if len(err.Params) > 0 {
		params := make(map[string]interface{}, len(err.Params))
		for key, value := range err.Params {
			params[key] = value
		}
		response.Error.Params = &params
	}
	if err.Retryable {
		response.Error.Retryable = boolPointer(true)
	}
	if err.DeveloperMessage != "" {
		response.Error.DeveloperMessage = stringPointer(err.DeveloperMessage)
	}
	if err.CorrelationID != "" {
		response.Error.CorrelationId = stringPointer(err.CorrelationID)
	}
	return response
}

func writeCreateWorkspaceError(err error) nextopgenerated.CreateWorkspaceResponseObject {
	protocolErr := apierrors.Classify(err)
	return nextopgenerated.CreateWorkspace502JSONResponse{
		WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
	}
}

func writeDeleteWorkspaceError(err error) nextopgenerated.DeleteWorkspaceResponseObject {
	protocolErr := apierrors.Classify(err)
	if protocolErr.Code == nextopgenerated.WorkspaceNotFound {
		return nextopgenerated.DeleteWorkspace404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	}

	return nextopgenerated.DeleteWorkspace502JSONResponse{
		WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
	}
}

func writeGetWorkspaceError(err error) nextopgenerated.GetWorkspaceResponseObject {
	protocolErr := apierrors.Classify(err)
	if protocolErr.Code == nextopgenerated.WorkspaceNotFound {
		return nextopgenerated.GetWorkspace404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	}

	return nextopgenerated.GetWorkspace502JSONResponse{
		WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
	}
}

func writeOpenWorkspaceError(err error) nextopgenerated.OpenWorkspaceResponseObject {
	protocolErr := apierrors.Classify(err)
	if protocolErr.Code == nextopgenerated.WorkspaceNotFound {
		return nextopgenerated.OpenWorkspace404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	}

	return nextopgenerated.OpenWorkspace502JSONResponse{
		WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
	}
}

func writeUpdateWorkspaceError(err error) nextopgenerated.UpdateWorkspaceResponseObject {
	protocolErr := apierrors.Classify(err)
	if protocolErr.Code == nextopgenerated.WorkspaceNotFound {
		return nextopgenerated.UpdateWorkspace404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	}

	return nextopgenerated.UpdateWorkspace502JSONResponse{
		WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
	}
}

func writeGetWorkspaceWorkbenchError(err error) nextopgenerated.GetWorkspaceWorkbenchResponseObject {
	protocolErr := apierrors.Classify(err)
	if protocolErr.Code == nextopgenerated.WorkspaceNotFound {
		return nextopgenerated.GetWorkspaceWorkbench404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	}

	return nextopgenerated.GetWorkspaceWorkbench502JSONResponse{
		WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
	}
}

func writeListWorkspaceAgentSessionsError(err error) nextopgenerated.ListWorkspaceAgentSessionsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.ListWorkspaceAgentSessions404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ListWorkspaceAgentSessions400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.ListWorkspaceAgentSessions502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeCreateWorkspaceAgentSessionError(err error) nextopgenerated.CreateWorkspaceAgentSessionResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.CreateWorkspaceAgentSession404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CreateWorkspaceAgentSession400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.CreateWorkspaceAgentSession502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeGetAgentProviderComposerOptionsError(err error) nextopgenerated.GetAgentProviderComposerOptionsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.GetAgentProviderComposerOptions400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.GetAgentProviderComposerOptions502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeGetWorkspaceAgentSessionError(err error) nextopgenerated.GetWorkspaceAgentSessionResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.GetWorkspaceAgentSession404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.GetWorkspaceAgentSession400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.GetWorkspaceAgentSession502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeDeleteWorkspaceAgentSessionError(err error) nextopgenerated.DeleteWorkspaceAgentSessionResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.DeleteWorkspaceAgentSession404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.DeleteWorkspaceAgentSession400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.DeleteWorkspaceAgentSession502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeListWorkspaceAgentSessionMessagesError(err error) nextopgenerated.ListWorkspaceAgentSessionMessagesResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.ListWorkspaceAgentSessionMessages404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ListWorkspaceAgentSessionMessages400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.ListWorkspaceAgentSessionMessages502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeCancelWorkspaceAgentSessionError(err error) nextopgenerated.CancelWorkspaceAgentSessionResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.CancelWorkspaceAgentSession404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CancelWorkspaceAgentSession400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.CancelWorkspaceAgentSession502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeSendWorkspaceAgentSessionInputError(err error) nextopgenerated.SendWorkspaceAgentSessionInputResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.SendWorkspaceAgentSessionInput404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.SendWorkspaceAgentSessionInput400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.SendWorkspaceAgentSessionInput502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeReadWorkspaceAgentSessionAttachmentError(err error) nextopgenerated.ReadWorkspaceAgentSessionAttachmentResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.ReadWorkspaceAgentSessionAttachment404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ReadWorkspaceAgentSessionAttachment400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.ReadWorkspaceAgentSessionAttachment502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeUpdateWorkspaceAgentSessionSettingsError(err error) nextopgenerated.UpdateWorkspaceAgentSessionSettingsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.UpdateWorkspaceAgentSessionSettings404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.UpdateWorkspaceAgentSessionSettings400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.UpdateWorkspaceAgentSessionSettings502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeUpdateWorkspaceAgentSessionPinError(err error) nextopgenerated.UpdateWorkspaceAgentSessionPinResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.UpdateWorkspaceAgentSessionPin404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.UpdateWorkspaceAgentSessionPin400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.UpdateWorkspaceAgentSessionPin502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writePutWorkspaceWorkbenchError(err error) nextopgenerated.PutWorkspaceWorkbenchResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.PutWorkspaceWorkbench400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.PutWorkspaceWorkbench404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	default:
		return nextopgenerated.PutWorkspaceWorkbench502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeListWorkspaceFileDirectoryError(err error) nextopgenerated.ListWorkspaceFileDirectoryResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceFileNotFound:
		return nextopgenerated.ListWorkspaceFileDirectory404JSONResponse{
			WorkspaceFileNotFoundErrorJSONResponse: workspaceFileNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ListWorkspaceFileDirectory400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.ListWorkspaceFileDirectory502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeCreateWorkspaceFileDirectoryError(err error) nextopgenerated.CreateWorkspaceFileDirectoryResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceFileNotFound:
		return nextopgenerated.CreateWorkspaceFileDirectory404JSONResponse{
			WorkspaceFileNotFoundErrorJSONResponse: workspaceFileNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CreateWorkspaceFileDirectory400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.CreateWorkspaceFileDirectory502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeGetWorkspaceFileTreeSnapshotError(err error) nextopgenerated.GetWorkspaceFileTreeSnapshotResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceFileNotFound:
		return nextopgenerated.GetWorkspaceFileTreeSnapshot404JSONResponse{
			WorkspaceFileNotFoundErrorJSONResponse: workspaceFileNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.GetWorkspaceFileTreeSnapshot400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.GetWorkspaceFileTreeSnapshot502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeSubmitWorkspaceAgentInteractiveError(err error) nextopgenerated.SubmitWorkspaceAgentInteractiveResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.SubmitWorkspaceAgentInteractive404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.SubmitWorkspaceAgentInteractive400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.SubmitWorkspaceAgentInteractive502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeListWorkspaceTerminalsError(err error) nextopgenerated.ListWorkspaceTerminalsResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.ListWorkspaceTerminals404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ListWorkspaceTerminals400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.ListWorkspaceTerminals502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeCreateWorkspaceTerminalError(err error) nextopgenerated.CreateWorkspaceTerminalResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.CreateWorkspaceTerminal404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CreateWorkspaceTerminal400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.CreateWorkspaceTerminal502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeGetWorkspaceTerminalError(err error) nextopgenerated.GetWorkspaceTerminalResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceTerminalNotFound:
		return nextopgenerated.GetWorkspaceTerminal404JSONResponse{
			WorkspaceTerminalNotFoundErrorJSONResponse: workspaceTerminalNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.GetWorkspaceTerminal400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.GetWorkspaceTerminal502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeTerminateWorkspaceTerminalError(err error) nextopgenerated.TerminateWorkspaceTerminalResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceTerminalNotFound:
		return nextopgenerated.TerminateWorkspaceTerminal404JSONResponse{
			WorkspaceTerminalNotFoundErrorJSONResponse: workspaceTerminalNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.TerminateWorkspaceTerminal400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.TerminateWorkspaceTerminal502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeCheckWorkspaceTerminalCloseGuardError(err error) nextopgenerated.CheckWorkspaceTerminalCloseGuardResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceTerminalNotFound:
		return nextopgenerated.CheckWorkspaceTerminalCloseGuard404JSONResponse{
			WorkspaceTerminalNotFoundErrorJSONResponse: workspaceTerminalNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CheckWorkspaceTerminalCloseGuard400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.CheckWorkspaceTerminalCloseGuard502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeResizeWorkspaceTerminalError(err error) nextopgenerated.ResizeWorkspaceTerminalResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceTerminalNotFound:
		return nextopgenerated.ResizeWorkspaceTerminal404JSONResponse{
			WorkspaceTerminalNotFoundErrorJSONResponse: workspaceTerminalNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ResizeWorkspaceTerminal400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.ResizeWorkspaceTerminal502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeGetWorkspaceTerminalSnapshotError(err error) nextopgenerated.GetWorkspaceTerminalSnapshotResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceTerminalNotFound:
		return nextopgenerated.GetWorkspaceTerminalSnapshot404JSONResponse{
			WorkspaceTerminalNotFoundErrorJSONResponse: workspaceTerminalNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.GetWorkspaceTerminalSnapshot400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.GetWorkspaceTerminalSnapshot502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeSearchWorkspaceFilesError(err error) nextopgenerated.SearchWorkspaceFilesResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound:
		return nextopgenerated.SearchWorkspaceFiles404JSONResponse{
			WorkspaceNotFoundErrorJSONResponse: workspaceNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.SearchWorkspaceFiles400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.SearchWorkspaceFiles502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeCreateWorkspaceFileError(err error) nextopgenerated.CreateWorkspaceFileResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceFileNotFound:
		return nextopgenerated.CreateWorkspaceFile404JSONResponse{
			WorkspaceFileNotFoundErrorJSONResponse: workspaceFileNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CreateWorkspaceFile400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.CreateWorkspaceFile502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeReadWorkspaceFilePreviewError(err error) nextopgenerated.ReadWorkspaceFilePreviewResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceFileNotFound:
		return nextopgenerated.ReadWorkspaceFilePreview404JSONResponse{
			WorkspaceFileNotFoundErrorJSONResponse: workspaceFileNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ReadWorkspaceFilePreview400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.ReadWorkspaceFilePreview502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeWriteWorkspaceFileTextError(err error) nextopgenerated.WriteWorkspaceFileTextResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceFileNotFound:
		return nextopgenerated.WriteWorkspaceFileText404JSONResponse{
			WorkspaceFileNotFoundErrorJSONResponse: workspaceFileNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.WriteWorkspaceFileText400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.WriteWorkspaceFileText502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeDeleteWorkspaceFileEntryError(err error) nextopgenerated.DeleteWorkspaceFileEntryResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceFileNotFound:
		return nextopgenerated.DeleteWorkspaceFileEntry404JSONResponse{
			WorkspaceFileNotFoundErrorJSONResponse: workspaceFileNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.DeleteWorkspaceFileEntry400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.DeleteWorkspaceFileEntry502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeMoveWorkspaceFileEntryError(err error) nextopgenerated.MoveWorkspaceFileEntryResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceFileNotFound:
		return nextopgenerated.MoveWorkspaceFileEntry404JSONResponse{
			WorkspaceFileNotFoundErrorJSONResponse: workspaceFileNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.MoveWorkspaceFileEntry400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.MoveWorkspaceFileEntry502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeRenameWorkspaceFileEntryError(err error) nextopgenerated.RenameWorkspaceFileEntryResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceFileNotFound:
		return nextopgenerated.RenameWorkspaceFileEntry404JSONResponse{
			WorkspaceFileNotFoundErrorJSONResponse: workspaceFileNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.RenameWorkspaceFileEntry400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.RenameWorkspaceFileEntry502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeCopyWorkspaceFileEntryError(err error) nextopgenerated.CopyWorkspaceFileEntryResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceFileNotFound:
		return nextopgenerated.CopyWorkspaceFileEntry404JSONResponse{
			WorkspaceFileNotFoundErrorJSONResponse: workspaceFileNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.CopyWorkspaceFileEntry400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.CopyWorkspaceFileEntry502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeUploadWorkspaceFilesError(err error) nextopgenerated.UploadWorkspaceFilesResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceFileNotFound:
		return nextopgenerated.UploadWorkspaceFiles404JSONResponse{
			WorkspaceFileNotFoundErrorJSONResponse: workspaceFileNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.UploadWorkspaceFiles400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.UploadWorkspaceFiles502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writePreflightUploadWorkspaceFilesError(err error) nextopgenerated.PreflightUploadWorkspaceFilesResponseObject {
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.WorkspaceNotFound, nextopgenerated.WorkspaceFileNotFound:
		return nextopgenerated.PreflightUploadWorkspaceFiles404JSONResponse{
			WorkspaceFileNotFoundErrorJSONResponse: workspaceFileNotFoundError(protocolErr),
		}
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.PreflightUploadWorkspaceFiles400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	default:
		return nextopgenerated.PreflightUploadWorkspaceFiles502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func boolPointer(value bool) *bool {
	return &value
}

func stringPointer(value string) *string {
	return &value
}
