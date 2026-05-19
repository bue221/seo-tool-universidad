package audit

import (
	"context"
	"time"
)

type RawInput struct {
	URL             string
	Text            string
	HTML            string
	OnPageRaw       OnPageRaw
	Tokens          []string
}

func Run(ctx context.Context, raw RawInput) (Response, error) {
	_ = ctx
	tokens := raw.Tokens
	if len(tokens) == 0 {
		tokens = tokenize(raw.Text)
	}
	return Response{
		URL: raw.URL,
		FetchedAt: time.Now().UTC().Format(time.RFC3339),
		OnPage: Analyze(raw.OnPageRaw),
		Tracking: Detect(raw.HTML),
		Keywords: Top(raw.Text, 5),
		Sentiment: Score(tokens),
	}, nil
}
