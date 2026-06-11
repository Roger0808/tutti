package managedcredentials

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strings"
	"sync"
	"time"

	managedcredentialsbiz "github.com/tutti-os/tutti/services/nextopd/biz/managedcredentials"
	workspacedata "github.com/tutti-os/tutti/services/nextopd/data/workspace"
)

const GrantCodeTTL = 5 * time.Hour

var (
	ErrInvalidProvider       = errors.New("invalid managed credential provider")
	ErrGrantCodeInvalid      = errors.New("managed credential grant code is invalid")
	ErrGrantExpired          = errors.New("managed credential grant is expired")
	ErrGrantRevoked          = errors.New("managed credential grant is revoked")
	ErrProviderNotConfigured = errors.New("managed credential provider is not configured")
)

type Service struct {
	Store workspacedata.ManagedCredentialsStore
	Now   func() time.Time

	mu         sync.Mutex
	grantCodes map[string]grantCodeState
}

type grantCodeState struct {
	ContextToken string
	WorkspaceID  string
	AppID        string
	GrantRef     string
	Nonce        string
	State        string
	ExpiresAt    time.Time
	Used         bool
}

type PutProviderInput struct {
	WorkspaceID string
	Provider    string
	Enabled     bool
	APIKey      *string
	BaseURL     string
	Models      []managedcredentialsbiz.Model
}

type CreateGrantInput struct {
	ContextToken string
	WorkspaceID  string
	AppID        string
	Nonce        string
	ProviderIDs  []string
	Scopes       []string
	State        string
}

type GrantResult struct {
	GrantCode string
	Grant     managedcredentialsbiz.Grant
	Models    []managedcredentialsbiz.Model
}

type ExchangeInput struct {
	ContextToken string
	WorkspaceID  string
	AppID        string
	GrantCode    string
	Nonce        string
	State        string
}

type ExchangeResult struct {
	ExpiresAt time.Time
	GrantRef  string
	Providers []managedcredentialsbiz.ProviderID
	Models    []managedcredentialsbiz.Model
}

type CredentialInput struct {
	WorkspaceID string
	AppID       string
	GrantRef    string
	Provider    string
	Model       string
	Capability  string
}

type CredentialResult struct {
	ExpiresAt   time.Time
	Credential  managedcredentialsbiz.ProviderCredential
	GrantModels []managedcredentialsbiz.Model
}

type ModelCatalogResult struct {
	ExpiresAt time.Time
	Models    []managedcredentialsbiz.Model
}

func (s *Service) ListProviders(ctx context.Context, workspaceID string) ([]managedcredentialsbiz.PublicProviderConfig, error) {
	configs, err := s.Store.ListManagedModelProviderConfigs(ctx, strings.TrimSpace(workspaceID))
	if err != nil {
		return nil, err
	}
	public := make([]managedcredentialsbiz.PublicProviderConfig, 0, len(configs))
	for _, config := range configs {
		public = append(public, managedcredentialsbiz.PublicProvider(config))
	}
	return public, nil
}

func (s *Service) PutProvider(ctx context.Context, input PutProviderInput) (managedcredentialsbiz.PublicProviderConfig, error) {
	provider, err := normalizeProvider(input.Provider)
	if err != nil {
		return managedcredentialsbiz.PublicProviderConfig{}, err
	}
	apiKey := ""
	if input.APIKey != nil {
		apiKey = strings.TrimSpace(*input.APIKey)
	} else {
		if existing, err := s.Store.GetManagedModelProviderConfig(ctx, strings.TrimSpace(input.WorkspaceID), provider); err == nil {
			apiKey = existing.APIKey
		}
	}
	config := managedcredentialsbiz.ProviderConfig{
		WorkspaceID: strings.TrimSpace(input.WorkspaceID),
		Provider:    provider,
		Enabled:     input.Enabled,
		APIKey:      apiKey,
		BaseURL:     strings.TrimSpace(input.BaseURL),
		Models:      normalizeModels(provider, input.Models),
		UpdatedAt:   s.now(),
	}
	if err := s.Store.PutManagedModelProviderConfig(ctx, config); err != nil {
		return managedcredentialsbiz.PublicProviderConfig{}, err
	}
	config, err = s.Store.GetManagedModelProviderConfig(ctx, config.WorkspaceID, config.Provider)
	if err != nil {
		return managedcredentialsbiz.PublicProviderConfig{}, err
	}
	return managedcredentialsbiz.PublicProvider(config), nil
}

func (s *Service) DeleteProvider(ctx context.Context, workspaceID string, providerID string) error {
	provider, err := normalizeProvider(providerID)
	if err != nil {
		return err
	}
	return s.Store.DeleteManagedModelProviderConfig(ctx, strings.TrimSpace(workspaceID), provider)
}

func (s *Service) TestProvider(ctx context.Context, workspaceID string, providerID string) error {
	provider, err := normalizeProvider(providerID)
	if err != nil {
		return err
	}
	config, err := s.Store.GetManagedModelProviderConfig(ctx, strings.TrimSpace(workspaceID), provider)
	if err != nil {
		return err
	}
	if !config.Enabled || config.APIKey == "" {
		return ErrProviderNotConfigured
	}
	return nil
}

