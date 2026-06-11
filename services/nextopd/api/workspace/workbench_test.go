package workspace

import (
	"testing"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	workspaceservice "github.com/tutti-os/tutti/services/nextopd/service/workspace"
)

func TestWorkbenchSnapshotFromGeneratedPreservesCanonicalFields(t *testing.T) {
	t.Parallel()

	displayMode := nextopgenerated.WorkbenchSnapshotNodeDisplayMode("fullscreen")
	isMinimized := true
	activeNodeID := "workspace-files"
	activeSpaceID := "space-1"
	nodeStack := []string{"workspace-files"}
	metadata := map[string]interface{}{
		"initialized": true,
	}
	adapterState := map[string]interface{}{
		"reactFlow": map[string]interface{}{
			"type": "workspaceFilesNode",
		},
	}
	spaces := []nextopgenerated.WorkbenchSnapshotSpace{
		{
			Id:      "space-1",
			Name:    "Primary",
			NodeIds: []string{"workspace-files"},
			Frame: &nextopgenerated.WorkbenchFrame{
				X:      40,
				Y:      48,
				Width:  640,
				Height: 480,
			},
			Data: map[string]interface{}{
				"layout": "single",
			},
		},
	}

	snapshot := WorkbenchSnapshotFromGenerated(nextopgenerated.WorkbenchSnapshot{
		SchemaVersion: 1,
		Nodes: []nextopgenerated.WorkbenchSnapshotNode{
			{
				Id:    "workspace-files",
				Kind:  "workspaceFiles",
				Title: "Files",
				Frame: nextopgenerated.WorkbenchFrame{
					X:      12,
					Y:      18,
					Width:  400,
					Height: 320,
				},
				DisplayMode:  &displayMode,
				RestoreFrame: &nextopgenerated.WorkbenchFrame{X: 24, Y: 30, Width: 420, Height: 340},
				IsMinimized:  &isMinimized,
				Data:         map[string]interface{}{"workspaceID": "workspace-1"},
				AdapterState: &adapterState,
			},
		},
		NodeStack:     &nodeStack,
		ActiveNodeId:  &activeNodeID,
		Spaces:        &spaces,
		ActiveSpaceId: &activeSpaceID,
		Metadata:      &metadata,
	})

	if snapshot.SchemaVersion != 1 {
		t.Fatalf("SchemaVersion = %d, want 1", snapshot.SchemaVersion)
	}
	if snapshot.ActiveNodeID == nil || *snapshot.ActiveNodeID != "workspace-files" {
		t.Fatalf("ActiveNodeID = %#v, want workspace-files", snapshot.ActiveNodeID)
	}
	if snapshot.ActiveSpaceID == nil || *snapshot.ActiveSpaceID != "space-1" {
		t.Fatalf("ActiveSpaceID = %#v, want space-1", snapshot.ActiveSpaceID)
	}
	if snapshot.NodeStack == nil || len(*snapshot.NodeStack) != 1 || (*snapshot.NodeStack)[0] != "workspace-files" {
		t.Fatalf("NodeStack = %#v, want workspace-files", snapshot.NodeStack)
	}
	if snapshot.Metadata["initialized"] != true {
		t.Fatalf("Metadata = %#v, want initialized=true", snapshot.Metadata)
	}
	if len(snapshot.Nodes) != 1 {
		t.Fatalf("nodes len = %d, want 1", len(snapshot.Nodes))
	}
	if snapshot.Nodes[0].DisplayMode == nil || *snapshot.Nodes[0].DisplayMode != workspaceservice.WorkbenchSnapshotDisplayModeFullscreen {
		t.Fatalf("DisplayMode = %#v, want fullscreen", snapshot.Nodes[0].DisplayMode)
	}
	if snapshot.Nodes[0].RestoreFrame == nil || snapshot.Nodes[0].RestoreFrame.Width != 420 {
		t.Fatalf("RestoreFrame = %#v, want width 420", snapshot.Nodes[0].RestoreFrame)
	}
	if snapshot.Nodes[0].AdapterState["reactFlow"] == nil {
		t.Fatalf("AdapterState = %#v, want reactFlow", snapshot.Nodes[0].AdapterState)
	}
	if snapshot.Spaces == nil || len(*snapshot.Spaces) != 1 {
		t.Fatalf("Spaces = %#v, want 1 space", snapshot.Spaces)
	}
	if (*snapshot.Spaces)[0].Frame == nil || (*snapshot.Spaces)[0].Frame.Width != 640 {
		t.Fatalf("Space frame = %#v, want width 640", (*snapshot.Spaces)[0].Frame)
	}
}
