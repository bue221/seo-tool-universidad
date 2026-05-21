package audit

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

const (
	crawlMaxDepthDefault = 2
	crawlMinPages        = 10
	crawlMaxPages        = 15
)

type crawlConfig struct {
	maxPages int
	maxDepth int
}

type crawlQueueItem struct {
	url   string
	path  string
	depth int
}

func boundedCrawlMaxPages(n int) int {
	if n < crawlMinPages {
		return crawlMinPages
	}
	if n > crawlMaxPages {
		return crawlMaxPages
	}
	return n
}

func buildSiteTree(
	ctx context.Context,
	finalURL string,
	rootDoc *goquery.Document,
	maxPages int,
) (*Crawl, *SiteStructure, error) {
	parsedRoot, err := url.Parse(finalURL)
	if err != nil {
		return nil, nil, err
	}
	if parsedRoot.Scheme == "" || parsedRoot.Host == "" {
		return nil, nil, errors.New("invalid root url")
	}

	cfg := crawlConfig{maxPages: boundedCrawlMaxPages(maxPages), maxDepth: crawlMaxDepthDefault}
	rootPath := normalizePath(parsedRoot.Path)
	rootID := pathID(rootPath)

	nodes := map[string]*SiteNode{
		rootID: {ID: rootID, Label: rootPath, Depth: 0, Children: []string{}},
	}
	visited := map[string]struct{}{normalizedAbsoluteURL(parsedRoot): {}}
	pagesVisited := 1
	truncated := false

	queue := make([]crawlQueueItem, 0, cfg.maxPages)
	for _, child := range extractInternalLinks(rootDoc, parsedRoot, parsedRoot.Host) {
		childID := pathID(child.path)
		_, childKnown := nodes[childID]
		if _, seen := visited[child.absURL]; seen {
			if childKnown {
				addChild(nodes, rootID, child.path, 1)
			}
			continue
		}
		if pagesVisited >= cfg.maxPages {
			truncated = true
			continue
		}
		addChild(nodes, rootID, child.path, 1)
		visited[child.absURL] = struct{}{}
		pagesVisited++
		queue = append(queue, crawlQueueItem{url: child.absURL, path: child.path, depth: 1})
	}

	client := &http.Client{Timeout: 2 * time.Second}

	for len(queue) > 0 {
		item := queue[0]
		queue = queue[1:]
		if item.depth >= cfg.maxDepth {
			continue
		}

		doc, fetchErr := fetchDoc(ctx, client, item.url)
		if fetchErr != nil {
			continue
		}

		pageURL, parseErr := url.Parse(item.url)
		if parseErr != nil {
			continue
		}

		for _, child := range extractInternalLinks(doc, pageURL, parsedRoot.Host) {
			childID := pathID(child.path)
			_, childKnown := nodes[childID]
			if _, seen := visited[child.absURL]; seen {
				if childKnown {
					addChild(nodes, pathID(item.path), child.path, item.depth+1)
				}
				continue
			}
			if pagesVisited >= cfg.maxPages {
				truncated = true
				continue
			}
			addChild(nodes, pathID(item.path), child.path, item.depth+1)
			visited[child.absURL] = struct{}{}
			pagesVisited++
			queue = append(queue, crawlQueueItem{url: child.absURL, path: child.path, depth: item.depth + 1})
		}
	}

	sorted := make([]SiteNode, 0, len(nodes))
	for _, n := range nodes {
		sort.Strings(n.Children)
		sorted = append(sorted, *n)
	}
	sort.Slice(sorted, func(i, j int) bool {
		if sorted[i].Depth == sorted[j].Depth {
			return sorted[i].ID < sorted[j].ID
		}
		return sorted[i].Depth < sorted[j].Depth
	})

	return &Crawl{
		PagesVisited: pagesVisited,
		MaxPages:     cfg.maxPages,
		Truncated:    truncated,
		MaxDepth:     cfg.maxDepth,
	}, &SiteStructure{Root: parsedRoot.Host, Nodes: sorted}, nil
}

type internalLink struct {
	absURL string
	path   string
}

func extractInternalLinks(doc *goquery.Document, base *url.URL, host string) []internalLink {
	out := []internalLink{}
	seen := map[string]struct{}{}

	doc.Find("a[href]").Each(func(_ int, s *goquery.Selection) {
		rawHref, _ := s.Attr("href")
		rawHref = strings.TrimSpace(rawHref)
		if rawHref == "" || strings.HasPrefix(rawHref, "#") || strings.HasPrefix(strings.ToLower(rawHref), "javascript:") {
			return
		}
		ref, err := url.Parse(rawHref)
		if err != nil {
			return
		}
		resolved := base.ResolveReference(ref)
		if !isHTTP(resolved.Scheme) || !sameHost(resolved.Host, host) {
			return
		}

		resolved.Fragment = ""
		resolved.RawQuery = ""
		path := normalizePath(resolved.Path)
		resolved.Path = path
		abs := normalizedAbsoluteURL(resolved)
		if _, ok := seen[abs]; ok {
			return
		}
		seen[abs] = struct{}{}
		out = append(out, internalLink{absURL: abs, path: path})
	})

	return out
}

func addChild(nodes map[string]*SiteNode, parentID string, childPath string, depth int) bool {
	parent, ok := nodes[parentID]
	if !ok {
		return false
	}
	childID := pathID(childPath)
	if _, exists := nodes[childID]; !exists {
		nodes[childID] = &SiteNode{ID: childID, Label: childPath, Depth: depth, Children: []string{}}
	}

	for _, existing := range parent.Children {
		if existing == childID {
			return false
		}
	}
	parent.Children = append(parent.Children, childID)
	return true
}

func fetchDoc(ctx context.Context, client *http.Client, target string) (*goquery.Document, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "seo-custom-tool/crawl")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, io.EOF
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1_000_000))
	if err != nil {
		return nil, err
	}
	return goquery.NewDocumentFromReader(bytes.NewReader(body))
}

func normalizePath(path string) string {
	p := strings.TrimSpace(path)
	if p == "" {
		return "/"
	}
	if !strings.HasPrefix(p, "/") {
		p = "/" + p
	}
	if len(p) > 1 {
		p = strings.TrimRight(p, "/")
	}
	if p == "" {
		return "/"
	}
	return p
}

func pathID(path string) string {
	p := normalizePath(path)
	return p
}

func sameHost(a, b string) bool {
	return strings.EqualFold(stripDefaultPort(a), stripDefaultPort(b))
}

func stripDefaultPort(host string) string {
	if strings.Contains(host, ":") {
		h, _, found := strings.Cut(host, ":")
		if found {
			return h
		}
		return host
	}
	return host
}

func isHTTP(scheme string) bool {
	s := strings.ToLower(scheme)
	return s == "http" || s == "https"
}

func normalizedAbsoluteURL(u *url.URL) string {
	copyURL := *u
	copyURL.Fragment = ""
	copyURL.RawQuery = ""
	copyURL.Path = normalizePath(copyURL.Path)
	return copyURL.String()
}
