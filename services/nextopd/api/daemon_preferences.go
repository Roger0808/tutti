package api

import (
	"context"
	"strings"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	preferencesapi "github.com/tutti-os/tutti/services/nextopd/api/preferences"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
	agentproviderbiz "github.com/tutti-os/tutti/services/nextopd/biz/agentprovider"
	preferencesbiz "github.com/tutti-os/tutti/services/nextopd/biz/preferences"
	preferencesservice "github.com/tutti-os/tutti/services/nextopd/service/preferences"
)

func (api DaemonAPI) GetDesktopPreferences(ctx context.Context, _ nextopgenerated.GetDesktopPreferencesRequestObject) (nextopgenerated.GetDesktopPreferencesResponseObject, error) {
	if api.PreferencesService == nil {
		return nextopgenerated.GetDesktopPreferences503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.PreferencesServiceUnavailable(
					apierrors.WithDeveloperMessage("desktop preferences service is unavailable"),
				),
			),
		}, nil
	}

	preferences, err := api.PreferencesService.Get(ctx)
	if err != nil {
		return nextopgenerated.GetDesktopPreferences502JSONResponse{
			PreferencesOperationErrorJSONResponse: preferencesOperationError(
				apierrors.PreferencesOperationFailed(apierrors.WithCause(err)),
			),
		}, nil
	}

	return nextopgenerated.GetDesktopPreferences200JSONResponse(
		preferencesapi.GeneratedDesktopPreferencesStateResponseFromBiz(preferences),
	), nil
}

