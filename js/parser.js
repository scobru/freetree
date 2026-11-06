/**
 * Freetree Delta Markdown Parser
 * Parses Delta link list pages and extracts sections, link pills, and smart icons.
 */

import { ICONS } from './icons.js';

/**
 * Classifies an item into an icon key based on title, url, and description text.
 */
export function classifyIcon(title = '', url = '', description = '') {
  const text = `${title} ${url} ${description}`.toLowerCase();

  if (text.includes('delta')) return 'delta';
  if (text.includes('tunecamp') || text.includes('freetunes') || text.includes('delia') || 
      text.includes('sound') || text.includes('sintesi') || text.includes('audio') || 
      text.includes('music') || text.includes('groovebox') || text.includes('synth')) {
    if (text.includes('tape') || text.includes('nastro') || text.includes('delia')) return 'tape';
    return 'audio';
  }
  if (text.includes('river') || text.includes('comm') || text.includes('freenet') || 
      text.includes('atlas') || text.includes('p2p') || text.includes('peer')) return 'freenet';
  if (text.includes('radica') || text.includes('chat') || text.includes('timeline') || 
      text.includes('message')) return 'chat';
  if (text.includes('blog') || text.includes('orto') || text.includes('foldpress') || 
      text.includes('writing') || text.includes('pensieri') || text.includes('note')) return 'blog';
  if (text.includes('code') || text.includes('git') || text.includes('github') || 
      text.includes('docker') || text.includes('open-source') || text.includes('repo')) return 'code';
  if (text.includes('arcade') || text.includes('game') || text.includes('flash') || 
      text.includes('distant worlds') || text.includes('backgammon') || text.includes('asocial')) return 'game';
  if (text.includes('pixie') || text.includes('photo') || text.includes('image') || text.includes('camera')) return 'photo';
  if (text.includes('whoiam') || text.includes('ante') || text.includes('viso') || 
      text.includes('freenames') || text.includes('identity')) return 'identity';
  if (text.includes('mecenate') || text.includes('market') || text.includes('swap') || 
      text.includes('wallet') || text.includes('privacy marketplace')) return 'market';
  if (text.includes('poll') || text.includes('freepolls') || text.includes('vote')) return 'poll';
  if (text.includes('freefold') || text.includes('archive') || text.includes('folder')) return 'folder';

  return 'link';
}

/**
 * Normalizes link URLs.
 * Handles relative Freenet contract paths, Delta internal hashes, and external links.
 */
export function normalizeUrl(rawUrl, deltaSitePrefix = '') {
  let url = (rawUrl || '').trim();

  // If internal Delta link like #prefix or [[page_id]]
  if (url.startsWith('#')) {
    // Local hash
    return url;
  }

  // Delta wiki link pattern
  if (url.startsWith('[[') && url.endsWith(']]')) {
    const inner = url.slice(2, -2);
    const parts = inner.split('|');
    const pageId = parts[0];
    return deltaSitePrefix ? `#${deltaSitePrefix}/${pageId}` : `#${pageId}`;
  }

  // Freenet protocol prefix
  if (url.startsWith('freenet:')) {
    const key = url.replace('freenet:', '');
    return `/v1/contract/web/${key}/`;
  }

  return url;
}

/**
 * Parse Delta Markdown into structured data:
 * {
 *   title: string,
 *   sections: [
 *     {
 *       heading: string | null,
 *       items: [
 *         { title, url, description, iconKey }
 *       ]
 *     }
 *   ]
 * }
 */
