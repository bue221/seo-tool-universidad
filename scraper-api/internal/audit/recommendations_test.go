package audit

import "testing"

func TestBuildRecommendations_ProducesPrioritizedList(t *testing.T) {
	resp := Response{
		OnPage: OnPage{
			Title:           ValueScored{LengthScore: 0.5},
			MetaDescription: ValueScored{LengthScore: 0.4},
			H1:              H1Info{Count: 0},
			Images:          ImagesInfo{AltCoverage: 0.2},
		},
		Woorank: &WoorankResult{Checks: []WoorankCheck{{
			ID:       "https",
			Label:    "Served over HTTPS",
			Category: "security",
			Status:   WoorankFail,
			Weight:   2,
		}}},
	}

	recs := BuildRecommendations(resp)
	if len(recs) == 0 {
		t.Fatalf("expected recommendations")
	}

	foundTitle := false
	foundMeta := false
	for _, r := range recs {
		if r.ID == "title-length" {
			foundTitle = true
		}
		if r.ID == "meta-description-length" {
			foundMeta = true
		}
	}
	if !foundTitle || !foundMeta {
		t.Fatalf("expected title/meta recommendations, got %#v", recs)
	}
}
