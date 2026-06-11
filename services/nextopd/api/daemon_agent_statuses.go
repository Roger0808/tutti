package api

import (
	"context"
	"errors"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
	agentproviderbiz "github.com/tutti-os/tutti/services/nextopd/biz/agentprovider"
	preferencesbiz "github.com/tutti-os/tutti/services/nextopd/biz/preferences"
	agentstatusservice "github.com/tutti-os/tutti/services/nextopd/service/agentstatus"
)

func agentStatusServiceUnavailableError() nextopgenerated.ServiceUnavailableErrorJSONResponse {
	return serviceUnavailableError(
		apierrors.ServiceUnavailable(
			"agent_status_service_unavailable",
			apierrors.WithDeveloperMessage("agent provider status service is unavailable"),
		),
	)
}

func (api DaemonAPI) GetAgentProviderStatuses(ctx context.Context, request nextopgenerated.GetAgentProviderStatusesRequestObject) (nextopgenerated.GetAgentProviderStatusesResponseObject, error) {
	if api.AgentStatusService == nil {
		return nextopgenerated.GetAgentProviderStatuses503JSONResponse{
			ServiceUnavailableErrorJSONResponse: agentStatusServiceUnavailableError(),
		}, nil
	}

	snapshot, err := api.AgentStatusService.List(ctx, agentstatusservice.ListInput{
		Providers: generatedAgentStatusProviders(request.Params.Providers),
	})
	if err != nil {
		return writeGetAgentProviderStatusesError(err), nil
	}
	return nextopgenerated.GetAgentProviderStatuses200JSONResponse(
		generatedAgentProviderStatusList(snapshot, api.defaultAgentProvider(ctx)),
	), nil
}

func (api DaemonAPI) ProbeAgentProvider(ctx context.Context, request nextopgenerated.ProbeAgentProviderRequestObject) (nextopgenerated.ProbeAgentProviderResponseObject, error) {
	if api.AgentStatusService == nil {
		return nextopgenerated.ProbeAgentProvider503JSONResponse{
			ServiceUnavailableErrorJSONResponse: agentStatusServiceUnavailableError(),
		}, nil
	}

	result, err := api.AgentStatusService.Probe(ctx, agentstatusservice.ProbeInput{
		Provider: string(request.Provider),
	})
	if err != nil {
		return writeProbeAgentProviderError(err), nil
	}
	return nextopgenerated.ProbeAgentProvider200JSONResponse(
		generatedAgentProviderProbe(result),
	), nil
}

func (api DaemonAPI) RunAgentProviderAction(ctx context.Context, request nextopgenerated.RunAgentProviderActionRequestObject) (nextopgenerated.RunAgentProviderActionResponseObject, error) {
	if api.AgentStatusService == nil {
		return nextopgenerated.RunAgentProviderAction503JSONResponse{
			ServiceUnavailableErrorJSONResponse: agentStatusServiceUnavailableError(),
		}, nil
	}

	result, err := api.AgentStatusService.RunAction(ctx, agentstatusservice.RunActionInput{
		Provider: string(request.Provider),
		ActionID: agentstatusservice.ActionID(request.ActionID),
	})
	if err != nil {
		return writeRunAgentProviderActionError(err), nil
	}
	return nextopgenerated.RunAgentProviderAction200JSONResponse(
		generatedAgentProviderActionRun(result),
	), nil
}

