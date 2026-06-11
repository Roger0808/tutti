package workspace

import (
	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	workspacebiz "github.com/tutti-os/tutti/services/nextopd/biz/workspace"
)

func GeneratedAppFromBiz(app workspacebiz.WorkspaceApp) nextopgenerated.WorkspaceApp {
	return nextopgenerated.WorkspaceApp{
		AppId:            app.Package.AppID,
		DisplayName:      app.Package.DisplayName(),
		Version:          app.Package.Version,
		Description:      app.Package.Description(),
		CreatedAtUnixMs:  app.Package.CreatedAtUnixMs,
		IconUrl:          app.ResolvedIconURL(),
		AvailableVersion: app.AvailableVersion,
		AvailableIconUrl: app.AvailableIconURL,
		UpdateAvailable:  app.UpdateAvailable,
		Installed:        app.Installation != nil,
		Enabled:          app.Installation != nil && app.Installation.Enabled,
		Status:           generatedAppRuntimeStatus(app.Runtime.Status),
		StateRevision:    app.StateRevision,
		LaunchUrl:        app.Runtime.LaunchURL,
		Port:             app.Runtime.Port,
		FailureReason:    app.Runtime.FailureReason,
		LastError:        app.Runtime.LastError,
		StartedAtUnixMs:  app.Runtime.StartedAtUnixMs,
		UpdatedAtUnixMs:  app.Runtime.UpdatedAtUnixMs,
		Source:           generatedAppSource(app.Package.Source),
		Exportable:       app.Package.Source == workspacebiz.AppPackageSourceGenerated || app.Package.Source == workspacebiz.AppPackageSourceImported,
		Tags:             nonNilStrings(app.Package.Manifest.Tags),
		Localizations:    GeneratedAppLocalizationsFromBiz(app.Package.Localizations()),
		MinimizeBehavior: nextopgenerated.WorkspaceAppMinimizeBehavior(app.Package.MinimizeBehavior()),
		WindowMinWidth:   app.Package.WindowMinWidth(),
		WindowMinHeight:  app.Package.WindowMinHeight(),
		Cli:              generatedAppCLIState(app.CLI),
	}
}

func GeneratedAppsFromBiz(apps []workspacebiz.WorkspaceApp) []nextopgenerated.WorkspaceApp {
	result := make([]nextopgenerated.WorkspaceApp, 0, len(apps))
	for _, app := range apps {
		result = append(result, GeneratedAppFromBiz(app))
	}
	return result
}

func GeneratedAppLocalizationsFromBiz(localizations []workspacebiz.AppManifestLocalization) []nextopgenerated.WorkspaceAppLocalization {
	result := make([]nextopgenerated.WorkspaceAppLocalization, 0, len(localizations))
	for _, localization := range localizations {
		result = append(result, nextopgenerated.WorkspaceAppLocalization{
			Locale:      localization.Locale,
			DisplayName: nullableString(localization.Name),
			Description: nullableString(localization.Description),
			Tags:        nonNilStrings(localization.Tags),
		})
	}
	return result
}

func GeneratedAppCatalogLoadStateFromBiz(state workspacebiz.AppCatalogLoadState) nextopgenerated.WorkspaceAppCatalogLoadState {
	return nextopgenerated.WorkspaceAppCatalogLoadState{
		Status:          generatedAppCatalogLoadStatus(state.Status),
		LastError:       state.LastError,
		UpdatedAtUnixMs: state.UpdatedAtUnixMs,
	}
}

func nullableString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func nonNilStrings(values []string) []string {
	if values == nil {
		return []string{}
	}
	return values
}

func generatedAppSource(source workspacebiz.AppPackageSource) nextopgenerated.WorkspaceAppSource {
	switch source {
	case workspacebiz.AppPackageSourceGenerated:
		return nextopgenerated.WorkspaceAppSourceGenerated
	case workspacebiz.AppPackageSourceImported:
		return nextopgenerated.WorkspaceAppSourceImported
	default:
		return nextopgenerated.WorkspaceAppSourceBuiltin
	}
}

func generatedAppCatalogLoadStatus(status workspacebiz.AppCatalogLoadStatus) nextopgenerated.WorkspaceAppCatalogLoadStatus {
	switch status {
	case workspacebiz.AppCatalogLoadStatusLoading:
		return nextopgenerated.WorkspaceAppCatalogLoadStatusLoading
	case workspacebiz.AppCatalogLoadStatusReady:
		return nextopgenerated.WorkspaceAppCatalogLoadStatusReady
	case workspacebiz.AppCatalogLoadStatusFailed:
		return nextopgenerated.WorkspaceAppCatalogLoadStatusFailed
	default:
		return nextopgenerated.WorkspaceAppCatalogLoadStatusDisabled
	}
}

func generatedAppRuntimeStatus(status workspacebiz.AppRuntimeStatus) nextopgenerated.WorkspaceAppRuntimeStatus {
	switch status {
	case workspacebiz.AppRuntimeStatusRunning:
		return nextopgenerated.WorkspaceAppRuntimeStatusRunning
	case workspacebiz.AppRuntimeStatusPreparing:
		return nextopgenerated.WorkspaceAppRuntimeStatusPreparing
	case workspacebiz.AppRuntimeStatusStarting:
		return nextopgenerated.WorkspaceAppRuntimeStatusStarting
	case workspacebiz.AppRuntimeStatusFailed:
		return nextopgenerated.WorkspaceAppRuntimeStatusFailed
	case workspacebiz.AppRuntimeStatusStopping:
		return nextopgenerated.WorkspaceAppRuntimeStatusStopping
	default:
		return nextopgenerated.WorkspaceAppRuntimeStatusIdle
	}
}

func generatedAppCLIState(state workspacebiz.AppCLIState) nextopgenerated.WorkspaceAppCliState {
	return nextopgenerated.WorkspaceAppCliState{
		Status: generatedAppCLIStatus(state.Status),
		Scope:  nullableString(state.Scope),
		Active: state.Active,
		Issues: generatedAppCLIIssues(state.Issues),
	}
}

func generatedAppCLIIssues(issues []workspacebiz.AppCLIIssue) []nextopgenerated.WorkspaceAppCliIssue {
	result := make([]nextopgenerated.WorkspaceAppCliIssue, 0, len(issues))
	for _, issue := range issues {
		result = append(result, nextopgenerated.WorkspaceAppCliIssue{
			Code:    issue.Code,
			Message: issue.Message,
			Path:    nullableString(issue.Path),
		})
	}
	return result
}

func generatedAppCLIStatus(status workspacebiz.AppCLIStatus) nextopgenerated.WorkspaceAppCliStatus {
	switch status {
	case workspacebiz.AppCLIStatusPending:
		return nextopgenerated.Pending
	case workspacebiz.AppCLIStatusActive:
		return nextopgenerated.Active
	case workspacebiz.AppCLIStatusWarning:
		return nextopgenerated.Warning
	case workspacebiz.AppCLIStatusError:
		return nextopgenerated.Error
	default:
		return nextopgenerated.None
	}
}
