package audit

type Request struct {
	URL string `json:"url"`
}

type ValueScored struct {
	Value       string  `json:"value"`
	LengthScore float64 `json:"lengthScore"`
}

type H1Info struct {
	Count int    `json:"count"`
	Value string `json:"value"`
}

type ImagesInfo struct {
	Total       int     `json:"total"`
	WithAlt     int     `json:"withAlt"`
	AltCoverage float64 `json:"altCoverage"`
}

type OnPage struct {
	Title           ValueScored `json:"title"`
	MetaDescription ValueScored `json:"metaDescription"`
	H1              H1Info      `json:"h1"`
	Images          ImagesInfo  `json:"images"`
}

type TrackEntry struct {
	Detected bool     `json:"detected"`
	IDs      []string `json:"ids"`
}

type Tracking struct {
	GTM       TrackEntry `json:"gtm"`
	GA4       TrackEntry `json:"ga4"`
	GoogleAds TrackEntry `json:"googleAds"`
}

type KeywordEntry struct {
	Term    string  `json:"term"`
	Density float64 `json:"density"`
}

type Keywords struct {
	Top []KeywordEntry `json:"top"`
}

type Sentiment struct {
	Polarity string  `json:"polarity"`
	Score    float64 `json:"score"`
}

// Crawl metadata for bounded internal traversal used by siteStructure.
type Crawl struct {
	PagesVisited int  `json:"pagesVisited"`
	MaxPages     int  `json:"maxPages"`
	Truncated    bool `json:"truncated"`
	MaxDepth     int  `json:"maxDepth"`
}

// Flat node list used by dashboard-web to render a hierarchical tree.
type SiteNode struct {
	ID       string   `json:"id"`
	Label    string   `json:"label"`
	Depth    int      `json:"depth"`
	Children []string `json:"children"`
}

type SiteStructure struct {
	Root  string     `json:"root"`
	Nodes []SiteNode `json:"nodes"`
}

type StageStatus string

const (
	StageStatusOK      StageStatus = "ok"
	StageStatusWarn    StageStatus = "warn"
	StageStatusError   StageStatus = "error"
	StageStatusSkipped StageStatus = "skipped"
)

type StageMetric struct {
	Name       string      `json:"name"`
	Status     StageStatus `json:"status"`
	DurationMs int64       `json:"durationMs"`
	Code       string      `json:"code,omitempty"`
}

type Observability struct {
	Stages          []StageMetric `json:"stages"`
	TotalDurationMs int64         `json:"totalDurationMs"`
}

type RecommendationImpact string

type RecommendationEffort string

const (
	ImpactLow    RecommendationImpact = "low"
	ImpactMedium RecommendationImpact = "medium"
	ImpactHigh   RecommendationImpact = "high"

	EffortLow    RecommendationEffort = "low"
	EffortMedium RecommendationEffort = "medium"
	EffortHigh   RecommendationEffort = "high"
)

type Recommendation struct {
	ID     string               `json:"id"`
	Title  string               `json:"title"`
	Impact RecommendationImpact `json:"impact"`
	Effort RecommendationEffort `json:"effort"`
	Reason string               `json:"reason"`
}

// WooRank-style technical SEO hygiene checks. See openspec/changes/woorank-checker.
type WoorankStatus string

const (
	WoorankPass WoorankStatus = "pass"
	WoorankWarn WoorankStatus = "warn"
	WoorankFail WoorankStatus = "fail"
)

type WoorankCheck struct {
	ID       string        `json:"id"`
	Label    string        `json:"label"`
	Category string        `json:"category"`
	Status   WoorankStatus `json:"status"`
	Evidence string        `json:"evidence,omitempty"`
	Weight   float64       `json:"weight"`
}

type WoorankResult struct {
	Score  float64        `json:"score"`
	Checks []WoorankCheck `json:"checks"`
}

type Response struct {
	URL             string           `json:"url"`
	FetchedAt       string           `json:"fetchedAt"`
	OnPage          OnPage           `json:"onPage"`
	Tracking        Tracking         `json:"tracking"`
	Keywords        Keywords         `json:"keywords"`
	Sentiment       Sentiment        `json:"sentiment"`
	Woorank         *WoorankResult   `json:"woorank,omitempty"`
	Crawl           *Crawl           `json:"crawl,omitempty"`
	SiteStructure   *SiteStructure   `json:"siteStructure,omitempty"`
	Observability   *Observability   `json:"observability,omitempty"`
	Recommendations []Recommendation `json:"recommendations,omitempty"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
