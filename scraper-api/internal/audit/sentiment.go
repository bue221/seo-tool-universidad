package audit

var Positives = map[string]struct{}{"good": {}, "excelente": {}, "great": {}, "rápido": {}}
var Negatives = map[string]struct{}{"bad": {}, "lento": {}, "poor": {}, "error": {}}

func Score(tokens []string) Sentiment {
	if len(tokens) == 0 {
		return Sentiment{Polarity: "neutral", Score: 0}
	}
	pos, neg := 0, 0
	for _, t := range tokens {
		if _, ok := Positives[t]; ok {
			pos++
		}
		if _, ok := Negatives[t]; ok {
			neg++
		}
	}
	total := pos + neg
	if total == 0 {
		return Sentiment{Polarity: "neutral", Score: 0}
	}
	s := float64(pos-neg) / float64(total)
	polarity := "neutral"
	if s > 0.2 {
		polarity = "positive"
	} else if s < -0.2 {
		polarity = "negative"
	}
	return Sentiment{Polarity: polarity, Score: s}
}
