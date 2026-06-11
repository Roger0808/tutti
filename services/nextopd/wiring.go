package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"time"

	agentdaemon "github.com/tutti-os/tutti/packages/agentactivity/daemon"
	workspaceissues "github.com/tutti-os/tutti/packages/workspace/issues"
	nextopapi "github.com/tutti-os/tutti/services/nextopd/api"
	workspacedata "github.com/tutti-os/tutti/services/nextopd/data/workspace"
	nextopserver "github.com/tutti-os/tutti/services/nextopd/server"
	agentservice "github.com/tutti-os/tutti/services/nextopd/service/agent"
	agentsidecarservice "github.com/tutti-os/tutti/services/nextopd/service/agentsidecar"
	agentstatusservice "github.com/tutti-os/tutti/services/nextopd/service/agentstatus"
	cliservice "github.com/tutti-os/tutti/services/nextopd/service/cli"
	appclicli "github.com/tutti-os/tutti/services/nextopd/service/cli/appcli"
	agentcontextcli "github.com/tutti-os/tutti/services/nextopd/service/cli/providers/agentcontext"
	diagnosticscli "github.com/tutti-os/tutti/services/nextopd/service/cli/providers/diagnostics"
	issuemanagercli "github.com/tutti-os/tutti/services/nextopd/service/cli/providers/issuemanager"
	eventstreamservice "github.com/tutti-os/tutti/services/nextopd/service/eventstream"
	managedcredentialsservice "github.com/tutti-os/tutti/services/nextopd/service/managedcredentials"
	preferencesservice "github.com/tutti-os/tutti/services/nextopd/service/preferences"
	reporterservice "github.com/tutti-os/tutti/services/nextopd/service/reporter"
	userprojectservice "github.com/tutti-os/tutti/services/nextopd/service/userproject"
	workspaceservice "github.com/tutti-os/tutti/services/nextopd/service/workspace"
	nextoptypes "github.com/tutti-os/tutti/services/nextopd/types"
)

type nextopWiring struct {
	api               nextopapi.DaemonAPI
	appCenterService  *workspaceservice.AppCenterService
	workspaceStore    *workspacedata.SQLiteStore
	analyticsReporter reporterservice.Reporter
}

type analyticsDebugEventPublisher struct {
	service analyticsDebugEventStream
}

type analyticsDebugEventStream interface {
	PublishFromServer(context.Context, string, []byte) error
}

type analyticsDebugReportedPayload struct {
	Events []analyticsDebugReportedEventPayload `json:"events"`
}

type analyticsDebugReportedEventPayload struct {
	Name     string         `json:"name"`
	ClientTS int64          `json:"clientTs"`
	Params   map[string]any `json:"params"`
}

func (p analyticsDebugEventPublisher) PublishAnalyticsDebugEvents(ctx context.Context, events []reporterservice.DebugEvent) {
	if p.service == nil || len(events) == 0 {
		return
	}
	payload := analyticsDebugReportedPayload{
		Events: make([]analyticsDebugReportedEventPayload, 0, len(events)),
	}
	for _, event := range events {
		payload.Events = append(payload.Events, analyticsDebugReportedEventPayload{
			Name:     event.Name,
			ClientTS: event.ClientTS,
			Params:   event.Params,
		})
	}
	encoded, err := json.Marshal(payload)
	if err != nil {
		return
	}
	_ = p.service.PublishFromServer(ctx, eventstreamservice.TopicAnalyticsDebugReported, encoded)
}

func newNextopWiring() (*nextopWiring, error) {
	wiring := &nextopWiring{}
	if err := wiring.buildWorkspaceModule(context.Background()); err != nil {
		_ = wiring.Close()
		return nil, err
	}

	return wiring, nil
}

func buildNextopServer() (*http.Server, net.Listener, *nextopWiring, error) {
	wiring, err := newNextopWiring()
	if err != nil {
		return nil, nil, nil, err
	}

	listenerSpec, err := nextopserver.ListenerSpecFromEnv()
	if err != nil {
		_ = wiring.Close()
		return nil, nil, nil, fmt.Errorf("resolve nextopd listener spec: %w", err)
	}
	listener, err := nextopserver.NewListener(listenerSpec)
	if err != nil {
		_ = wiring.Close()
		return nil, nil, nil, fmt.Errorf("create nextopd listener: %w", err)
	}

	if err := nextopserver.WriteListenerInfo(listener, listenerSpec); err != nil {
		_ = listener.Close()
		_ = wiring.Close()
		return nil, nil, nil, fmt.Errorf("write nextopd listener info: %w", err)
	}

	return nextopserver.NewHTTPServer(listenerSpec, wiring.routes()), listener, wiring, nil
}

func (w *nextopWiring) routes() nextopserver.Routes {
	return nextopapi.NewRoutes(w.api)
}

