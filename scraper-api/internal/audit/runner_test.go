package audit

import (
	"context"
	"testing"
)

func TestRun_URLEchoedInResponse(t *testing.T) {
	ctx := context.Background()
	resp, err := Run(ctx, RawInput{
		URL:  "https://example.com",
		Text: "hello world test",
	})
	if err != nil {
		t.Fatalf("Run returned error: %v", err)
	}
	if resp.URL != "https://example.com" {
		t.Errorf("resp.URL = %q, want %q", resp.URL, "https://example.com")
	}
}

func TestRun_TokensHavePrecedenceOverText(t *testing.T) {
	// If Run re-tokenizes Text ("bad bad bad"), Sentiment would be "negative"
	// because "bad" is in Negatives. When Tokens are provided, they should be
	// used directly. "provided" and "tokens" are not in any lexicon → total=0 → neutral.
	ctx := context.Background()
	resp, err := Run(ctx, RawInput{
		URL:    "https://example.com",
		Tokens: []string{"provided", "tokens"},
		Text:   "bad bad bad",
	})
	if err != nil {
		t.Fatalf("Run returned error: %v", err)
	}
	if resp.Sentiment.Polarity != "neutral" {
		t.Errorf("Sentiment.Polarity = %q, want \"neutral\" (Tokens should override Text re-tokenization)", resp.Sentiment.Polarity)
	}
}

func TestRun_AllFieldsPresent(t *testing.T) {
	ctx := context.Background()
	resp, err := Run(ctx, RawInput{
		URL:  "https://example.com",
		Text: "good great excellent performance",
		HTML: `<script>GTM-ABC</script>`,
		OnPageRaw: OnPageRaw{
			Title:         "Test Page Title for SEO",
			H1Values:      []string{"Main heading"},
			ImagesTotal:   2,
			ImagesWithAlt: 1,
		},
	})
	if err != nil {
		t.Fatalf("Run returned error: %v", err)
	}
	if resp.FetchedAt == "" {
		t.Error("FetchedAt must not be empty")
	}
	if resp.OnPage.Title.Value != "Test Page Title for SEO" {
		t.Errorf("OnPage.Title.Value = %q, want %q", resp.OnPage.Title.Value, "Test Page Title for SEO")
	}
	if !resp.Tracking.GTM.Detected {
		t.Error("Tracking.GTM.Detected should be true — HTML contains GTM-ABC")
	}
	if len(resp.Keywords.Top) == 0 {
		t.Error("Keywords.Top must not be empty for non-trivial text")
	}
}