func (api DaemonAPI) PutDesktopPreferences(ctx context.Context, request nextopgenerated.PutDesktopPreferencesRequestObject) (nextopgenerated.PutDesktopPreferencesResponseObject, error) {
	if api.PreferencesService == nil {
		return nextopgenerated.PutDesktopPreferences503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.PreferencesServiceUnavailable(
					apierrors.WithDeveloperMessage("desktop preferences service is unavailable"),
				),
			),
		}, nil
	}

	if request.Body == nil {
		return nextopgenerated.PutDesktopPreferences400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body")),
			),
		}, nil
	}

	defaultAgentProvider := agentproviderbiz.Normalize(string(request.Body.Preferences.DefaultAgentProvider))
	if defaultAgentProvider == "" {
		return nextopgenerated.PutDesktopPreferences400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					apierrors.ReasonUnsupportedDesktopDefaultAgentProvider,
					apierrors.WithDeveloperMessage("desktop default agent provider is unsupported"),
					apierrors.WithParams(map[string]any{"field": "preferences.defaultAgentProvider"}),
				),
			),
		}, nil
	}

	dockIconStyle := strings.TrimSpace(string(request.Body.Preferences.DockIconStyle))
	if dockIconStyle == "" {
		return nextopgenerated.PutDesktopPreferences400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					apierrors.ReasonMissingDesktopDockIconStyle,
					apierrors.WithDeveloperMessage("desktop dock icon style is required"),
					apierrors.WithParams(map[string]any{"field": "preferences.dockIconStyle"}),
				),
			),
		}, nil
	}
	if !preferencesbiz.IsDesktopDockIconStyle(dockIconStyle) {
		return nextopgenerated.PutDesktopPreferences400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					apierrors.ReasonUnsupportedDesktopDockIconStyle,
					apierrors.WithDeveloperMessage("desktop dock icon style is unsupported"),
					apierrors.WithParams(map[string]any{"field": "preferences.dockIconStyle"}),
				),
			),
		}, nil
	}

	dockPlacement := strings.TrimSpace(string(request.Body.Preferences.DockPlacement))
	if dockPlacement == "" {
		return nextopgenerated.PutDesktopPreferences400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					apierrors.ReasonMissingDesktopDockPlacement,
					apierrors.WithDeveloperMessage("desktop dock placement is required"),
					apierrors.WithParams(map[string]any{"field": "preferences.dockPlacement"}),
				),
			),
		}, nil
	}
	if !preferencesbiz.IsDesktopDockPlacement(dockPlacement) {
		return nextopgenerated.PutDesktopPreferences400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					apierrors.ReasonUnsupportedDesktopDockPlacement,
					apierrors.WithDeveloperMessage("desktop dock placement is unsupported"),
					apierrors.WithParams(map[string]any{"field": "preferences.dockPlacement"}),
				),
			),
		}, nil
	}

	locale := strings.TrimSpace(string(request.Body.Preferences.Locale))
	if locale == "" {
		return nextopgenerated.PutDesktopPreferences400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					apierrors.ReasonMissingDesktopLocale,
					apierrors.WithDeveloperMessage("desktop locale is required"),
					apierrors.WithParams(map[string]any{"field": "preferences.locale"}),
				),
			),
		}, nil
	}
	if !preferencesbiz.IsDesktopLocale(locale) {
		return nextopgenerated.PutDesktopPreferences400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					apierrors.ReasonUnsupportedDesktopLocale,
					apierrors.WithDeveloperMessage("desktop locale is unsupported"),
					apierrors.WithParams(map[string]any{"field": "preferences.locale"}),
				),
			),
		}, nil
	}

	sleepPreventionMode := strings.TrimSpace(string(request.Body.Preferences.SleepPreventionMode))
	if sleepPreventionMode == "" {
		return nextopgenerated.PutDesktopPreferences400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					apierrors.ReasonMissingDesktopSleepPreventionMode,
					apierrors.WithDeveloperMessage("desktop sleep prevention mode is required"),
					apierrors.WithParams(map[string]any{"field": "preferences.sleepPreventionMode"}),
				),
			),
		}, nil
	}
	if !preferencesbiz.IsDesktopSleepPreventionMode(sleepPreventionMode) {
		return nextopgenerated.PutDesktopPreferences400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					apierrors.ReasonUnsupportedDesktopSleepPreventionMode,
					apierrors.WithDeveloperMessage("desktop sleep prevention mode is unsupported"),
					apierrors.WithParams(map[string]any{"field": "preferences.sleepPreventionMode"}),
				),
			),
		}, nil
	}

	themeSource := strings.TrimSpace(string(request.Body.Preferences.ThemeSource))
	if themeSource == "" {
		return nextopgenerated.PutDesktopPreferences400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					apierrors.ReasonMissingDesktopThemeSource,
					apierrors.WithDeveloperMessage("desktop theme source is required"),
					apierrors.WithParams(map[string]any{"field": "preferences.themeSource"}),
				),
			),
		}, nil
	}
	if !preferencesbiz.IsDesktopThemeSource(themeSource) {
		return nextopgenerated.PutDesktopPreferences400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					apierrors.ReasonUnsupportedDesktopThemeSource,
					apierrors.WithDeveloperMessage("desktop theme source is unsupported"),
					apierrors.WithParams(map[string]any{"field": "preferences.themeSource"}),
				),
			),
		}, nil
	}

	preferences, err := api.PreferencesService.Put(ctx, preferencesservice.PutInput{
		AgentComposerDefaultsByProvider: agentComposerDefaultsByProviderFromGenerated(
			request.Body.Preferences.AgentComposerDefaultsByProvider,
		),
		DefaultAgentProvider: defaultAgentProvider,
		DockIconStyle:        dockIconStyle,
		DockPlacement:        dockPlacement,
		Locale:               locale,
		SleepPreventionMode:  sleepPreventionMode,
		ThemeSource:          themeSource,
	})
	if err != nil {
		return nextopgenerated.PutDesktopPreferences502JSONResponse{
			PreferencesOperationErrorJSONResponse: preferencesOperationError(
				apierrors.PreferencesOperationFailed(apierrors.WithCause(err)),
			),
		}, nil
	}

	return nextopgenerated.PutDesktopPreferences200JSONResponse(
		preferencesapi.GeneratedDesktopPreferencesStateResponseFromBiz(preferences),
	), nil
}

func agentComposerDefaultsByProviderFromGenerated(
	value nextopgenerated.DesktopAgentComposerDefaultsByProvider,
) map[string]preferencesbiz.AgentComposerDefaults {
	result := map[string]preferencesbiz.AgentComposerDefaults{}
	setAgentComposerDefaultsFromGenerated(result, "claude-code", value.ClaudeCode)
	setAgentComposerDefaultsFromGenerated(result, "codex", value.Codex)
	setAgentComposerDefaultsFromGenerated(result, "gemini", value.Gemini)
	setAgentComposerDefaultsFromGenerated(result, "hermes", value.Hermes)
	setAgentComposerDefaultsFromGenerated(result, "nexight", value.Nexight)
	setAgentComposerDefaultsFromGenerated(result, "openclaw", value.Openclaw)
	return result
}

func setAgentComposerDefaultsFromGenerated(
	result map[string]preferencesbiz.AgentComposerDefaults,
	provider string,
	value *nextopgenerated.DesktopAgentComposerDefaults,
) {
	if value == nil {
		return
	}
	result[provider] = preferencesbiz.AgentComposerDefaults{
		Model:            optionalStringValue(value.Model),
		PermissionModeID: optionalStringValue(value.PermissionModeId),
		ReasoningEffort:  optionalStringValue(value.ReasoningEffort),
	}
}