func (w *nextopWiring) buildWorkspaceModule(ctx context.Context) error {
	workspaceStore, err := openWorkspaceStore(ctx)
	if err != nil {
		return err
	}

	w.workspaceStore = workspaceStore
	api, appCenterService, err := buildDaemonAPI(ctx, workspaceStore, nil)
	if err != nil {
		return err
	}

	analyticsConfig := nextoptypes.ResolveAnalyticsConfig()
	var debugPublisher reporterservice.DebugPublisher
	if analyticsConfig.Debug {
		debugPublisher = analyticsDebugEventPublisher{
			service: api.EventStreamService,
		}
	}
	analyticsReporter, err := reporterservice.New(reporterservice.Config{
		Analytics:      analyticsConfig,
		DebugPublisher: debugPublisher,
		StateDir:       nextoptypes.DefaultStateDir(),
	})
	if err != nil {
		return fmt.Errorf("create analytics reporter: %w", err)
	}
	api.AnalyticsReporter = analyticsReporter
	w.analyticsReporter = analyticsReporter
	w.api = api
	w.appCenterService = appCenterService
	return nil
}

func openWorkspaceStore(ctx context.Context) (*workspacedata.SQLiteStore, error) {
	workspaceStore, err := workspacedata.OpenSQLiteStore(workspacedata.DefaultDBPath())
	if err != nil {
		return nil, fmt.Errorf("open workspace database: %w", err)
	}
	if err := workspaceStore.Migrate(ctx); err != nil {
		_ = workspaceStore.Close()
		return nil, fmt.Errorf("migrate workspace database: %w", err)
	}

	return workspaceStore, nil
}

