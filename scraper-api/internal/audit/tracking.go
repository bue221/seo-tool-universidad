package audit

import "regexp"

var (
	gtmRe = regexp.MustCompile(`GTM-[A-Z0-9]+`)
	ga4Re = regexp.MustCompile(`G-[A-Z0-9]+`)
	adsRe = regexp.MustCompile(`AW-[0-9]+`)
)

func dedup(items []string) []string {
	seen := map[string]struct{}{}
	out := make([]string, 0, len(items))
	for _, it := range items {
		if _, ok := seen[it]; ok {
			continue
		}
		seen[it] = struct{}{}
		out = append(out, it)
	}
	return out
}

func Detect(html string) Tracking {
	gtm := dedup(gtmRe.FindAllString(html, -1))
	ga4 := dedup(ga4Re.FindAllString(html, -1))
	ads := dedup(adsRe.FindAllString(html, -1))
	return Tracking{
		GTM: TrackEntry{Detected: len(gtm) > 0, IDs: gtm},
		GA4: TrackEntry{Detected: len(ga4) > 0, IDs: ga4},
		GoogleAds: TrackEntry{Detected: len(ads) > 0, IDs: ads},
	}
}
