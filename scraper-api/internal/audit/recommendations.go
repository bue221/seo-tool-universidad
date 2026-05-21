package audit

import (
	"fmt"
	"sort"
)

type recommendationCandidate struct {
	Recommendation
	priority int
}

func BuildRecommendations(resp Response) []Recommendation {
	candidates := []recommendationCandidate{}

	if resp.OnPage.Title.LengthScore < 0.8 {
		candidates = append(candidates, recommendationCandidate{
			Recommendation: Recommendation{
				ID:     "title-length",
				Title:  "Improve title length",
				Impact: ImpactHigh,
				Effort: EffortLow,
				Reason: fmt.Sprintf("Current title score is %.2f", resp.OnPage.Title.LengthScore),
			},
			priority: 6,
		})
	}

	if resp.OnPage.MetaDescription.LengthScore < 0.8 {
		candidates = append(candidates, recommendationCandidate{
			Recommendation: Recommendation{
				ID:     "meta-description-length",
				Title:  "Fix meta description length",
				Impact: ImpactHigh,
				Effort: EffortLow,
				Reason: fmt.Sprintf("Current meta description score is %.2f", resp.OnPage.MetaDescription.LengthScore),
			},
			priority: 6,
		})
	}

	if resp.OnPage.H1.Count != 1 {
		candidates = append(candidates, recommendationCandidate{
			Recommendation: Recommendation{
				ID:     "h1-structure",
				Title:  "Use exactly one H1",
				Impact: ImpactMedium,
				Effort: EffortLow,
				Reason: fmt.Sprintf("Found %d H1 tags", resp.OnPage.H1.Count),
			},
			priority: 4,
		})
	}

	if resp.OnPage.Images.AltCoverage < 0.8 {
		candidates = append(candidates, recommendationCandidate{
			Recommendation: Recommendation{
				ID:     "image-alt-coverage",
				Title:  "Increase image alt coverage",
				Impact: ImpactMedium,
				Effort: EffortMedium,
				Reason: fmt.Sprintf("Current alt coverage is %.2f", resp.OnPage.Images.AltCoverage),
			},
			priority: 3,
		})
	}

	if resp.Woorank != nil {
		for _, check := range resp.Woorank.Checks {
			if check.Status == WoorankPass {
				continue
			}
			impact := ImpactMedium
			if check.Weight >= 1.5 {
				impact = ImpactHigh
			}
			effort := EffortMedium
			if check.Category == "meta" || check.Category == "headings" {
				effort = EffortLow
			}

			candidates = append(candidates, recommendationCandidate{
				Recommendation: Recommendation{
					ID:     "woorank-" + check.ID,
					Title:  "Resolve WooRank issue: " + check.Label,
					Impact: impact,
					Effort: effort,
					Reason: check.Evidence,
				},
				priority: int(check.Weight * 2),
			})
		}
	}

	sort.SliceStable(candidates, func(i, j int) bool {
		if candidates[i].priority == candidates[j].priority {
			return candidates[i].ID < candidates[j].ID
		}
		return candidates[i].priority > candidates[j].priority
	})

	out := make([]Recommendation, 0, len(candidates))
	seen := map[string]struct{}{}
	for _, c := range candidates {
		if _, exists := seen[c.ID]; exists {
			continue
		}
		seen[c.ID] = struct{}{}
		out = append(out, c.Recommendation)
		if len(out) >= 12 {
			break
		}
	}

	return out
}