func buildDaemonAPI(ctx context.Context, store workspacedata.CatalogStore, analyticsReporter reporterservice.Reporter) (nextopapi.DaemonAPI, *workspaceservice.AppCenterService, error) {
	workspaceStore, _ := store.(workspacedata.WorkbenchStore)
	issueStore, _ := store.(workspaceissues.Store)
	preferencesStore, _ := store.(workspacedata.PreferencesStore)
	managedCredentialsStore, _ := store.(workspacedata.ManagedCredentialsStore)
	agentActivityRepo, _ := store.(workspacedata.AgentActivityStore)
	userProjectStore, _ := store.(workspacedata.UserProjectStore)
	appStore, _ := store.(workspacedata.AppStore)
	appFactoryStore, _ := store.(workspacedata.AppFactoryStore)
	fileAdapter := workspacedata.LocalFilesAdapter{}

	events := eventstreamservice.NewService(eventstreamservice.DefaultCatalog(), nil)
	preferences := preferencesservice.Service{
		Store:     preferencesStore,
		Publisher: eventstreamservice.DesktopPreferencesPublisher{Service: events},
	}
	managedCredentials := &managedcredentialsservice.Service{
		Store: managedCredentialsStore,
	}
	events.RegisterIntentHandler(
		eventstreamservice.TopicPreferencesDesktopUpdateRequested,
		eventstreamservice.NewPreferencesDesktopUpdateRequestedHandler(preferences),
	)
	agentActivityProjection := agentservice.NewActivityProjection(agentActivityRepo)
	agentActivityProjection.SetPublisher(eventstreamservice.AgentActivityPublisher{Service: events})
	agentStatusService := agentstatusservice.Service{}
	agentRuntime, err := agentdaemon.NewRuntime(agentdaemon.Config{
		Reporter:         agentActivityProjection,
		ProcessTransport: agentdaemon.NewLocalProcessTransport(),
		HostMetadata: agentdaemon.HostMetadata{
			ClientInfo: agentdaemon.ClientInfo{
				Name:    "nextop-desktop",
				Title:   "Nextop",
				Version: "0.1.0",
			},
			WorkspaceEnvName:         "NEXTOP_WORKSPACE_ID",
			OpenClawSessionKeyPrefix: "agent:main:tsh-",
		},
	})
	if err != nil {
		return nextopapi.DaemonAPI{}, nil, fmt.Errorf("create agent runtime: %w", err)
	}
	agentSidecarPreparer := agentsidecarservice.NewDefaultPreparer(nextoptypes.DefaultStateDir())
	agentSessionService := agentservice.NewService(
		newAgentRuntimeAdapter(agentRuntime.Controller()),
	)
	agentSessionService.ModelCatalog = agentservice.NewAgentModelCatalog()
	agentSessionService.SessionReader = agentActivityProjection
	agentSessionService.MessageReader = agentActivityProjection
	agentSessionService.SessionDirectoryAllocator = agentservice.LocalSessionDirectoryAllocator{
		StateDir: nextoptypes.DefaultStateDir(),
	}
	agentSessionService.PromptAttachmentStore = agentservice.PromptAttachmentStore{
		RootDir: nextoptypes.DefaultStateDir(),
	}
	agentSessionService.RuntimePreparer = agentSidecarPreparer
	agentSessionService.AvailabilityChecker = agentservice.AgentStatusProviderAvailabilityChecker{
		Service: agentStatusService,
	}

	workspaceService := workspaceservice.CatalogService{
		Store:            store,
		PreferencesStore: preferencesStore,
	}
	issueService := workspaceservice.IssueManagerService{
		AgentSessionReader: agentActivityProjection,
		Publisher:          eventstreamservice.WorkspaceIssuePublisher{Service: events},
		Store:              issueStore,
	}
	issueService.RunReconcileQueue = workspaceservice.NewIssueRunReconcileQueue(workspaceservice.IssueRunReconcileQueueOptions{
		Delay:     3 * time.Second,
		Interval:  15 * time.Second,
		Reconcile: issueService.ReconcileRunningRuns,
	})
	appCenterService := &workspaceservice.AppCenterService{
		Store:                 appStore,
		AppFactoryStore:       appFactoryStore,
		WorkspaceRootResolver: workspaceservice.FileService{Adapter: fileAdapter},
		WorkspaceStore:        store,
		Runner:                &workspaceservice.AppRunner{},
		StateDir:              nextoptypes.DefaultStateDir(),
		Publisher:             eventstreamservice.WorkspaceAppPublisher{Service: events},
	}
	appCLIRegistry := appclicli.NewRegistry(workspaceService, appCenterService)
	appCenterService.AppCLIRegistry = appCLIRegistry
	if err := appCenterService.InitBuiltinPackages(ctx); err != nil {
		return nextopapi.DaemonAPI{}, nil, fmt.Errorf("initialize builtin workspace apps: %w", err)
	}
	appFactoryService := &workspaceservice.AppFactoryService{
		Store:                 appFactoryStore,
		AppStore:              appStore,
		WorkspaceStore:        store,
		WorkspaceRootResolver: workspaceservice.FileService{Adapter: fileAdapter},
		AppCenter:             appCenterService,
		AgentSessionService:   agentSessionService,
		AgentMessageReader:    agentActivityProjection,
		AgentSessionReader:    agentActivityProjection,
		AgentSessionState:     agentActivityProjection,
		Runner:                &workspaceservice.AppRunner{},
		StateDir:              nextoptypes.DefaultStateDir(),
		Publisher:             eventstreamservice.WorkspaceAppFactoryPublisher{Service: events},
	}
	agentActivityProjection.SetSessionMessageObserver(appFactoryService)
	agentActivityProjection.SetSessionStateObserver(appFactoryService)
	if _, err := appFactoryService.ReconcileInterruptedJobs(ctx); err != nil {
		return nextopapi.DaemonAPI{}, nil, fmt.Errorf("reconcile interrupted app factory jobs: %w", err)
	}
	if workspaces, err := workspaceService.List(ctx); err == nil {
		for _, workspace := range workspaces {
			issueService.RunReconcileQueue.Enqueue(workspace.ID)
		}
	}
	cliRegistry, err := cliservice.NewRegistryFromProviders(
		diagnosticscli.NewProvider(),
		issuemanagercli.NewProvider(workspaceService, issueService),
		agentcontextcli.NewProviderWithLaunchPublisher(
			workspaceService,
			agentSessionService,
			eventstreamservice.AgentGUILaunchPublisher{Service: events},
			preferences,
		),
	)
	if err != nil {
		return nextopapi.DaemonAPI{}, nil, fmt.Errorf("create cli registry: %w", err)
	}
	cliRegistry.AppCommands = appCLIRegistry
	agentSidecarPreparer.CommandCatalog = cliRegistry

	terminalService := &workspaceservice.TerminalService{}

	return nextopapi.DaemonAPI{
		UserProjectService: userprojectservice.Service{
			Store: userProjectStore,
		},
		PreferencesService:        preferences,
		ManagedCredentialsService: managedCredentials,
		EventStreamService:        events,
		WorkspaceService:          workspaceService,
		WorkbenchService: workspaceservice.WorkbenchService{
			Store: workspaceStore,
			SnapshotReconciler: workspaceservice.TerminalWorkbenchSnapshotReconciler{
				TerminalService: terminalService,
			},
		},
		AppCenterService:  appCenterService,
		AppFactoryService: appFactoryService,
		FileService: workspaceservice.FileService{
			Adapter: fileAdapter,
		},
		AgentSessionService: agentSessionService,
		AgentStatusService:  agentStatusService,
		TerminalService:     terminalService,
		IssueService:        issueService,
		CLIRegistry:         cliRegistry,
		AnalyticsReporter:   analyticsReporter,
	}, appCenterService, nil
}

func (w *nextopWiring) Close() error {
	if w == nil {
		return nil
	}

	if w.appCenterService != nil && w.appCenterService.Runner != nil {
		w.appCenterService.Runner.StopAll(context.Background())
	}
	var closeErr error
	if w.analyticsReporter != nil {
		if err := w.analyticsReporter.Close(); err != nil {
			closeErr = err
		}
	}
	if w.workspaceStore == nil {
		return closeErr
	}
	if err := w.workspaceStore.Close(); err != nil && closeErr == nil {
		closeErr = err
	}
	return closeErr
}
