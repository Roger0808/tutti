package agentsidecar

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func resolveCLICommand(stateDir string) string {
	stateDir = strings.TrimSpace(stateDir)
	if stateDir == "" {
		return "nextop"
	}
	entries, err := os.ReadDir(filepath.Join(stateDir, "bin"))
	if err != nil {
		return "nextop"
	}

	candidates := make([]string, 0)
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		base := strings.TrimSuffix(name, ".cmd")
		if base == "nextop" || strings.HasPrefix(base, "nextop-") {
			candidates = append(candidates, base)
		}
	}
	if len(candidates) == 0 {
		return "nextop"
	}
	sort.SliceStable(candidates, func(left, right int) bool {
		if candidates[left] == "nextop" {
			return false
		}
		if candidates[right] == "nextop" {
			return true
		}
		return candidates[left] < candidates[right]
	})
	return candidates[0]
}
