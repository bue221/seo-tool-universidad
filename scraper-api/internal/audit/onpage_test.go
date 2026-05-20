package audit

import (
	"strings"
	"testing"
)

func TestScoreLength(t *testing.T) {
	cases := []struct {
		name  string
		value string
		min   int
		max   int
		want  float64
	}{
		{"empty string", "", 30, 60, 0},
		{"exact min", strings.Repeat("a", 30), 30, 60, 1.0},
		{"exact max", strings.Repeat("a", 60), 30, 60, 1.0},
		{"in range middle", strings.Repeat("a", 45), 30, 60, 1.0},
		{"below min", strings.Repeat("a", 15), 30, 60, 0.5},
		{"above max", strings.Repeat("a", 120), 30, 60, 0.5},
		{"short one char", "x", 30, 60, float64(1) / float64(30)},
		{"above max by one", strings.Repeat("a", 61), 30, 60, float64(60) / float64(61)},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := scoreLength(tc.value, tc.min, tc.max)
			if got != tc.want {
				t.Errorf("scoreLength(%q, %d, %d) = %v, want %v", tc.value, tc.min, tc.max, got, tc.want)
			}
		})
	}
}

func TestAnalyze_AltCoverage(t *testing.T) {
	cases := []struct {
		name        string
		total       int
		withAlt     int
		wantCoverage float64
	}{
		{"no images zero division", 0, 0, 0.0},
		{"all with alt", 4, 4, 1.0},
		{"partial coverage 2 of 4", 4, 2, 0.5},
		{"none with alt", 3, 0, 0.0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			raw := OnPageRaw{ImagesTotal: tc.total, ImagesWithAlt: tc.withAlt}
			got := Analyze(raw)
			if got.Images.AltCoverage != tc.wantCoverage {
				t.Errorf("AltCoverage = %v, want %v", got.Images.AltCoverage, tc.wantCoverage)
			}
		})
	}
}

func TestAnalyze_H1(t *testing.T) {
	cases := []struct {
		name       string
		h1Values   []string
		wantCount  int
		wantValue  string
	}{
		{"no H1s", []string{}, 0, ""},
		{"single H1", []string{"Main heading"}, 1, "Main heading"},
		{"multiple H1s first wins", []string{"First", "Second", "Third"}, 3, "First"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			raw := OnPageRaw{H1Values: tc.h1Values}
			got := Analyze(raw)
			if got.H1.Count != tc.wantCount {
				t.Errorf("H1.Count = %d, want %d", got.H1.Count, tc.wantCount)
			}
			if got.H1.Value != tc.wantValue {
				t.Errorf("H1.Value = %q, want %q", got.H1.Value, tc.wantValue)
			}
		})
	}
}

func TestAnalyze_TitleLengthScore(t *testing.T) {
	// min=30, max=60 in Analyze
	title45 := strings.Repeat("a", 45)
	raw := OnPageRaw{Title: title45}
	got := Analyze(raw)
	if got.Title.LengthScore != 1.0 {
		t.Errorf("title 45 chars LengthScore = %v, want 1.0", got.Title.LengthScore)
	}
	if got.Title.Value != title45 {
		t.Errorf("Title.Value = %q, want %q", got.Title.Value, title45)
	}
}
