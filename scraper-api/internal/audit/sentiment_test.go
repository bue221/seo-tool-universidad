package audit

import "testing"

func TestScore(t *testing.T) {
	s := Score([]string{"good", "great", "bad"})
	if s.Polarity != "positive" {
		t.Fatalf("expected positive, got %s", s.Polarity)
	}
}
