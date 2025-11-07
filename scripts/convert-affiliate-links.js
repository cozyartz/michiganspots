#!/usr/bin/env node

/**
 * Script to convert inline Amazon affiliate HTML links to React components
 * Converts: <a href="https://www.amazon.com/dp/ASIN?tag=..." ...>text</a>
 * To: <AmazonAffiliateLink asin="ASIN" text="text" />
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BLOG_DIR = './src/content/blog';

// Regex to match Amazon affiliate links
const AMAZON_LINK_REGEX = /<a\s+href="https:\/\/www\.amazon\.com\/(?:dp|gp\/product)\/([A-Z0-9]+)\?tag=[^"]*"[^>]*>([^<]+)<\/a>/gi;

function convertAffiliateLinks(content) {
  let modified = false;
  
  const converted = content.replace(AMAZON_LINK_REGEX, (match, asin, text) => {
    modified = true;
    // Clean the text of any extra whitespace
    const cleanText = text.trim();
    return `<AmazonAffiliateLink asin="${asin}" text="${cleanText}" />`;
  });

  return { content: converted, modified };
}

function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  const content = readFileSync(filePath, 'utf-8');
  const { content: converted, modified } = convertAffiliateLinks(content);
  
  if (modified) {
    writeFileSync(filePath, converted, 'utf-8');
    console.log(`✅ Updated affiliate links in: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  No affiliate links found in: ${filePath}`);
    return false;
  }
}

function main() {
  console.log('🔗 Converting Amazon affiliate links to React components...\n');
  
  const files = readdirSync(BLOG_DIR)
    .filter(file => file.endsWith('.mdx') || file.endsWith('.md'))
    .map(file => join(BLOG_DIR, file));

  let updatedCount = 0;
  
  for (const file of files) {
    if (processFile(file)) {
      updatedCount++;
    }
  }
  
  console.log(`\n✨ Done! Updated ${updatedCount} file(s).`);
  
  if (updatedCount > 0) {
    console.log('\n⚠️  Remember to add this import to the top of your MDX files:');
    console.log('import { AmazonAffiliateLink } from "../../components/AmazonAffiliateLink";\n');
  }
}

main();
