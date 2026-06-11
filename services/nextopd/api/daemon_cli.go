package api

import (
	"context"
	"errors"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
	cliservice "github.com/tutti-os/tutti/services/nextopd/service/cli"
)

func (api DaemonAPI) ListCliCapabilities(ctx context.Context, request nextopgenerated.ListCliCapabilitiesRequestObject) (nextopgenerated.ListCliCapabilitiesResponseObject, error) {
	if api.CLIRegistry == nil {
		return nextopgenerated.ListCliCapabilities503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.ServiceUnavailable("cli_registry_unavailable", apierrors.WithDeveloperMessage("cli registry is unavailable")),
			),
		}, nil
	}

	workspaceID := ""
	if request.Params.WorkspaceID != nil {
		workspaceID = *request.Params.WorkspaceID
	}
	capabilities := api.CLIRegistry.Capabilities(ctx, cliservice.InvokeContext{Source: "cli", WorkspaceID: workspaceID})
	return nextopgenerated.ListCliCapabilities200JSONResponse{
		Commands: generatedCliCapabilities(capabilities),
	}, nil
}

func (api DaemonAPI) InvokeCliCommand(ctx context.Context, request nextopgenerated.InvokeCliCommandRequestObject) (nextopgenerated.InvokeCliCommandResponseObject, error) {
	if api.CLIRegistry == nil {
		return nextopgenerated.InvokeCliCommand503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.ServiceUnavailable("cli_registry_unavailable", apierrors.WithDeveloperMessage("cli registry is unavailable")),
			),
		}, nil
	}
	if request.Body == nil {
		return nextopgenerated.InvokeCliCommand400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body"))),
		}, nil
	}

	output, err := api.CLIRegistry.Invoke(ctx, cliservice.InvokeRequest{
		CommandID:  request.CommandID,
		Input:      generatedCliInput(request.Body.Input),
		OutputMode: serviceCliOutputMode(request.Body.OutputMode),
		Context:    serviceCliContext(request.Body.Context),
	})
	if err != nil {
		return writeInvokeCliCommandError(err), nil
	}
	return nextopgenerated.InvokeCliCommand200JSONResponse{
		Ok:     true,
		Output: generatedCliCommandOutput(output),
	}, nil
}

func writeInvokeCliCommandError(err error) nextopgenerated.InvokeCliCommandResponseObject {
	if errors.Is(err, cliservice.ErrCommandNotFound) {
		return nextopgenerated.InvokeCliCommand404JSONResponse(protocolErrorResponse(
			apierrors.InvalidRequest("cli_command_not_found", apierrors.WithDeveloperMessage("cli command not found")),
		))
	}
	if errors.Is(err, cliservice.ErrInvalidInput) {
		return nextopgenerated.InvokeCliCommand400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.MalformedRequest(apierrors.WithCause(err)),
			),
		}
	}
	if errors.Is(err, cliservice.ErrServiceUnavailable) {
		reason := cliservice.InvokeErrorReason(err)
		if reason == "" {
			reason = "cli_service_unavailable"
		}
		return nextopgenerated.InvokeCliCommand503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.ServiceUnavailable(reason, apierrors.WithCause(err)),
			),
		}
	}
	if errors.Is(err, cliservice.ErrWorkspaceOperation) {
		return nextopgenerated.InvokeCliCommand502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(
				apierrors.WorkspaceOperationFailed(apierrors.WithCause(err)),
			),
		}
	}
	protocolErr := apierrors.Classify(err)
	switch protocolErr.Code {
	case nextopgenerated.InvalidRequest:
		return nextopgenerated.InvokeCliCommand400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(protocolErr),
		}
	case nextopgenerated.ServiceUnavailable:
		return nextopgenerated.InvokeCliCommand503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(protocolErr),
		}
	default:
		return nextopgenerated.InvokeCliCommand502JSONResponse{
			WorkspaceOperationErrorJSONResponse: workspaceOperationError(protocolErr),
		}
	}
}

func generatedCliCapabilities(capabilities []cliservice.Capability) []nextopgenerated.CliCapability {
	if len(capabilities) == 0 {
		return []nextopgenerated.CliCapability{}
	}
	result := make([]nextopgenerated.CliCapability, 0, len(capabilities))
	for _, capability := range capabilities {
		result = append(result, generatedCliCapability(capability))
	}
	return result
}

func generatedCliCapability(capability cliservice.Capability) nextopgenerated.CliCapability {
	var description *string
	if capability.Description != "" {
		description = stringPointer(capability.Description)
	}
	var inputSchema *map[string]interface{}
	if len(capability.InputSchema) > 0 {
		schema := make(map[string]interface{}, len(capability.InputSchema))
		for key, value := range capability.InputSchema {
			schema[key] = value
		}
		inputSchema = &schema
	}
	return nextopgenerated.CliCapability{
		Id:          capability.ID,
		Path:        capability.Path,
		Summary:     capability.Summary,
		Description: description,
		InputSchema: inputSchema,
		Output:      generatedCliCapabilityOutput(capability.Output),
		Source:      generatedCliCapabilitySource(capability.Source),
	}
}

