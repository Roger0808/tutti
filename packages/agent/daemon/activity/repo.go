package agentsessionstore

import "context"

type Repository interface {
	ReadRepository
	ReportSessionState(ctx context.Context, input ReportSessionStateInput) (ReportSessionStateReply, error)
	ReportSessionMessages(ctx context.Context, input ReportSessionMessagesInput) (ReportSessionMessagesReply, error)
}

type ReadRepository interface {
	ListAgents(ctx context.Context, roomID string) (*WorkspaceAgentSnapshot, error)
	ListSessionMessages(ctx context.Context, input ListSessionMessagesInput) (*ListSessionMessagesReply, error)
}

type SyncStateStore interface {
	LoadRoomSyncStates(ctx context.Context, roomID string) (map[string]WorkspaceAgentSyncState, error)
	SaveAgentSyncState(ctx context.Context, roomID string, state WorkspaceAgentSyncState) error
	DeleteAgentSyncState(ctx context.Context, roomID string, agentSessionID string) error
}