func (s *Service) CreateGrant(ctx context.Context, input CreateGrantInput) (GrantResult, error) {
	workspaceID := strings.TrimSpace(input.WorkspaceID)
	appID := strings.TrimSpace(input.AppID)
	if strings.TrimSpace(input.State) == "" ||
		strings.TrimSpace(input.Nonce) == "" ||
		strings.TrimSpace(input.ContextToken) == "" {
		return GrantResult{}, ErrGrantCodeInvalid
	}
	providers, err := normalizeProviders(input.ProviderIDs)
	if err != nil {
		return GrantResult{}, err
	}
	if len(providers) == 0 {
		configs, err := s.Store.ListManagedModelProviderConfigs(ctx, workspaceID)
		if err != nil {
			return GrantResult{}, err
		}
		for _, config := range configs {
			if config.Enabled && config.APIKey != "" {
				providers = append(providers, config.Provider)
			}
		}
	}
	now := s.now()
	grantRef := randomToken()
	grant := managedcredentialsbiz.Grant{
		WorkspaceID: workspaceID,
		AppID:       appID,
		GrantRef:    grantRef,
		ProviderIDs: providers,
		Scopes:      normalizeScopes(input.Scopes),
		CreatedAt:   now,
		ExpiresAt:   now.Add(GrantCodeTTL),
	}
	if err := s.Store.PutManagedModelGrant(ctx, grant); err != nil {
		return GrantResult{}, err
	}
	code := randomToken()
	s.mu.Lock()
	s.ensure()
	s.grantCodes[code] = grantCodeState{
		ContextToken: strings.TrimSpace(input.ContextToken),
		WorkspaceID:  workspaceID,
		AppID:        appID,
		GrantRef:     grantRef,
		Nonce:        strings.TrimSpace(input.Nonce),
		State:        strings.TrimSpace(input.State),
		ExpiresAt:    grant.ExpiresAt,
	}
	s.mu.Unlock()
	return GrantResult{
		GrantCode: code,
		Grant:     grant,
		Models:    s.modelsForProviders(ctx, workspaceID, providers),
	}, nil
}

func (s *Service) Exchange(ctx context.Context, input ExchangeInput) (ExchangeResult, error) {
	workspaceID := strings.TrimSpace(input.WorkspaceID)
	appID := strings.TrimSpace(input.AppID)
	code := strings.TrimSpace(input.GrantCode)
	if code == "" {
		return ExchangeResult{}, ErrGrantCodeInvalid
	}
	state, err := s.consumeGrantCode(code, grantCodeState{
		ContextToken: strings.TrimSpace(input.ContextToken),
		WorkspaceID:  workspaceID,
		AppID:        appID,
		Nonce:        strings.TrimSpace(input.Nonce),
		State:        strings.TrimSpace(input.State),
	}, s.now())
	if err != nil {
		return ExchangeResult{}, err
	}
	grant, err := s.readActiveGrant(ctx, workspaceID, appID, state.GrantRef)
	if err != nil {
		return ExchangeResult{}, err
	}
	return ExchangeResult{
		ExpiresAt: s.now().Add(GrantCodeTTL),
		GrantRef:  grant.GrantRef,
		Providers: append([]managedcredentialsbiz.ProviderID(nil), grant.ProviderIDs...),
		Models:    s.modelsForProviders(ctx, workspaceID, grant.ProviderIDs),
	}, nil
}

func (s *Service) ListGrantModels(ctx context.Context, workspaceID string, appID string, grantRef string) (ModelCatalogResult, error) {
	grant, err := s.readActiveGrant(ctx, strings.TrimSpace(workspaceID), strings.TrimSpace(appID), strings.TrimSpace(grantRef))
	if err != nil {
		return ModelCatalogResult{}, err
	}
	return ModelCatalogResult{
		ExpiresAt: s.now().Add(GrantCodeTTL),
		Models:    s.modelsForProviders(ctx, grant.WorkspaceID, grant.ProviderIDs),
	}, nil
}

func (s *Service) Credential(ctx context.Context, input CredentialInput) (CredentialResult, error) {
	workspaceID := strings.TrimSpace(input.WorkspaceID)
	appID := strings.TrimSpace(input.AppID)
	grantRef := strings.TrimSpace(input.GrantRef)
	grant, err := s.readActiveGrant(ctx, workspaceID, appID, grantRef)
	if err != nil {
		return CredentialResult{}, err
	}
	provider, err := normalizeProvider(input.Provider)
	if err != nil {
		return CredentialResult{}, err
	}
	allowed := false
	for _, grantProvider := range grant.ProviderIDs {
		if grantProvider == provider {
			allowed = true
			break
		}
	}
	if !allowed {
		return CredentialResult{}, ErrProviderNotConfigured
	}
	config, err := s.Store.GetManagedModelProviderConfig(ctx, workspaceID, provider)
	if err != nil {
		return CredentialResult{}, err
	}
	if !config.Enabled || config.APIKey == "" {
		return CredentialResult{}, ErrProviderNotConfigured
	}
	model := strings.TrimSpace(input.Model)
	if model != "" && !modelsContain(config.Models, model) {
		return CredentialResult{}, ErrProviderNotConfigured
	}
	return CredentialResult{
		ExpiresAt: s.now().Add(GrantCodeTTL),
		Credential: managedcredentialsbiz.ProviderCredential{
			Provider: config.Provider,
			APIKey:   config.APIKey,
			BaseURL:  config.BaseURL,
			Models:   config.Models,
		},
		GrantModels: config.Models,
	}, nil
}

