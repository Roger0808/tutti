package workspacefiles

import "testing"

func TestScoreSearchCandidatesRanksBasenameBeforePath(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", "dock", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: "src/components/fileTransferDockController.ts"},
		{Kind: EntryKindFile, RelativePath: "dock.ts"},
		{Kind: EntryKindFile, RelativePath: "docs/workspace.md"},
	}, 10)

	if len(entries) < 2 {
		t.Fatalf("entries length = %d, want at least 2", len(entries))
	}
	if entries[0].Path != "/workspace/dock.ts" {
		t.Fatalf("top entry = %q, want /workspace/dock.ts", entries[0].Path)
	}
	if entries[0].MatchTarget != SearchMatchTargetBasename {
		t.Fatalf("top entry matchTarget = %q, want %q", entries[0].MatchTarget, SearchMatchTargetBasename)
	}
	if len(entries[0].MatchIndices) == 0 {
		t.Fatal("expected basename match indices")
	}
}

func TestScoreSearchCandidatesSupportsMultiTokenBasenameQuery(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", "dock cont", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: "src/components/fileTransferDockController.ts"},
		{Kind: EntryKindFile, RelativePath: "src/components/DockPanel.tsx"},
	}, 10)

	if len(entries) == 0 {
		t.Fatal("expected a fuzzy path match")
	}
	if entries[0].Path != "/workspace/src/components/fileTransferDockController.ts" {
		t.Fatalf("top entry = %q", entries[0].Path)
	}
}

func TestScoreSearchCandidatesTreatsDotQueryAsLiteralFilenameFragment(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", ".dmg", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: ".agents/skills/baoyu-slide-deck/scripts/merge-to-pdf.ts"},
		{Kind: EntryKindFile, RelativePath: "Downloads/googlechrome.dmg"},
	}, 10)

	if len(entries) != 1 {
		t.Fatalf("entries length = %d, want 1: %#v", len(entries), entries)
	}
	if entries[0].Path != "/workspace/Downloads/googlechrome.dmg" {
		t.Fatalf("entry = %#v, want Downloads/googlechrome.dmg", entries[0])
	}
	if entries[0].MatchTarget != SearchMatchTargetBasename {
		t.Fatalf("matchTarget = %q, want %q", entries[0].MatchTarget, SearchMatchTargetBasename)
	}
}

func TestScoreSearchCandidatesDoesNotFuzzyMatchDotLiteralInsideExtension(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", ".pos", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: ".cache/codex/resources_en_US.properties"},
		{Kind: EntryKindFile, RelativePath: "models/sample.pos"},
	}, 10)

	if len(entries) != 1 {
		t.Fatalf("entries length = %d, want 1: %#v", len(entries), entries)
	}
	if entries[0].Path != "/workspace/models/sample.pos" {
		t.Fatalf("entry = %#v, want models/sample.pos", entries[0])
	}
}

func TestScoreSearchCandidatesDoesNotFuzzyMatchMissingDotLiteralInMultiTokenQuery(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", ".dmg pdf", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: ".agents/skills/baoyu-slide-deck/scripts/merge-to-pdf.ts"},
		{Kind: EntryKindFile, RelativePath: "Downloads/googlechrome.dmg"},
		{Kind: EntryKindFile, RelativePath: "Downloads/pdf-tools.dmg"},
	}, 10)

	if len(entries) != 0 {
		t.Fatalf("entries = %#v, want no false-positive matches", entries)
	}
}

func TestScoreSearchCandidatesRequiresDotLiteralForMultiTokenQuery(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", "pdf .dmg", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: ".agents/skills/baoyu-slide-deck/scripts/merge-to-pdf.ts"},
		{Kind: EntryKindFile, RelativePath: "Downloads/googlechrome.dmg"},
		{Kind: EntryKindFile, RelativePath: "Downloads/pdf-tools.dmg"},
	}, 10)

	if len(entries) != 1 {
		t.Fatalf("entries length = %d, want 1: %#v", len(entries), entries)
	}
	if entries[0].Path != "/workspace/Downloads/pdf-tools.dmg" {
		t.Fatalf("entry = %#v, want Downloads/pdf-tools.dmg", entries[0])
	}
}