func writeGetAgentProviderStatusesError(err error) nextopgenerated.GetAgentProviderStatusesResponseObject {
	if errors.Is(err, agentstatusservice.ErrInvalidProvider) {
		return nextopgenerated.GetAgentProviderStatuses400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MalformedRequest(apierrors.WithCause(err)),
			),
		}
	}
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.GetAgentProviderStatuses400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.GetAgentProviderStatuses503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr),
		}
	default:
		return nextopgenerated.GetAgentProviderStatuses502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeProbeAgentProviderError(err error) nextopgenerated.ProbeAgentProviderResponseObject {
	if errors.Is(err, agentstatusservice.ErrInvalidProvider) {
		return nextopgenerated.ProbeAgentProvider400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MalformedRequest(apierrors.WithCause(err)),
			),
		}
	}
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.ProbeAgentProvider400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.ProbeAgentProvider503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr),
		}
	default:
		return nextopgenerated.ProbeAgentProvider502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func writeRunAgentProviderActionError(err error) nextopgenerated.RunAgentProviderActionResponseObject {
	if errors.Is(err, agentstatusservice.ErrInvalidProvider) || errors.Is(err, agentstatusservice.ErrInvalidAction) {
		return nextopgenerated.RunAgentProviderAction400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MalformedRequest(apierrors.WithCause(err)),
			),
		}
	}
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.RunAgentProviderAction400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.RunAgentProviderAction503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr),
		}
	default:
		return nextopgenerated.RunAgentProviderAction502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func generatedAgentStatusProviders(providers *[]nextopgenerated.WorkspaceAgentProvider) []string {
	if providers == nil || len(*providers) == 0 {
		return nil
	}
	result := make([]string, 0, len(*providers))
	for _, provider := range *providers {
		result = append(result, string(provider))
	}
	return result
}

func (api DaemonAPI) defaultAgentProvider(ctx context.Context) nextopgenerated.WorkspaceAgentProvider {
	defaultProvider := preferencesbiz.DefaultDesktopPreferences().DefaultAgentProvider
	if api.PreferencesService != nil {
		if preferences, err := api.PreferencesService.Get(ctx); err == nil {
			defaultProvider = preferences.DefaultAgentProvider
		}
	}
	normalized := agentproviderbiz.Normalize(defaultProvider)
	if normalized == "" {
		normalized = preferencesbiz.DefaultDesktopPreferences().DefaultAgentProvider
	}
	return nextopgenerated.WorkspaceAgentProvider(normalized)
}

func generatedAgentProviderStatusList(snapshot agentstatusservice.Snapshot, defaultProvider nextopgenerated.WorkspaceAgentProvider) nextopgenerated.AgentProviderStatusListResponse {
	return nextopgenerated.AgentProviderStatusListResponse{
		CapturedAt:      snapshot.CapturedAt,
		DefaultProvider: defaultProvider,
		Providers:       generatedAgentProviderStatuses(snapshot.Providers),
	}
}

func generatedAgentProviderActionRun(result agentstatusservice.RunActionResult) nextopgenerated.AgentProviderActionRunResponse {
	return nextopgenerated.AgentProviderActionRunResponse{
		ActionID:    nextopgenerated.AgentProviderActionID(result.ActionID),
		Command:     stringPointerIfNotBlank(result.Command),
		CompletedAt: result.CompletedAt,
		ExitCode:    result.ExitCode,
		Message:     stringPointerIfNotBlank(result.Message),
		Probe:       generatedAgentProviderProbePointer(result.Probe),
		Provider:    nextopgenerated.WorkspaceAgentProvider(result.Provider),
		ReasonCode:  stringPointerIfNotBlank(result.ReasonCode),
		Status:      nextopgenerated.AgentProviderActionRunStatus(result.Status),
		Stderr:      stringPointerIfNotBlank(result.Stderr),
		Stdout:      stringPointerIfNotBlank(result.Stdout),
	}
}

func generatedAgentProviderProbe(result agentstatusservice.ProbeResult) nextopgenerated.AgentProviderProbeResponse {
	return nextopgenerated.AgentProviderProbeResponse{
		BinaryPath: stringPointerIfNotBlank(result.BinaryPath),
		CheckedAt:  result.CheckedAt,
		Command:    cloneGeneratedStrings(result.Command),
		Message:    stringPointerIfNotBlank(result.Message),
		Provider:   nextopgenerated.WorkspaceAgentProvider(result.Provider),
		ReasonCode: stringPointerIfNotBlank(result.ReasonCode),
		Status:     nextopgenerated.AgentProviderProbeStatus(result.Status),
	}
}

func generatedAgentProviderProbePointer(result *agentstatusservice.ProbeResult) *nextopgenerated.AgentProviderProbeResponse {
	if result == nil {
		return nil
	}
	generated := generatedAgentProviderProbe(*result)
	return &generated
}

