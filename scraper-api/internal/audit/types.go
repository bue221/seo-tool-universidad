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

type Response struct {
	URL       string    `json:"url"`
	FetchedAt string    `json:"fetchedAt"`
	OnPage    OnPage    `json:"onPage"`
	Tracking  Tracking  `json:"tracking"`
	Keywords  Keywords  `json:"keywords"`
	Sentiment Sentiment `json:"sentiment"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
