package runtimepaths

import (
	"os"
	"path/filepath"
	"strings"
)

const BundlePreloadSOPath = ""

type Paths struct {
	root string
}

func Default() Paths {
	return Paths{root: filepath.Join(defaultStateDir(), "agent")}
}

func (p Paths) AgentPath(parts ...string) string {
	all := append([]string{p.root}, parts...)
	return filepath.Join(all...)
}

func defaultStateDir() string {
	if override := strings.TrimSpace(os.Getenv("NEXTOP_STATE_DIR")); override != "" {
		return override
	}

	homeDir, err := os.UserHomeDir()
	if err != nil || strings.TrimSpace(homeDir) == "" {
		if isDevelopmentEnv() {
			return ".nextop-dev"
		}
		return ".nextop"
	}

	dirName := ".nextop"
	if isDevelopmentEnv() {
		dirName = ".nextop-dev"
	}
	return filepath.Join(homeDir, dirName)
}

func isDevelopmentEnv() bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("NEXTOP_ENV"))) {
	case "dev", "development", "local":
		return true
	default:
		return false
	}
}