func TestScoreSearchCandidatesSupportsWordThenDotLiteralQuery(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", "chrome .dmg", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: ".agents/skills/baoyu-slide-deck/scripts/merge-to-pdf.ts"},
		{Kind: EntryKindFile, RelativePath: "Downloads/googlechrome.dmg"},
	}, 10)

	if len(entries) != 1 {
		t.Fatalf("entries length = %d, want 1: %#v", len(entries), entries)
	}
	if entries[0].Path != "/workspace/Downloads/googlechrome.dmg" {
		t.Fatalf("entry = %#v, want Downloads/googlechrome.dmg", entries[0])
	}
}

func TestSearchQueryTargetsHiddenOrNoiseDoesNotTreatPathExtensionAsDirectoryIntent(t *testing.T) {
	if SearchQueryTargetsHiddenOrNoise("Downloads/.dmg") {
		t.Fatal("Downloads/.dmg should target a filename extension, not hidden directories")
	}
	if !SearchQueryTargetsHiddenOrNoise(".hidden/file") {
		t.Fatal(".hidden/file should target a hidden directory")
	}
	if !SearchQueryTargetsHiddenOrNoise("src/.hidden/") {
		t.Fatal("src/.hidden/ should target a hidden directory")
	}
}

func TestScoreSearchCandidatesTreatsSlashQueryAsPathIntent(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", "tsh/", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: ".agents/skills/lark-shared/SKILL.md"},
		{Kind: EntryKindFile, RelativePath: "tools/tsh/runtime.md"},
		{Kind: EntryKindFile, RelativePath: "notes/ts-helper/readme.md"},
	}, 10)

	if len(entries) == 0 {
		t.Fatal("expected at least one path-aware match")
	}
	if entries[0].Path != "/workspace/tools/tsh/runtime.md" {
		t.Fatalf("top entry = %q, want /workspace/tools/tsh/runtime.md", entries[0].Path)
	}
	if entries[0].MatchTarget != SearchMatchTargetPath {
		t.Fatalf("top entry matchTarget = %q, want %q", entries[0].MatchTarget, SearchMatchTargetPath)
	}
	if len(entries[0].MatchIndices) == 0 {
		t.Fatal("expected path match indices")
	}
	for _, entry := range entries {
		if entry.Path == "/workspace/.agents/skills/lark-shared/SKILL.md" {
			t.Fatalf("unexpected loose subsequence path match %q", entry.Path)
		}
	}
}

func TestScoreSearchCandidatesPenalizesHiddenAndNoisePaths(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", "skill", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: ".agents/skills/skill.md"},
		{Kind: EntryKindFile, RelativePath: "docs/skill.md"},
	}, 10)

	if len(entries) < 2 {
		t.Fatalf("entries length = %d, want at least 2", len(entries))
	}
	if entries[0].Path != "/workspace/docs/skill.md" {
		t.Fatalf("top entry = %q, want /workspace/docs/skill.md", entries[0].Path)
	}
}

func TestScoreSearchCandidatesAllowsExplicitHiddenTargetQuery(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", ".agents skill", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: ".agents/skills/skill.md"},
		{Kind: EntryKindFile, RelativePath: "docs/skill.md"},
	}, 10)

	if len(entries) == 0 {
		t.Fatal("expected an explicit hidden-target match")
	}
	if entries[0].Path != "/workspace/.agents/skills/skill.md" {
		t.Fatalf("top entry = %q, want /workspace/.agents/skills/skill.md", entries[0].Path)
	}
	if entries[0].MatchTarget != SearchMatchTargetPath {
		t.Fatalf("top entry matchTarget = %q, want %q", entries[0].MatchTarget, SearchMatchTargetPath)
	}
}