func generatedAgentProviderStatuses(statuses []agentstatusservice.ProviderStatus) []nextopgenerated.AgentProviderStatus {
	if len(statuses) == 0 {
		return []nextopgenerated.AgentProviderStatus{}
	}
	result := make([]nextopgenerated.AgentProviderStatus, 0, len(statuses))
	for _, status := range statuses {
		result = append(result, generatedAgentProviderStatus(status))
	}
	return result
}

func generatedAgentProviderStatus(status agentstatusservice.ProviderStatus) nextopgenerated.AgentProviderStatus {
	return nextopgenerated.AgentProviderStatus{
		Actions:      generatedAgentProviderActions(status.Actions),
		Adapter:      generatedAgentProviderAdapterStatus(status.Adapter),
		Auth:         generatedAgentProviderAuthInfo(status.Auth),
		Availability: generatedAgentProviderAvailability(status.Availability),
		Cli:          generatedAgentProviderCLIStatus(status.CLI),
		Provider:     nextopgenerated.WorkspaceAgentProvider(status.Provider),
	}
}

func generatedAgentProviderAvailability(availability agentstatusservice.Availability) nextopgenerated.AgentProviderAvailability {
	return nextopgenerated.AgentProviderAvailability{
		CheckedAt:  availability.CheckedAt,
		ReasonCode: stringPointerIfNotBlank(availability.ReasonCode),
		Status:     nextopgenerated.AgentProviderAvailabilityStatus(availability.Status),
	}
}

func generatedAgentProviderCLIStatus(status agentstatusservice.CLIStatus) nextopgenerated.AgentProviderCliStatus {
	return nextopgenerated.AgentProviderCliStatus{
		BinaryPath: stringPointerIfNotBlank(status.BinaryPath),
		Installed:  status.Installed,
		Version:    stringPointerIfNotBlank(status.Version),
	}
}

func generatedAgentProviderAdapterStatus(status agentstatusservice.AdapterStatus) nextopgenerated.AgentProviderAdapterStatus {
	return nextopgenerated.AgentProviderAdapterStatus{
		BinaryPath: stringPointerIfNotBlank(status.BinaryPath),
		Command:    cloneGeneratedStrings(status.Command),
		Installed:  status.Installed,
	}
}

func generatedAgentProviderAuthInfo(auth agentstatusservice.AuthInfo) nextopgenerated.AgentProviderAuthInfo {
	return nextopgenerated.AgentProviderAuthInfo{
		AccountLabel: stringPointerIfNotBlank(auth.AccountLabel),
		Status:       nextopgenerated.AgentProviderAuthStatus(auth.Status),
	}
}

func generatedAgentProviderActions(actions []agentstatusservice.Action) []nextopgenerated.AgentProviderAction {
	if len(actions) == 0 {
		return []nextopgenerated.AgentProviderAction{}
	}
	result := make([]nextopgenerated.AgentProviderAction, 0, len(actions))
	for _, action := range actions {
		result = append(result, nextopgenerated.AgentProviderAction{
			Command: generatedAgentProviderTerminalCommand(action.Command),
			Id:      nextopgenerated.AgentProviderActionID(action.ID),
			Kind:    nextopgenerated.AgentProviderActionKind(action.Kind),
		})
	}
	return result
}

func generatedAgentProviderTerminalCommand(command *agentstatusservice.TerminalCommand) *nextopgenerated.AgentProviderTerminalCommand {
	if command == nil {
		return nil
	}
	return &nextopgenerated.AgentProviderTerminalCommand{
		Cwd:   stringPointerIfNotBlank(command.CWD),
		Input: command.Input,
	}
}

func stringPointerIfNotBlank(value string) *string {
	if value == "" {
		return nil
	}
	return stringPointer(value)
}

func cloneGeneratedStrings(input []string) []string {
	if len(input) == 0 {
		return []string{}
	}
	result := make([]string, len(input))
	copy(result, input)
	return result
}
