package api

import (
	"context"
	"regexp"

	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	"github.com/tutti-os/tutti/services/nextopd/apierrors"
	reporterservice "github.com/tutti-os/tutti/services/nextopd/service/reporter"
)

const (
	maxTrackEventsPerRequest = 100
	maxTrackEventNameLength  = 128
)

var trackEventNamePattern = regexp.MustCompile(`^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$`)

func (api DaemonAPI) TrackEvents(ctx context.Context, request nextopgenerated.TrackEventsRequestObject) (nextopgenerated.TrackEventsResponseObject, error) {
	if response := validateTrackEventsRequest(request); response != nil {
		return response, nil
	}
	if api.AnalyticsReporter == nil {
		return nextopgenerated.TrackEvents503JSONResponse{
			ServiceUnavailableErrorJSONResponse: serviceUnavailableError(
				apierrors.ServiceUnavailable(
					"analytics_reporter_unavailable",
					apierrors.WithDeveloperMessage("analytics reporter is not configured"),
				),
			),
		}, nil
	}
	events := make([]reporterservice.Event, 0, len(request.Body.Events))
	for _, event := range request.Body.Events {
		events = append(events, reporterservice.Event{
			Name:     event.Name,
			ClientTS: event.ClientTs,
			Params:   copyTrackEventParams(event.Params),
		})
	}
	api.AnalyticsReporter.Track(ctx, events...)

	return nextopgenerated.TrackEvents202Response{}, nil
}

func validateTrackEventsRequest(request nextopgenerated.TrackEventsRequestObject) nextopgenerated.TrackEventsResponseObject {
	if request.Body == nil || len(request.Body.Events) == 0 {
		return nextopgenerated.TrackEvents400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					"analytics_events_required",
					apierrors.WithDeveloperMessage("analytics events are required"),
				),
			),
		}
	}
	if len(request.Body.Events) > maxTrackEventsPerRequest {
		return nextopgenerated.TrackEvents400JSONResponse{
			InvalidRequestErrorJSONResponse: invalidRequestError(
				apierrors.InvalidRequest(
					"analytics_events_limit_exceeded",
					apierrors.WithDeveloperMessage("analytics events must not exceed 100"),
				),
			),
		}
	}
	for _, event := range request.Body.Events {
		if !isValidTrackEventName(event.Name) {
			return nextopgenerated.TrackEvents400JSONResponse{
				InvalidRequestErrorJSONResponse: invalidRequestError(
					apierrors.InvalidRequest(
						"analytics_event_name_invalid",
						apierrors.WithDeveloperMessage("analytics event name is invalid"),
					),
				),
			}
		}
		if event.ClientTs < 1 {
			return nextopgenerated.TrackEvents400JSONResponse{
				InvalidRequestErrorJSONResponse: invalidRequestError(
					apierrors.InvalidRequest(
						"analytics_event_client_ts_invalid",
						apierrors.WithDeveloperMessage("analytics event client_ts is invalid"),
					),
				),
			}
		}
	}
	return nil
}

func isValidTrackEventName(name string) bool {
	if isAllowedPredefinedTrackEventName(name) {
		return true
	}
	return len(name) > 0 &&
		len(name) <= maxTrackEventNameLength &&
		trackEventNamePattern.MatchString(name)
}

func isAllowedPredefinedTrackEventName(name string) bool {
	return name == "predefine_pageview"
}

func copyTrackEventParams(params *map[string]interface{}) map[string]any {
	if params == nil {
		return nil
	}
	result := make(map[string]any, len(*params))
	for key, value := range *params {
		result[key] = value
	}
	return result
}
