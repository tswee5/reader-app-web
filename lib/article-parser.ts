import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface ParsedArticle {
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  date_published?: string;
  lead_image_url?: string;
  domain: string;
  word_count: number;
}

export async function parseArticle(url: string): Promise<ParsedArticle> {
  try {
    // Try direct fetch first
    let html;
    try {
      const response = await fetch(url);
      html = await response.text();
    } catch (error) {
      // If direct fetch fails, try using our proxy
      console.log("Direct fetch failed, trying proxy...");
      const proxyResponse = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      
      const proxyData = await proxyResponse.json();
      if (proxyData.error) {
        throw new Error(proxyData.error);
      }
      
      html = proxyData.html;
    }

    // Parse with JSDOM and Readability
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error("Failed to parse article content");
    }

    // Extract metadata
    const metaTags = dom.window.document.querySelectorAll('meta');
    let excerpt = '';
    let author = '';
    let datePublished = '';
    let leadImageUrl = '';

    metaTags.forEach(meta => {
      const property = meta.getAttribute('property') || meta.getAttribute('name');
      const content = meta.getAttribute('content');

      if (!property || !content) return;

      if (property === 'og:description' || property === 'description') {
        excerpt = content;
      } else if (property === 'og:image' || property === 'twitter:image') {
        leadImageUrl = content;
      } else if (property === 'article:author' || property === 'author') {
        author = content;
      } else if (property === 'article:published_time' || property === 'pubdate') {
        datePublished = content;
      }
    });

    // Count words
    const wordCount = article.textContent.split(/\s+/).filter(Boolean).length;

    // Get domain
    const domain = new URL(url).hostname;

    return {
      title: article.title,
      content: article.content,
      excerpt: excerpt,
      author: author,
      date_published: datePublished,
      lead_image_url: leadImageUrl,
      domain: domain,
      word_count: wordCount,
    };
  } catch (error) {
    console.error("Error parsing article:", error);
    throw new Error("Failed to parse article");
  }
} 