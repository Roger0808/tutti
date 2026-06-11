package types

func NextopdDBPath() string {
	return ResolveDefaultsFromEnv().State.NextopdDBPath
}

func NextopdLogsDir() string {
	return ResolveDefaultsFromEnv().State.LogsDir
}

func NextopdLogPath() string {
	return ResolveDefaultsFromEnv().State.NextopdLogPath
}

func NextopdRunDir() string {
	return ResolveDefaultsFromEnv().State.RunDir
}

func NextopdListenerInfoPath() string {
	return ResolveDefaultsFromEnv().State.NextopdListenerInfoPath
}

func NextopdPIDPath() string {
	return ResolveDefaultsFromEnv().State.NextopdPIDPath
}

func DefaultStateDir() string {
	return ResolveDefaultsFromEnv().State.RootDir
}

func IsDevelopmentEnv() bool {
	return ResolveDefaultsFromEnv().Runtime.Env == "development"
}