export function parseDeltaMarkdown(markdownText, deltaSitePrefix = '') {
  if (!markdownText) {
    return { title: '', sections: [] };
  }

  const lines = markdownText.split(/\r?\n/);
  const sections = [];
  let currentSection = {
    heading: null,
    items: []
  };

  let pageTitle = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    // Check for Main Page Title (# Title) if not found yet
    if (trimmed.startsWith('# ') && !pageTitle) {
      pageTitle = trimmed.replace(/^#\s+/, '').trim();
      continue;
    }

    // Check for Section Header (## Section or ### Section or # Section if pageTitle already exists)
    const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      const headingText = headerMatch[2].trim();
      // If we already have items in current section, push it
      if (currentSection.items.length > 0 || currentSection.heading !== null) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: headingText,
        items: []
      };
      continue;
    }

    // Check for Bullet Link items:
    // Pattern 1: * [Title](URL) - Description
    // Pattern 2: * [Title](URL)
    // Pattern 3: - [Title](URL) — Description
    // Pattern 4: [[page_id|Title]]
    const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (bulletMatch) {
      const content = bulletMatch[1].trim();

      // Match markdown link: [Title](URL) with optional separator (- : — –) and description
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)(?:\s*(?:[-—–:]|--)\s*(.+))?$/;
      const match = content.match(linkRegex);

      if (match) {
        const title = match[1].trim();
        const rawUrl = match[2].trim();
        const description = (match[3] || '').trim();
        const url = normalizeUrl(rawUrl, deltaSitePrefix);
        const iconKey = classifyIcon(title, url, description);

        currentSection.items.push({
          title,
          url,
          description,
          iconKey
        });
        continue;
      }

      // Check for Delta wiki link: [[page_id|Title]] or [[page_id]]
      const wikiMatch = content.match(/^\[\[([^|\]]+)(?:\|([^\]]+))?\]\](?:\s*(?:[-—–:]|--)\s*(.+))?$/);
      if (wikiMatch) {
        const pageId = wikiMatch[1].trim();
        const title = (wikiMatch[2] || pageId).trim();
        const description = (wikiMatch[3] || '').trim();
        const url = deltaSitePrefix ? `#${deltaSitePrefix}/${pageId}` : `#${pageId}`;
        const iconKey = classifyIcon(title, url, description);

        currentSection.items.push({
          title,
          url,
          description,
          iconKey
        });
        continue;
      }

      // Fallback for bullet containing just a URL or plain text
      const bareUrlMatch = content.match(/^(https?:\/\/[^\s]+|freenet:[^\s]+|\/v1\/contract\/[^\s]+)(?:\s*(?:[-—–:]|--)\s*(.+))?$/);
      if (bareUrlMatch) {
        const rawUrl = bareUrlMatch[1].trim();
        const description = (bareUrlMatch[2] || '').trim();
        const title = description || rawUrl;
        const url = normalizeUrl(rawUrl, deltaSitePrefix);
        const iconKey = classifyIcon(title, url, description);

        currentSection.items.push({
          title,
          url,
          description,
          iconKey
        });
        continue;
      }
    }

    // Check for Markdown link: [Title](URL) anywhere on line (even without bullet)
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)(?:\s*(?:[-—–:]|--)\s*(.+))?/;
    const mdMatch = trimmed.match(mdLinkRegex);
    if (mdMatch) {
      const title = mdMatch[1].trim();
      const rawUrl = mdMatch[2].trim();
      let description = (mdMatch[3] || '').trim();
      if (!description) {
        const prefixText = trimmed.slice(0, mdMatch.index).replace(/^[-*+]\s+/, '').trim();
        if (prefixText) description = prefixText;
      }
      const url = normalizeUrl(rawUrl, deltaSitePrefix);
      const iconKey = classifyIcon(title, url, description);

      currentSection.items.push({
        title,
        url,
        description,
        iconKey
      });
      continue;
    }

    // Crypto address check (ETH, BTC, ZCASH, SOL, USDC)
    const cryptoMatch = trimmed.match(/^(ETH|BTC|ZCASH|SOL|USDC):\s*([a-zA-Z0-9]+)/i);
    if (cryptoMatch) {
      const coin = cryptoMatch[1].toUpperCase();
      const address = cryptoMatch[2];
      currentSection.items.push({
        title: `${coin} Donation`,
        url: `#copy:${address}`,
        description: address,
        iconKey: 'market'
      });
      continue;
    }
  }

  // Push last section if it has items
  if (currentSection.items.length > 0 || currentSection.heading !== null) {
    sections.push(currentSection);
  }

  return {
    title: pageTitle || 'Links',
    sections
  };
}

/**
 * Render structured parsed data to HTML Linktree format
 */
export function renderLinktreeHtml(parsedData) {
  if (!parsedData || !parsedData.sections || parsedData.sections.length === 0) {
    return `
      <div class="empty-state">
        ${ICONS.link}
        <p>Nessun link trovato in questa pagina Delta.</p>
      </div>
    `;
  }

  let html = '';

  for (const section of parsedData.sections) {
    if (section.heading) {
      html += `
        <div class="section-divider">
          // ${escapeHtml(section.heading.toLowerCase())}
        </div>
      `;
    }

    for (const item of section.items) {
      const iconSvg = ICONS[item.iconKey] || ICONS.link;
      const hasDescription = Boolean(item.description);

      // We determine target="_blank" unless it's an internal hash navigation
      const isInternal = item.url.startsWith('#');
      const targetAttr = isInternal ? '' : 'target="_blank" rel="noopener noreferrer"';

      html += `
        <a class="link-pill" href="${escapeHtml(item.url)}" ${targetAttr} data-url="${escapeHtml(item.url)}">
          <div class="pill-thumb" title="${escapeHtml(item.title)}">
            ${iconSvg}
          </div>
          <div class="pill-content">
            <span class="pill-phrase">${escapeHtml(item.title)}</span>
            ${hasDescription ? `<span class="pill-subtext">${escapeHtml(item.description)}</span>` : ''}
          </div>
          <button class="pill-dots" type="button" data-copy="${escapeHtml(item.url)}" title="Copia link" aria-label="Copia link">
            &#8942;
          </button>
        </a>
      `;
    }
  }

  return html;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

