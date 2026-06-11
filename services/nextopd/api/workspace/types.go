package workspace

import (
	"time"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	workspacebiz "github.com/tutti-os/tutti/services/nextopd/biz/workspace"
)

func GeneratedSummaryFromBiz(value workspacebiz.Summary) nextopgenerated.WorkspaceSummary {
	var lastOpenedAt *time.Time
	if value.LastOpenedAt != nil {
		formatted := value.LastOpenedAt.UTC()
		lastOpenedAt = &formatted
	}

	return nextopgenerated.WorkspaceSummary{
		Id:           value.ID,
		LastOpenedAt: lastOpenedAt,
		Name:         value.Name,
	}
}

func GeneratedSummariesFromBiz(items []workspacebiz.Summary) []nextopgenerated.WorkspaceSummary {
	if len(items) == 0 {
		return []nextopgenerated.WorkspaceSummary{}
	}

	result := make([]nextopgenerated.WorkspaceSummary, 0, len(items))
	for _, item := range items {
		result = append(result, GeneratedSummaryFromBiz(item))
	}

	return result
}

func GeneratedStartupResponseFromBiz(item *workspacebiz.Summary) nextopgenerated.StartupWorkspaceResponse {
	if item == nil {
		return nextopgenerated.StartupWorkspaceResponse{Workspace: nil}
	}

	summary := GeneratedSummaryFromBiz(*item)
	return nextopgenerated.StartupWorkspaceResponse{Workspace: &summary}
}

func GeneratedEnvelopeResponseFromBiz(item workspacebiz.Summary) nextopgenerated.WorkspaceResponse {
	return nextopgenerated.WorkspaceResponse{
		Workspace: GeneratedSummaryFromBiz(item),
	}
}
