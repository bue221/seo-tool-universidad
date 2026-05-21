package audit

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/PuerkitoBio/goquery"
)

func TestBoundedCrawlMaxPages(t *testing.T) {
	if got := boundedCrawlMaxPages(2); got != 10 {
		t.Fatalf("min bound failed: got %d", got)
	}
	if got := boundedCrawlMaxPages(15); got != 15 {
		t.Fatalf("keep bound failed: got %d", got)
	}
	if got := boundedCrawlMaxPages(99); got != 15 {
		t.Fatalf("max bound failed: got %d", got)
	}
}

func TestBuildSiteTree_TruncatesAtMaxPages(t *testing.T) {
	handler := http.NewServeMux()
	handler.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		links := make([]string, 0, 20)
		for i := 1; i <= 20; i++ {
			links = append(links, fmt.Sprintf(`<a href="/p%d">p%d</a>`, i, i))
		}
		_, _ = w.Write([]byte("<html><body>" + strings.Join(links, "") + "</body></html>"))
	})
	for i := 1; i <= 20; i++ {
		path := fmt.Sprintf("/p%d", i)
		handler.HandleFunc(path, func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte("<html><body>ok</body></html>"))
		})
	}
	server := httptest.NewServer(handler)
	defer server.Close()

	rootDoc, err := goquery.NewDocumentFromReader(strings.NewReader(`<html><body>` +
		strings.Repeat(`<a href="/p1">p1</a>`, 1) +
		`<a href="/p2">p2</a><a href="/p3">p3</a><a href="/p4">p4</a><a href="/p5">p5</a><a href="/p6">p6</a><a href="/p7">p7</a><a href="/p8">p8</a><a href="/p9">p9</a><a href="/p10">p10</a><a href="/p11">p11</a><a href="/p12">p12</a><a href="/p13">p13</a><a href="/p14">p14</a><a href="/p15">p15</a><a href="/p16">p16</a><a href="/p17">p17</a><a href="/p18">p18</a><a href="/p19">p19</a><a href="/p20">p20</a></body></html>`))
	if err != nil {
		t.Fatalf("doc parse: %v", err)
	}

	crawl, structure, err := buildSiteTree(context.Background(), server.URL, rootDoc, 15)
	if err != nil {
		t.Fatalf("buildSiteTree: %v", err)
	}
	if crawl.PagesVisited != 15 {
		t.Fatalf("pagesVisited=%d want 15", crawl.PagesVisited)
	}
	if !crawl.Truncated {
		t.Fatalf("expected truncated=true")
	}
	if len(structure.Nodes) > 15 {
		t.Fatalf("nodes=%d should be <=15", len(structure.Nodes))
	}
}
