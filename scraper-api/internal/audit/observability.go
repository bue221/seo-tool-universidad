package audit

import "time"

type stageRecorder struct {
	startedAt time.Time
	stages    []StageMetric
}

func newStageRecorder() *stageRecorder {
	return &stageRecorder{startedAt: time.Now()}
}

func (r *stageRecorder) measure(name string, fn func() (StageStatus, string)) {
	start := time.Now()
	status, code := fn()
	stage := StageMetric{
		Name:       name,
		Status:     status,
		DurationMs: time.Since(start).Milliseconds(),
	}
	if code != "" {
		stage.Code = code
	}
	r.stages = append(r.stages, stage)
}

func (r *stageRecorder) build() *Observability {
	return &Observability{
		Stages:          r.stages,
		TotalDurationMs: time.Since(r.startedAt).Milliseconds(),
	}
}
