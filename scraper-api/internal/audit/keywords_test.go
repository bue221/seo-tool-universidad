package audit

import (
	"strings"
	"testing"
)

func TestTokenize(t *testing.T) {
	cases := []struct {
		name  string
		input string
		// wantLen lets us check length without caring about order
		wantLen  int
		contains []string
		excludes []string
	}{
		{
			name:    "empty string",
			input:   "",
			wantLen: 0,
		},
		{
			name:     "short words filtered under 3 chars",
			input:    "it is a go",
			wantLen:  0,
		},
		{
			name:     "stop words filtered",
			input:    "the seo and analysis for page",
			wantLen:  3,
			contains: []string{"seo", "analysis", "page"},
			excludes: []string{"the", "and", "for"},
		},
		{
			name:     "result in lowercase",
			input:    "SEO TOOL ANALYSIS",
			wantLen:  3,
			contains: []string{"seo", "tool", "analysis"},
		},
		{
			name:     "seo tool analysis three tokens",
			input:    "seo tool analysis",
			wantLen:  3,
			contains: []string{"seo", "tool", "analysis"},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := tokenize(tc.input)
			if len(got) != tc.wantLen {
				t.Errorf("tokenize(%q) len = %d, want %d — tokens: %v", tc.input, len(got), tc.wantLen, got)
			}
			set := make(map[string]struct{}, len(got))
			for _, tok := range got {
				set[tok] = struct{}{}
			}
			for _, expected := range tc.contains {
				if _, ok := set[expected]; !ok {
					t.Errorf("tokenize(%q) missing expected token %q in %v", tc.input, expected, got)
				}
			}
			for _, excluded := range tc.excludes {
				if _, ok := set[excluded]; ok {
					t.Errorf("tokenize(%q) should not contain %q but found it in %v", tc.input, excluded, got)
				}
			}
		})
	}
}

func TestTop_EmptyText(t *testing.T) {
	got := Top("", 5)
	if got.Top == nil {
		t.Fatal("Top(\"\", 5).Top must not be nil")
	}
	if len(got.Top) != 0 {
		t.Errorf("Top(\"\", 5) expected empty slice, got %v", got.Top)
	}
}

func TestTop_RespectsLimit(t *testing.T) {
	// 3 unique words, request only 2
	got := Top("seo tool analysis", 2)
	if len(got.Top) != 2 {
		t.Errorf("expected 2 entries, got %d: %v", len(got.Top), got.Top)
	}
}

func TestTop_MostFrequentFirst(t *testing.T) {
	// "seo" appears 3x, "tool" 1x
	got := Top("seo seo seo tool", 2)
	if len(got.Top) < 1 {
		t.Fatal("expected at least 1 entry")
	}
	if got.Top[0].Term != "seo" {
		t.Errorf("most frequent term should be 'seo', got %q", got.Top[0].Term)
	}
}

func TestTop_DensityInRange(t *testing.T) {
	got := Top("seo seo tool analysis", 3)
	for _, entry := range got.Top {
		if entry.Density <= 0 || entry.Density > 1 {
			t.Errorf("density out of (0,1] range: %v for term %q", entry.Density, entry.Term)
		}
	}
}

func TestTop_NGreaterThanTokens(t *testing.T) {
	// Only 2 unique tokens, request 10 — should not panic and return ≤2
	text := strings.Repeat("seo tool ", 5)
	got := Top(text, 10)
	if len(got.Top) > 2 {
		t.Errorf("expected at most 2 entries, got %d", len(got.Top))
	}
}
