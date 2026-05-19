package audit

import "testing"

func TestDetect(t *testing.T) {
	html := `<script>GTM-AAAA</script><script>G-1234</script><script>AW-123456</script>`
	tr := Detect(html)
	if !tr.GTM.Detected || !tr.GA4.Detected || !tr.GoogleAds.Detected {
		t.Fatal("expected all trackers detected")
	}
}
