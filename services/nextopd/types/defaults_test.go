package types

import (
	"path/filepath"
	"testing"
)

func TestResolveDefaultsFromEnvUsesSharedGeneratedDefaults(t *testing.T) {
	homeDir := t.TempDir()
	t.Setenv("HOME", homeDir)
	t.Setenv("NEXTOP_ENV", "development")
	t.Setenv("NEXTOP_STATE_DIR", "")
	t.Setenv("NEXTOP_LOG_DIR", "")
	t.Setenv("NEXTOPD_ADDR", "")
	t.Setenv("NEXTOPD_LISTENER_INFO_PATH", "")

	got := ResolveDefaultsFromEnv()

	assertEqual(t, got.Runtime.Env, "development")
	assertEqual(t, got.State.RootDir, filepath.Join(homeDir, ".nextop-dev"))
	assertEqual(t, got.State.LogsDir, filepath.Join(homeDir, ".nextop-dev", "logs"))
	assertEqual(t, got.State.RunDir, filepath.Join(homeDir, ".nextop-dev", "run"))
	assertEqual(t, got.State.NextopdDBPath, filepath.Join(homeDir, ".nextop-dev", "nextopd.db"))
	assertEqual(t, got.State.NextopdListenerInfoPath, filepath.Join(homeDir, ".nextop-dev", "run", "nextopd.listener.json"))
	assertEqual(t, got.State.NextopdLogPath, filepath.Join(homeDir, ".nextop-dev", "logs", "nextopd.log"))
	assertEqual(t, got.State.DesktopLogPath, filepath.Join(homeDir, ".nextop-dev", "logs", "nextop-desktop.log"))
	assertEqual(t, got.State.NextopdPIDPath, filepath.Join(homeDir, ".nextop-dev", "run", "nextopd.pid"))
	assertEqual(t, got.Transport.TCPAddr, "127.0.0.1:4545")
	assertEqual(t, got.Logging.DefaultLevel, "info")
	assertEqual(t, got.Logging.DefaultOutput, "file")
	assertEqualInt(t, got.Logging.MaxSizeMB, 50)
	assertEqualInt(t, got.Logging.MaxBackups, 10)
	assertEqualInt(t, got.Logging.MaxAgeDays, 14)
	assertEqualInt(t, got.Logging.MaxTotalMB, 300)
}

func TestResolveAnalyticsConfigUsesGeneratedDefaults(t *testing.T) {
	t.Setenv("NEXTOP_ENV", "")
	t.Setenv("NEXTOP_ANALYTICS_DISABLED", "")
	t.Setenv("NEXTOP_ANALYTICS_APP_ID", "")
	t.Setenv("NEXTOP_ANALYTICS_APP_KEY", "")
	t.Setenv("NEXTOP_ANALYTICS_CHANNEL_DOMAIN", "")
	t.Setenv("NEXTOP_APP_VERSION", "")
	t.Setenv("NEXTOP_ANALYTICS_APP_VERSION", "")

	got := ResolveAnalyticsConfig()

	if got.Disabled {
		t.Fatal("analytics disabled = true, want false")
	}
	assertEqualInt(t, got.AppID, 20004134)
	assertEqual(t, got.AppKey, "984646081c1dc9dbe502e9c5e17711fbf9d9fdb85047eb7808db4776c34c0af0")
	assertEqual(t, got.Channel, "sg")
	assertEqual(t, got.ChannelDomain, "https://gator.uba.ap-southeast-1.volces.com")
	assertEqual(t, got.AppVersion, "0.0.0")
}

func TestResolveAnalyticsConfigEnablesDebugPipelineInDevelopment(t *testing.T) {
	t.Setenv("NEXTOP_ENV", "development")
	t.Setenv("NEXTOP_ANALYTICS_DISABLED", "")
	t.Setenv("NEXTOP_ANALYTICS_APP_ID", "")
	t.Setenv("NEXTOP_ANALYTICS_APP_KEY", "")
	t.Setenv("NEXTOP_ANALYTICS_CHANNEL_DOMAIN", "")
	t.Setenv("NEXTOP_APP_VERSION", "")
	t.Setenv("NEXTOP_ANALYTICS_APP_VERSION", "")

	got := ResolveAnalyticsConfig()

	if got.Disabled {
		t.Fatal("analytics disabled = true, want false so development can publish local debug events")
	}
	if !got.Debug {
		t.Fatal("analytics debug = false, want true in development")
	}
}

func TestResolveAnalyticsConfigAppliesOverrides(t *testing.T) {
	t.Setenv("NEXTOP_ENV", "")
	t.Setenv("NEXTOP_ANALYTICS_DISABLED", "true")
	t.Setenv("NEXTOP_ANALYTICS_APP_ID", "123")
	t.Setenv("NEXTOP_ANALYTICS_APP_KEY", "dev-key")
	t.Setenv("NEXTOP_ANALYTICS_CHANNEL_DOMAIN", "https://example.test")
	t.Setenv("NEXTOP_APP_VERSION", "")
	t.Setenv("NEXTOP_ANALYTICS_APP_VERSION", "1.2.3")

	got := ResolveAnalyticsConfig()

	if !got.Disabled {
		t.Fatal("analytics disabled = false, want true")
	}
	assertEqualInt(t, got.AppID, 123)
	assertEqual(t, got.AppKey, "dev-key")
	assertEqual(t, got.ChannelDomain, "https://example.test")
	assertEqual(t, got.AppVersion, "1.2.3")
}