func TestScoreSearchCandidatesAllowsExplicitHiddenPathIntentQuery(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", ".git/conf", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: ".git/config"},
		{Kind: EntryKindFile, RelativePath: "configs/git.conf"},
	}, 10)

	if len(entries) == 0 {
		t.Fatal("expected an explicit hidden path match")
	}
	if entries[0].Path != "/workspace/.git/config" {
		t.Fatalf("top entry = %q, want /workspace/.git/config", entries[0].Path)
	}
}

func TestScoreSearchCandidatesKeepsDirectBasenameHitAheadOfHiddenFallback(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", "tsh", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: ".agents/tsh/hooks/README.md"},
		{Kind: EntryKindFile, RelativePath: "notes/about-tsh.md"},
		{Kind: EntryKindFile, RelativePath: "tsh.md"},
	}, 10)

	if len(entries) < 2 {
		t.Fatalf("entries length = %d, want at least 2", len(entries))
	}
	if entries[0].Path != "/workspace/tsh.md" {
		t.Fatalf("top entry = %q, want /workspace/tsh.md", entries[0].Path)
	}
}

func TestScoreSearchCandidatesPrefersDirectoryForTrailingSlashQuery(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", "src/", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: "src.md"},
		{Kind: EntryKindDirectory, RelativePath: "src"},
	}, 10)

	if len(entries) < 2 {
		t.Fatalf("entries length = %d, want at least 2", len(entries))
	}
	if entries[0].Kind != EntryKindDirectory || entries[0].Path != "/workspace/src" {
		t.Fatalf("top entry = %#v, want directory /workspace/src", entries[0])
	}
}

func TestScoreSearchCandidatesRespectsPathSegmentOrder(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", "docs/work", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: "docs/workspace.md"},
		{Kind: EntryKindFile, RelativePath: "workspace/docs.md"},
		{Kind: EntryKindFile, RelativePath: "notes/workspace-docs.md"},
	}, 10)

	if len(entries) == 0 {
		t.Fatal("expected a path-aware segment-order match")
	}
	if entries[0].Path != "/workspace/docs/workspace.md" {
		t.Fatalf("top entry = %q, want /workspace/docs/workspace.md", entries[0].Path)
	}
}

func TestScoreSearchCandidatesLimitsAndFiltersInvalidCandidates(t *testing.T) {
	entries := ScoreSearchCandidates("/workspace", "file", []SearchCandidate{
		{Kind: EntryKindFile, RelativePath: "src/file-one.ts"},
		{Kind: EntryKindDirectory, RelativePath: "src/file-two"},
		{Kind: EntryKindUnknown, RelativePath: "src/file-three"},
		{Kind: EntryKindFile, RelativePath: "../file-four"},
	}, 1)

	if len(entries) != 1 {
		t.Fatalf("entries length = %d, want 1", len(entries))
	}
	if entries[0].Kind != EntryKindDirectory && entries[0].Kind != EntryKindFile {
		t.Fatalf("unexpected kind %q", entries[0].Kind)
	}
}

func TestNormalizeSearchKinds(t *testing.T) {
	got, err := NormalizeSearchKinds([]EntryKind{EntryKindFile, EntryKindFile})
	if err != nil {
		t.Fatalf("NormalizeSearchKinds() error = %v", err)
	}
	if len(got) != 1 || got[0] != EntryKindFile {
		t.Fatalf("NormalizeSearchKinds() = %#v", got)
	}

	got, err = NormalizeSearchKinds(nil)
	if err != nil {
		t.Fatalf("NormalizeSearchKinds(nil) error = %v", err)
	}
	if len(got) != 2 || got[0] != EntryKindFile || got[1] != EntryKindDirectory {
		t.Fatalf("NormalizeSearchKinds(nil) = %#v", got)
	}

	_, err = NormalizeSearchKinds([]EntryKind{EntryKindUnknown})
	if err == nil {
		t.Fatal("NormalizeSearchKinds(unknown) error = nil, want error")
	}
}
