package audit

import (
	"regexp"
	"sort"
	"strings"
)

var tokenRe = regexp.MustCompile(`[\p{L}\p{N}]+`)

var StopWords = map[string]struct{}{
	"de": {}, "la": {}, "y": {}, "el": {}, "the": {}, "and": {}, "to": {}, "for": {}, "of": {}, "a": {},
}

func tokenize(text string) []string {
	matches := tokenRe.FindAllString(strings.ToLower(text), -1)
	out := make([]string, 0, len(matches))
	for _, m := range matches {
		if len(m) < 3 {
			continue
		}
		if _, ok := StopWords[m]; ok {
			continue
		}
		out = append(out, m)
	}
	return out
}

func Top(text string, n int) Keywords {
	tokens := tokenize(text)
	if len(tokens) == 0 {
		return Keywords{Top: []KeywordEntry{}}
	}
	freq := map[string]int{}
	for _, t := range tokens {
		freq[t]++
	}
	type kv struct { k string; v int }
	arr := make([]kv, 0, len(freq))
	for k, v := range freq {
		arr = append(arr, kv{k: k, v: v})
	}
	sort.Slice(arr, func(i, j int) bool { return arr[i].v > arr[j].v })
	if n > len(arr) { n = len(arr) }
	top := make([]KeywordEntry, 0, n)
	total := float64(len(tokens))
	for i := 0; i < n; i++ {
		top = append(top, KeywordEntry{Term: arr[i].k, Density: float64(arr[i].v) / total})
	}
	return Keywords{Top: top}
}