func TestResolveAnalyticsConfigEnablesDebugForDevelopmentOnly(t *testing.T) {
	cases := []struct {
		name      string
		nextopEnv string
		want      bool
	}{
		{name: "development", nextopEnv: "development", want: true},
		{name: "production", nextopEnv: "production", want: false},
		{name: "unset env", nextopEnv: "", want: false},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("NEXTOP_ENV", tt.nextopEnv)
			t.Setenv("NEXTOP_ANALYTICS_DISABLED", "")
			t.Setenv("NEXTOP_ANALYTICS_APP_ID", "")
			t.Setenv("NEXTOP_ANALYTICS_APP_KEY", "")
			t.Setenv("NEXTOP_ANALYTICS_CHANNEL_DOMAIN", "")
			t.Setenv("NEXTOP_APP_VERSION", "")
			t.Setenv("NEXTOP_ANALYTICS_APP_VERSION", "")

			got := ResolveAnalyticsConfig()

			assertEqualBool(t, got.Debug, tt.want)
		})
	}
}

func TestResolveAnalyticsConfigParsesDisabledOverride(t *testing.T) {
	tests := []struct {
		name  string
		value string
		want  bool
	}{
		{name: "empty", value: "", want: false},
		{name: "true", value: "true", want: true},
		{name: "uppercase true", value: "TRUE", want: true},
		{name: "one", value: "1", want: true},
		{name: "yes", value: "yes", want: true},
		{name: "false", value: "false", want: false},
		{name: "uppercase false", value: "FALSE", want: false},
		{name: "zero", value: "0", want: false},
		{name: "no", value: "no", want: false},
		{name: "invalid", value: "treu", want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("NEXTOP_ANALYTICS_DISABLED", tt.value)
			t.Setenv("NEXTOP_ANALYTICS_APP_ID", "")
			t.Setenv("NEXTOP_ANALYTICS_APP_KEY", "")
			t.Setenv("NEXTOP_ANALYTICS_CHANNEL_DOMAIN", "")
			t.Setenv("NEXTOP_APP_VERSION", "")
			t.Setenv("NEXTOP_ANALYTICS_APP_VERSION", "")

			got := ResolveAnalyticsConfig()

			assertEqualBool(t, got.Disabled, tt.want)
		})
	}
}

func TestResolveAnalyticsConfigParsesAppIDOverride(t *testing.T) {
	tests := []struct {
		name  string
		value string
		want  int
	}{
		{name: "empty", value: "", want: 20004134},
		{name: "positive integer", value: "123", want: 123},
		{name: "zero", value: "0", want: 0},
		{name: "negative", value: "-1", want: 0},
		{name: "non numeric", value: "abc", want: 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("NEXTOP_ANALYTICS_DISABLED", "")
			t.Setenv("NEXTOP_ANALYTICS_APP_ID", tt.value)
			t.Setenv("NEXTOP_ANALYTICS_APP_KEY", "")
			t.Setenv("NEXTOP_ANALYTICS_CHANNEL_DOMAIN", "")
			t.Setenv("NEXTOP_APP_VERSION", "")
			t.Setenv("NEXTOP_ANALYTICS_APP_VERSION", "")

			got := ResolveAnalyticsConfig()

			assertEqualInt(t, got.AppID, tt.want)
		})
	}
}

func TestResolveAnalyticsConfigResolvesAppVersionOverride(t *testing.T) {
	tests := []struct {
		name                     string
		appVersion               string
		analyticsSpecificVersion string
		want                     string
	}{
		{name: "empty", appVersion: "", analyticsSpecificVersion: "", want: "0.0.0"},
		{name: "shared app version", appVersion: "1.2.3", analyticsSpecificVersion: "", want: "1.2.3"},
		{name: "analytics specific version takes precedence", appVersion: "1.2.3", analyticsSpecificVersion: "2.3.4", want: "2.3.4"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("NEXTOP_ANALYTICS_DISABLED", "")
			t.Setenv("NEXTOP_ANALYTICS_APP_ID", "")
			t.Setenv("NEXTOP_ANALYTICS_APP_KEY", "")
			t.Setenv("NEXTOP_ANALYTICS_CHANNEL_DOMAIN", "")
			t.Setenv("NEXTOP_APP_VERSION", tt.appVersion)
			t.Setenv("NEXTOP_ANALYTICS_APP_VERSION", tt.analyticsSpecificVersion)

			got := ResolveAnalyticsConfig()

			assertEqual(t, got.AppVersion, tt.want)
		})
	}
}

func assertEqual(t *testing.T, got string, want string) {
	t.Helper()
	if got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}

func assertEqualInt(t *testing.T, got int, want int) {
	t.Helper()
	if got != want {
		t.Fatalf("got %d, want %d", got, want)
	}
}

func assertEqualBool(t *testing.T, got bool, want bool) {
	t.Helper()
	if got != want {
		t.Fatalf("got %t, want %t", got, want)
	}
}