func generatedCliCapabilitySource(source cliservice.CapabilitySource) nextopgenerated.CliCapabilitySource {
	if source.Kind == cliservice.CapabilitySourceApp {
		return nextopgenerated.CliCapabilitySource{
			Kind:              nextopgenerated.App,
			AppId:             stringPointerIfNotBlank(source.AppID),
			AppName:           stringPointerIfNotBlank(source.AppName),
			IconUrl:           stringPointerIfNotBlank(source.IconURL),
			CliDescription:    stringPointerIfNotBlank(source.CLIDescription),
			AppDescription:    stringPointerIfNotBlank(source.AppDescription),
			DocumentationFile: stringPointerIfNotBlank(source.DocumentationFile),
			DocumentationPath: stringPointerIfNotBlank(source.DocumentationPath),
		}
	}
	return nextopgenerated.CliCapabilitySource{Kind: nextopgenerated.Builtin}
}

func generatedCliCapabilityOutput(output cliservice.CapabilityOutput) nextopgenerated.CliCapabilityOutput {
	return nextopgenerated.CliCapabilityOutput{
		DefaultMode: generatedCliOutputMode(output.DefaultMode),
		Json:        output.JSON,
		Table:       generatedCliTableOutput(output.Table),
	}
}

func generatedCliTableOutput(output *cliservice.TableOutput) *nextopgenerated.CliTableOutput {
	if output == nil {
		return nil
	}
	return &nextopgenerated.CliTableOutput{Columns: generatedCliTableColumns(output.Columns)}
}

func generatedCliCommandOutput(output cliservice.CommandOutput) *nextopgenerated.CliCommandOutput {
	result := &nextopgenerated.CliCommandOutput{
		Kind: generatedCliOutputMode(output.Kind),
	}
	if len(output.Columns) > 0 {
		columns := generatedCliTableColumns(output.Columns)
		result.Columns = &columns
	}
	if output.Rows != nil {
		rows := make([]map[string]interface{}, 0, len(output.Rows))
		for _, row := range output.Rows {
			converted := make(map[string]interface{}, len(row))
			for key, value := range row {
				converted[key] = value
			}
			rows = append(rows, converted)
		}
		result.Rows = &rows
	}
	if len(output.Value) > 0 {
		value := make(map[string]interface{}, len(output.Value))
		for key, entry := range output.Value {
			value[key] = entry
		}
		result.Value = &value
	}
	if output.Text != "" {
		result.Text = stringPointer(output.Text)
	}
	return result
}

func generatedCliTableColumns(columns []cliservice.TableColumn) []nextopgenerated.CliTableColumn {
	if len(columns) == 0 {
		return []nextopgenerated.CliTableColumn{}
	}
	result := make([]nextopgenerated.CliTableColumn, 0, len(columns))
	for _, column := range columns {
		result = append(result, nextopgenerated.CliTableColumn{
			Key:   column.Key,
			Label: column.Label,
		})
	}
	return result
}

func generatedCliOutputMode(mode cliservice.OutputMode) nextopgenerated.CliOutputMode {
	switch mode {
	case cliservice.OutputModeJSON:
		return nextopgenerated.Json
	case cliservice.OutputModePlain:
		return nextopgenerated.Plain
	case cliservice.OutputModeMarkdown:
		return nextopgenerated.Markdown
	default:
		return nextopgenerated.Table
	}
}

func serviceCliOutputMode(mode *nextopgenerated.CliOutputMode) cliservice.OutputMode {
	if mode == nil {
		return ""
	}
	switch *mode {
	case nextopgenerated.Json:
		return cliservice.OutputModeJSON
	case nextopgenerated.Plain:
		return cliservice.OutputModePlain
	case nextopgenerated.Markdown:
		return cliservice.OutputModeMarkdown
	default:
		return cliservice.OutputModeTable
	}
}

func serviceCliContext(contextValue *nextopgenerated.CliInvokeContext) cliservice.InvokeContext {
	if contextValue == nil {
		return cliservice.InvokeContext{Source: "cli"}
	}
	workspaceID := ""
	if contextValue.WorkspaceID != nil {
		workspaceID = *contextValue.WorkspaceID
	}
	parentCommandID := ""
	if contextValue.ParentCommandId != nil {
		parentCommandID = *contextValue.ParentCommandId
	}
	return cliservice.InvokeContext{
		Source:          contextValue.Source,
		WorkspaceID:     workspaceID,
		ParentCommandID: parentCommandID,
	}
}

func generatedCliInput(input *map[string]interface{}) map[string]any {
	if input == nil {
		return map[string]any{}
	}
	result := make(map[string]any, len(*input))
	for key, value := range *input {
		result[key] = value
	}
	return result
}
