package audit

func scoreLength(value string, min, max int) float64 {
	l := len(value)
	if l == 0 {
		return 0
	}
	if l >= min && l <= max {
		return 1
	}
	if l < min {
		return float64(l) / float64(min)
	}
	return float64(max) / float64(l)
}

type OnPageRaw struct {
	Title           string
	MetaDescription string
	H1Values        []string
	ImagesTotal     int
	ImagesWithAlt   int
}

func Analyze(raw OnPageRaw) OnPage {
	h1Val := ""
	if len(raw.H1Values) > 0 {
		h1Val = raw.H1Values[0]
	}
	altCoverage := 0.0
	if raw.ImagesTotal > 0 {
		altCoverage = float64(raw.ImagesWithAlt) / float64(raw.ImagesTotal)
	}
	return OnPage{
		Title: ValueScored{Value: raw.Title, LengthScore: scoreLength(raw.Title, 30, 60)},
		MetaDescription: ValueScored{Value: raw.MetaDescription, LengthScore: scoreLength(raw.MetaDescription, 70, 160)},
		H1: H1Info{Count: len(raw.H1Values), Value: h1Val},
		Images: ImagesInfo{Total: raw.ImagesTotal, WithAlt: raw.ImagesWithAlt, AltCoverage: altCoverage},
	}
}
