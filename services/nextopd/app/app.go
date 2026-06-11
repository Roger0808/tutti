package app

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

type App struct {
	Server          *http.Server
	Listener        net.Listener
	LogFilePath     string
	ShutdownTimeout time.Duration
	Logger          *slog.Logger
}

func New(server *http.Server, listener net.Listener, logFilePath string) *App {
	return &App{
		Server:          server,
		Listener:        listener,
		LogFilePath:     logFilePath,
		ShutdownTimeout: 5 * time.Second,
		Logger:          slog.Default(),
	}
}

func (a *App) Run(ctx context.Context) error {
	if a == nil || a.Server == nil {
		return errors.New("nextop app server is not configured")
	}

	logger := a.logger()
	logger.Info("nextopd listening", "event", "nextop.listen", "addr", a.Server.Addr, "log_file", a.LogFilePath)

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGTERM, syscall.SIGINT)
	defer signal.Stop(sigCh)

	go func() {
		select {
		case <-ctx.Done():
			a.shutdown(context.Background(), "context-cancelled", nil)
		case sig := <-sigCh:
			a.shutdown(context.Background(), "signal", sig)
		}
	}()

	var err error
	if a.Listener != nil {
		err = a.Server.Serve(a.Listener)
	} else {
		err = a.Server.ListenAndServe()
	}

	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Error("nextopd server exited", "event", "nextop.listen.failed", "error_code", "server_serve_failed", "error", err)
		return err
	}

	logger.Info("nextopd main exiting", "event", "nextop.main.exit")
	return nil
}

func (a *App) shutdown(parent context.Context, reason string, sig os.Signal) {
	logger := a.logger()
	if sig != nil {
		logger.Info("nextopd received signal, shutting down", "event", "nextop.signal", "signal", sig)
	} else {
		logger.Info("nextopd shutting down", "event", "nextop.shutdown", "reason", reason)
	}

	timeout := a.ShutdownTimeout
	if timeout <= 0 {
		timeout = 5 * time.Second
	}

	shutdownCtx, cancel := context.WithTimeout(parent, timeout)
	defer cancel()

	if err := a.Server.Shutdown(shutdownCtx); err != nil {
		logger.Warn("http server shutdown error", "event", "nextop.signal.shutdown_error", "error_code", "server_shutdown_failed", "error", err)
		return
	}

	logger.Info("http server shutdown complete", "event", "nextop.signal.shutdown_done")
}

func (a *App) logger() *slog.Logger {
	if a != nil && a.Logger != nil {
		return a.Logger
	}

	return slog.Default()
}
