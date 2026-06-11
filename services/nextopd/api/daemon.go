package api

import (
	"context"
	"net/http"
	"strings"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	preferencesapi "github.com/tutti-os/tutti/services/nextopd/api/preferences"
	workspaceapi "github.com/tutti-os/tutti/services/nextopd/api/workspace"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
	agentstatusservice "github.com/tutti-os/tutti/services/nextopd/service/agentstatus"
	cliservice "github.com/tutti-os/tutti/services/nextopd/service/cli"
	eventstreamservice "github.com/tutti-os/tutti/services/nextopd/service/eventstream"
	managedcredentialsservice "github.com/tutti-os/tutti/services/nextopd/service/managedcredentials"
	reporterservice "github.com/tutti-os/tutti/services/nextopd/service/reporter"
	nextoptypes "github.com/tutti-os/tutti/services/nextopd/types"
)

type EventStreamService interface {
	OpenSession() *eventstreamservice.Session
	CloseSession(*eventstreamservice.Session)
	Events(*eventstreamservice.Session) <-chan eventstreamservice.PublishedEvent
	Subscribe(*eventstreamservice.Session, []string, eventstreamservice.EventScope) error
	Unsubscribe(*eventstreamservice.Session, []string, eventstreamservice.EventScope) error
	PublishFromClient(context.Context, eventstreamservice.ClientEvent) error
	PublishFromServer(context.Context, string, []byte) error
}

type DaemonAPI struct {
	UserProjectService        UserProjectService
	PreferencesService        preferencesapi.Service
	ManagedCredentialsService *managedcredentialsservice.Service
	EventStreamService        EventStreamService
	WorkspaceService          workspaceapi.CatalogService
	WorkbenchService          workspaceapi.WorkbenchService
	AppCenterService          workspaceapi.AppCenterService
	AppFactoryService         AppFactoryService
	FileService               workspaceapi.FileService
	AgentSessionService       AgentSessionService
	AgentStatusService        AgentProviderStatusService
	TerminalService           workspaceapi.TerminalService
	IssueService              workspaceapi.IssueManagerService
	CLIRegistry               *cliservice.Registry
	AnalyticsReporter         reporterservice.Reporter
}

type AgentProviderStatusService interface {
	List(context.Context, agentstatusservice.ListInput) (agentstatusservice.Snapshot, error)
	Probe(context.Context, agentstatusservice.ProbeInput) (agentstatusservice.ProbeResult, error)
	RunAction(context.Context, agentstatusservice.RunActionInput) (agentstatusservice.RunActionResult, error)
}

var _ nextopgenerated.StrictServerInterface = (*DaemonAPI)(nil)

type daemonRoutes struct {
	nextopgenerated.ServerInterface
	api DaemonAPI
}

func NewRoutes(api DaemonAPI) Routes {
	return daemonRoutes{
		ServerInterface: nextopgenerated.NewStrictHandlerWithOptions(api, nil, strictServerOptions()),
		api:             api,
	}
}

func strictServerOptions() nextopgenerated.StrictHTTPServerOptions {
	return nextopgenerated.StrictHTTPServerOptions{
		RequestErrorHandlerFunc: requestServerErrorHandler,
		ResponseErrorHandlerFunc: func(w http.ResponseWriter, _ *http.Request, err error) {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		},
	}
}

func requestServerErrorHandler(w http.ResponseWriter, _ *http.Request, err error) {
	protocolErr := apierrors.MalformedRequest(apierrors.WithCause(err))
	if strings.Contains(strings.TrimSpace(err.Error()), "EOF") {
		protocolErr = apierrors.EmptyBody(apierrors.WithDeveloperMessage("empty body"))
	}
	nextoptypes.WriteError(
		w,
		http.StatusBadRequest,
		string(protocolErr.Code),
		protocolErr.Reason,
		protocolErr.DeveloperMessage,
	)
}

func (DaemonAPI) GetHealth(_ context.Context, _ nextopgenerated.GetHealthRequestObject) (nextopgenerated.GetHealthResponseObject, error) {
	return nextopgenerated.GetHealth200JSONResponse{
		Service: "nextopd",
		Status:  nextopgenerated.Ok,
	}, nil
}
