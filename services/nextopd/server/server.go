package server

import (
	"crypto/subtle"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	nextopapi "github.com/tutti-os/tutti/services/nextopd/api"
	workspacebiz "github.com/tutti-os/tutti/services/nextopd/biz/workspace"
	nextoptypes "github.com/tutti-os/tutti/services/nextopd/types"
)

type Routes = nextopapi.Routes

type ListenerSpec struct {
	AccessToken string
	Addr        string
}

func NewMux(routes Routes) *http.ServeMux {
	mux := http.NewServeMux()
	nextopapi.RegisterRoutes(mux, routes)
	return mux
}

func NewHTTPServer(spec ListenerSpec, routes Routes) *http.Server {
	handler := nextoptypes.WithBearerTokenAuthFunc(
		spec.AccessToken,
		func(r *http.Request, token string) bool {
			return authorizeWorkspaceAppServerToken(r, token, spec.AccessToken)
		},
		NewMux(routes),
	)

	return &http.Server{
		Addr:    spec.Addr,
		Handler: nextoptypes.WithCORS(handler),
	}
}

func authorizeWorkspaceAppServerToken(r *http.Request, token string, accessToken string) bool {
	if r.Method != http.MethodGet && r.Method != http.MethodPost && r.Method != http.MethodDelete {
		return false
	}
	segments := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if (len(segments) != 7 && len(segments) != 8) ||
		segments[0] != "v1" ||
		segments[1] != "workspaces" ||
		segments[3] != "apps" ||
		segments[5] != "managed-model-grants" {
		return false
	}
	switch r.Method {
	case http.MethodPost:
		if (len(segments) != 7 || segments[6] != "exchange") &&
			(len(segments) != 8 || segments[7] != "credentials") {
			return false
		}
	case http.MethodGet:
		if len(segments) != 8 || segments[7] != "models" {
			return false
		}
	case http.MethodDelete:
		if len(segments) != 7 || segments[6] == "exchange" {
			return false
		}
	default:
		return false
	}
	workspaceID, err := url.PathUnescape(segments[2])
	if err != nil {
		return false
	}
	appID, err := url.PathUnescape(segments[4])
	if err != nil {
		return false
	}
	expected := workspacebiz.AppServerToken(accessToken, workspaceID, appID)
	return expected != "" && subtle.ConstantTimeCompare([]byte(token), []byte(expected)) == 1
}

func AddrFromEnv() string {
	return nextoptypes.ResolveDefaultsFromEnv().Transport.TCPAddr
}

func ListenerSpecFromEnv() (ListenerSpec, error) {
	defaults := nextoptypes.ResolveDefaultsFromEnv()
	accessToken := nextoptypes.EnvOrDefault("NEXTOPD_ACCESS_TOKEN", "")
	if accessToken == "" {
		return ListenerSpec{}, fmt.Errorf("NEXTOPD_ACCESS_TOKEN is required")
	}

	return ListenerSpec{
		AccessToken: accessToken,
		Addr:        defaults.Transport.TCPAddr,
	}, nil
}