func (s *Service) readActiveGrant(ctx context.Context, workspaceID string, appID string, grantRef string) (managedcredentialsbiz.Grant, error) {
	grant, err := s.Store.GetManagedModelGrant(ctx, workspaceID, appID, grantRef)
	if err != nil {
		return managedcredentialsbiz.Grant{}, err
	}
	if grant.RevokedAt != nil {
		return managedcredentialsbiz.Grant{}, ErrGrantRevoked
	}
	return grant, nil
}

func (s *Service) Revoke(ctx context.Context, workspaceID string, appID string, grantRef string) error {
	return s.Store.RevokeManagedModelGrant(ctx, strings.TrimSpace(workspaceID), strings.TrimSpace(appID), strings.TrimSpace(grantRef))
}

func (s *Service) now() time.Time {
	if s.Now != nil {
		return s.Now().UTC()
	}
	return time.Now().UTC()
}

func (s *Service) ensure() {
	if s.grantCodes == nil {
		s.grantCodes = map[string]grantCodeState{}
	}
}

func (s *Service) consumeGrantCode(code string, expected grantCodeState, now time.Time) (grantCodeState, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.ensure()
	state, ok := s.grantCodes[code]
	if !ok ||
		state.Used ||
		state.WorkspaceID != expected.WorkspaceID ||
		state.AppID != expected.AppID ||
		state.State != expected.State ||
		state.Nonce != expected.Nonce ||
		state.ContextToken != expected.ContextToken {
		return grantCodeState{}, ErrGrantCodeInvalid
	}
	if !state.ExpiresAt.After(now) {
		delete(s.grantCodes, code)
		return grantCodeState{}, ErrGrantCodeInvalid
	}
	state.Used = true
	s.grantCodes[code] = state
	return state, nil
}

func (s *Service) modelsForProviders(ctx context.Context, workspaceID string, providers []managedcredentialsbiz.ProviderID) []managedcredentialsbiz.Model {
	var models []managedcredentialsbiz.Model
	for _, provider := range providers {
		config, err := s.Store.GetManagedModelProviderConfig(ctx, workspaceID, provider)
		if err == nil && config.Enabled && config.APIKey != "" {
			models = append(models, config.Models...)
		}
	}
	return models
}

func modelsContain(models []managedcredentialsbiz.Model, modelID string) bool {
	for _, model := range models {
		if strings.TrimSpace(model.ID) == modelID {
			return true
		}
	}
	return false
}

func normalizeProvider(value string) (managedcredentialsbiz.ProviderID, error) {
	value = strings.TrimSpace(value)
	if value == "openai-compatible" {
		value = string(managedcredentialsbiz.ProviderOpenAI)
	}
	if !managedcredentialsbiz.IsProviderID(value) {
		return "", ErrInvalidProvider
	}
	return managedcredentialsbiz.ProviderID(value), nil
}

func normalizeProviders(values []string) ([]managedcredentialsbiz.ProviderID, error) {
	seen := map[managedcredentialsbiz.ProviderID]bool{}
	var providers []managedcredentialsbiz.ProviderID
	for _, value := range values {
		provider, err := normalizeProvider(value)
		if err != nil {
			return nil, err
		}
		if seen[provider] {
			continue
		}
		seen[provider] = true
		providers = append(providers, provider)
	}
	return providers, nil
}

func normalizeModels(provider managedcredentialsbiz.ProviderID, models []managedcredentialsbiz.Model) []managedcredentialsbiz.Model {
	seen := map[string]bool{}
	var normalized []managedcredentialsbiz.Model
	for _, model := range models {
		id := strings.TrimSpace(model.ID)
		if id == "" || seen[id] {
			continue
		}
		seen[id] = true
		name := strings.TrimSpace(model.Name)
		if name == "" {
			name = id
		}
		normalized = append(normalized, managedcredentialsbiz.Model{
			ID:       id,
			Name:     name,
			Provider: provider,
		})
	}
	return normalized
}

func normalizeScopes(values []string) []string {
	seen := map[string]bool{}
	var scopes []string
	for _, value := range values {
		scope := strings.TrimSpace(value)
		if scope == "" || seen[scope] {
			continue
		}
		seen[scope] = true
		scopes = append(scopes, scope)
	}
	return scopes
}

func randomToken() string {
	buf := make([]byte, 32)
	_, _ = rand.Read(buf)
	return base64.RawURLEncoding.EncodeToString(buf)
}
