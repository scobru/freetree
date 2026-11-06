/**
 * Freetree — All-in-One Classic Bundle
 * 100% self-contained, no ES modules / no CORS requirements.
 * Fully compatible with Freenet gateway sandboxed iframes (origin: null).
 */
(function () {
  'use strict';

  // =========================================================================
  // 1. ICONS
  // =========================================================================
  const ICONS = {
    brand: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"
              stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>
      </svg>
    `,
    delta: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3L2 21h20L12 3zm0 4.5L18.5 19h-13L12 7.5z" fill="currentColor"/>
      </svg>
    `,
    freenet: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="5" r="3" fill="currentColor"/>
        <circle cx="5" cy="17" r="3" fill="currentColor"/>
        <circle cx="19" cy="17" r="3" fill="currentColor"/>
        <path d="M12 8v5M7 15.5l3.5-2M17 15.5l-3.5-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
    audio: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
      </svg>
    `,
    tape: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10c0-1.66 1.34-3 3-3s3 1.34 3 3c0 .35-.07.69-.18 1h.36c-.11-.31-.18-.65-.18-1 0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3h-6c-1.66 0-3-1.34-3-3zm3 1.5c.83 0 1.5-.67 1.5-1.5S9.83 8.5 9 8.5 7.5 9.17 7.5 10s.67 1.5 1.5 1.5zm6 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" fill="currentColor"/>
      </svg>
    `,
    blog: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
      </svg>
    `,
    chat: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6v-2h12v2zm0-3H6V7h12v2z" fill="currentColor"/>
      </svg>
    `,
    code: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" fill="currentColor"/>
      </svg>
    `,
    game: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor"/>
      </svg>
    `,
    photo: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/>
      </svg>
    `,
    identity: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
      </svg>
    `,
    market: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" fill="currentColor"/>
      </svg>
    `,
    poll: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor"/>
      </svg>
    `,
    folder: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" fill="currentColor"/>
      </svg>
    `,
    link: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="currentColor"/>
      </svg>
    `,
    share: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" fill="currentColor"/>
      </svg>
    `,
    edit: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
      </svg>
    `,
    check: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
      </svg>
    `,
    sun: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.28 14.7l1.79 1.79 1.41-1.41-1.79-1.79-1.41 1.41zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1 4.5h2v2.95h-2V20zm-7.45-.96l1.41 1.41 1.79-1.79-1.41-1.41-1.79 1.79z" fill="currentColor"/>
      </svg>
    `,
    moon: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor"/>
      </svg>
    `
  };

  // =========================================================================
  // 2. PARSER & HELPER
  // =========================================================================
  function classifyIcon(title, url, description) {
    const text = `${title || ''} ${url || ''} ${description || ''}`.toLowerCase();

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

  function normalizeUrl(rawUrl, deltaSitePrefix) {
    let url = (rawUrl || '').trim();
    if (url.startsWith('#')) return url;
    if (url.startsWith('[[') && url.endsWith(']]')) {
      const inner = url.slice(2, -2);
      const parts = inner.split('|');
      const pageId = parts[0];
      return deltaSitePrefix ? `#${deltaSitePrefix}/${pageId}` : `#${pageId}`;
    }
    if (url.startsWith('freenet:')) {
      const key = url.replace('freenet:', '');
      return `/v1/contract/web/${key}/`;
    }
    return url;
  }

  function parseDeltaMarkdown(markdownText, deltaSitePrefix) {
    if (!markdownText) return { title: '', sections: [] };

    const lines = markdownText.split(/\r?\n/);
    let pageTitle = '';

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('# ') && !pageTitle) {
        pageTitle = trimmed.replace(/^#\s+/, '').trim();
        break;
      }
    }

    const hasBullets = lines.some(l => /^[-*+]\s+/.test(l.trim()));

    if (hasBullets) {
      const sections = [];
      let currentSection = { heading: null, items: [] };

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('# ') && !pageTitle) {
          pageTitle = trimmed.replace(/^#\s+/, '').trim();
          continue;
        }

        const headerMatch = trimmed.match(/^(#{2,4})\s+(.+)$/);
        if (headerMatch) {
          if (currentSection.items.length > 0 || currentSection.heading !== null) {
            sections.push(currentSection);
          }
          currentSection = { heading: headerMatch[2].trim(), items: [] };
          continue;
        }

        const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
        if (bulletMatch) {
          const content = bulletMatch[1].trim();
          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)(?:\s*(?:[-—–:]|--)\s*(.+))?$/;
          const match = content.match(linkRegex);
          if (match) {
            const title = match[1].trim();
            const rawUrl = match[2].trim();
            const description = (match[3] || '').trim();
            const url = normalizeUrl(rawUrl, deltaSitePrefix);
            const iconKey = classifyIcon(title, url, description);
            currentSection.items.push({ title, url, description, iconKey });
            continue;
          }

          const wikiMatch = content.match(/^\[\[([^|\]]+)(?:\|([^\]]+))?\]\](?:\s*(?:[-—–:]|--)\s*(.+))?$/);
          if (wikiMatch) {
            const pageId = wikiMatch[1].trim();
            const title = (wikiMatch[2] || pageId).trim();
            const description = (wikiMatch[3] || '').trim();
            const url = deltaSitePrefix ? `#${deltaSitePrefix}/${pageId}` : `#${pageId}`;
            const iconKey = classifyIcon(title, url, description);
            currentSection.items.push({ title, url, description, iconKey });
            continue;
          }

          const bareUrlMatch = content.match(/^(https?:\/\/[^\s]+|freenet:[^\s]+|\/v1\/contract\/[^\s]+)(?:\s*(?:[-—–:]|--)\s*(.+))?$/);
          if (bareUrlMatch) {
            const rawUrl = bareUrlMatch[1].trim();
            const description = (bareUrlMatch[2] || '').trim();
            const title = description || rawUrl;
            const url = normalizeUrl(rawUrl, deltaSitePrefix);
            const iconKey = classifyIcon(title, url, description);
            currentSection.items.push({ title, url, description, iconKey });
            continue;
          }
        }
      }

      if (currentSection.items.length > 0 || currentSection.heading !== null) {
        sections.push(currentSection);
      }
      return { title: pageTitle || 'Links', sections };
    }

    // Non-bullet format: '## Heading' + text + URL (like Projects on Freenet) or Prose with URLs & Crypto (like Hi)
    const sections = [];
    let currentSection = { heading: null, items: [] };
    let pendingItem = null;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('# ') && !pageTitle) {
        pageTitle = trimmed.replace(/^#\s+/, '').trim();
        continue;
      }

      // Heading 2-4: ## Heading (e.g. ## Radica)
      const headerMatch = trimmed.match(/^(#{2,4})\s+(.+)$/);
      if (headerMatch) {
        if (pendingItem && pendingItem.url) {
          currentSection.items.push(pendingItem);
        }
        pendingItem = {
          title: headerMatch[2].trim(),
          description: '',
          url: '',
          iconKey: classifyIcon(headerMatch[2].trim(), '', '')
        };
        continue;
      }

      // Check for Markdown link: [Title](URL) in prose or bullet (e.g. Check my favourite link list on [Fisherman's Horizon](http://...))
      const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)(?:\s*(?:[-—–:]|--)\s*(.+))?/;
      const mdMatch = trimmed.match(mdLinkRegex);
      if (mdMatch) {
        if (pendingItem && pendingItem.url) {
          currentSection.items.push(pendingItem);
        }
        pendingItem = null;

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
        if (pendingItem && pendingItem.url) {
          currentSection.items.push(pendingItem);
          pendingItem = null;
        }
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

      // FreeMail / P2P Email key check
      const emailMatch = trimmed.match(/(?:email|contact|scrivimi).*?([1-9A-HJ-NP-Za-km-z]{40,55})/i);
      if (emailMatch) {
        const key = emailMatch[1];
        currentSection.items.push({
          title: 'FreeMail (P2P)',
          url: `#copy:${key}`,
          description: `${key.slice(0, 10)}...${key.slice(-8)} (Click to copy address)`,
          iconKey: 'chat'
        });
      }

      // URL matching (supports multiple URLs on the same line)
      const urlRegex = /https?:\/\/[^\s)"]+/gi;
      const urlsOnLine = [];
      let match;
      while ((match = urlRegex.exec(trimmed)) !== null) {
        urlsOnLine.push(match[0].replace(/[.,;:]+$/, ''));
      }

      if (urlsOnLine.length > 0) {
        for (const rawUrl of urlsOnLine) {
          const url = normalizeUrl(rawUrl, deltaSitePrefix);

          if (pendingItem && !pendingItem.url) {
            pendingItem.url = url;
            pendingItem.iconKey = classifyIcon(pendingItem.title, url, pendingItem.description);
            currentSection.items.push(pendingItem);
            pendingItem = null;
          } else {
            let label = '';
            let desc = '';
            let iconKey = classifyIcon('', url, '');

            if (url.includes('scobrudot.dev')) {
              label = 'scobrudot.dev';
              desc = 'Personal site & blog';
              iconKey = 'blog';
            } else if (url.includes('/projects') || url.includes('#7jKW1CQj7R/3')) {
              label = 'Projects on Freenet';
              desc = 'All decentralized projects on Delta';
              iconKey = 'code';
            } else if (url.includes('Ex88TLL48HQPA6CuYQuhc2zKFjcEdUeHbreNBrfVL2Sw') || trimmed.toLowerCase().includes('radica')) {
              label = 'Radica';
              desc = 'Decentralized social media experiment';
              iconKey = 'chat';
            } else if (url.includes('buymeacoffee.com')) {
              label = 'Buy Me a Coffee';
              desc = 'Support open-source development';
              iconKey = 'market';
            } else {
              try {
                const parsed = new URL(url);
                label = parsed.hostname.replace('www.', '');
                if (parsed.pathname && parsed.pathname !== '/') {
                  const parts = parsed.pathname.split('/').filter(Boolean);
                  if (parts.length > 0) label += ` / ${parts[parts.length - 1]}`;
                }
              } catch {
                label = url;
              }
            }

            currentSection.items.push({
              title: label,
              url: url,
              description: desc,
              iconKey
            });
          }
        }
        continue;
      }

      // Plain text line: description for pending item
      if (pendingItem && !pendingItem.url) {
        pendingItem.description = pendingItem.description ? (pendingItem.description + ' ' + trimmed) : trimmed;
      }
    }

    if (pendingItem && pendingItem.url) {
      currentSection.items.push(pendingItem);
    }

    if (currentSection.items.length > 0) {
      sections.push(currentSection);
    }

    return { title: pageTitle || 'Links', sections };
  }

  function renderLinktreeHtml(parsedData) {
    if (!parsedData || !parsedData.sections || parsedData.sections.length === 0) {
      return `
        <div class="empty-state">
          ${ICONS.link}
          <p>No links found on this Delta page.</p>
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
        const isCopy = item.url.startsWith('#copy:');
        const copyPayload = isCopy ? item.url.slice(6) : item.url;
        const iconSvg = ICONS[item.iconKey] || ICONS.link;
        const hasDescription = Boolean(item.description);
        const isInternal = item.url.startsWith('#') && !isCopy;
        const href = isCopy ? '#' : escapeHtml(item.url);
        const targetAttr = (isInternal || isCopy) ? '' : 'target="_blank" rel="noopener noreferrer"';
        const copyAttr = isCopy ? `data-copy="${escapeHtml(copyPayload)}"` : '';

        html += `
          <a class="link-pill ${isCopy ? 'is-copy-pill' : ''}" href="${href}" ${targetAttr} ${copyAttr} data-url="${escapeHtml(item.url)}">
            <div class="pill-thumb" title="${escapeHtml(item.title)}">
              ${iconSvg}
            </div>
            <div class="pill-content">
              <span class="pill-phrase">${escapeHtml(item.title)}</span>
              ${hasDescription ? `<span class="pill-subtext">${escapeHtml(item.description)}</span>` : ''}
            </div>
            <button class="pill-dots" type="button" data-copy="${escapeHtml(copyPayload)}" title="Copy ${isCopy ? 'address' : 'link'}" aria-label="Copy link">
              ${isCopy ? '📋' : '&#8942;'}
            </button>
          </a>
        `;
      }
    }

    return html;
  }

  /**
   * Returns true if a markdown page contains at least one actionable link or crypto address.
   */
  function pageHasLinks(markdownText, deltaSitePrefix) {
    if (!markdownText || !markdownText.trim()) return false;
    const parsed = parseDeltaMarkdown(markdownText, deltaSitePrefix);
    if (!parsed || !parsed.sections) return false;
    return parsed.sections.some(s => s.items && s.items.length > 0);
  }

  /**
   * Filters a pages map ({ [title]: markdown }) to keep only pages with links.
   * If no page has links, falls back to original pages.
   */
  function filterPagesWithLinks(pages, deltaSitePrefix) {
    if (!pages) return {};
    const filtered = {};
    for (const [title, content] of Object.entries(pages)) {
      if (pageHasLinks(content, deltaSitePrefix)) {
        filtered[title] = content;
      }
    }
    return Object.keys(filtered).length > 0 ? filtered : pages;
  }

  function matchPage(availablePages, target) {
    if (!target) return null;
    const cleanTarget = target.toLowerCase().trim();
    const targetSlug = cleanTarget.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // 1. Direct match or exact slug match
    for (const page of availablePages) {
      if (page.toLowerCase() === cleanTarget) return page;
      const pageSlug = page.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (pageSlug === targetSlug || pageSlug === cleanTarget) return page;
    }

    // 2. Numeric page ID (1-based: "1" -> 1st page, "2" -> 2nd page)
    if (/^\d+$/.test(cleanTarget)) {
      const idx = parseInt(cleanTarget, 10) - 1;
      if (idx >= 0 && idx < availablePages.length) {
        return availablePages[idx];
      }
    }

    // 3. Substring / keyword match (e.g. "projects" matches "Projects on freenet")
    for (const page of availablePages) {
      const pageLower = page.toLowerCase();
      if (pageLower.includes(cleanTarget) || cleanTarget.includes(pageLower)) {
        return page;
      }
    }

    return null;
  }

  /**
   * Intelligently extracts Delta prefix (10 base58 chars) and optional page name from any input:
   * e.g. "http://127.0.0.1:7509/v1/contract/web/EqJ5.../#7jEk1CQj7R" -> "7jEk1CQj7R"
   * e.g. "http://.../#AnCVD9ZD3U/1/freesite-links" -> prefix "AnCVD9ZD3U", page "freesite-links"
   * e.g. "#7jEk1CQj7R" -> "7jEk1CQj7R"
   * e.g. "7jEk1CQj7R" -> "7jEk1CQj7R"
   */
  function extractDeltaPrefixAndPage(input) {
    if (!input) return { prefix: '', page: null };
    const str = input.trim();

    // Pattern 1: URL with hash e.g. #7jEk1CQj7R or #AnCVD9ZD3U/1/freesite-links
    const hashMatch = str.match(/#\/?([1-9A-HJ-NP-Za-km-z]{10})(?:\/(.+))?/);
    if (hashMatch) {
      let pageCandidate = null;
      if (hashMatch[2]) {
        const subParts = hashMatch[2].split('/').map(p => decodeURIComponent(p.trim())).filter(Boolean);
        // If there are multiple parts like ["1", "links"], the last part is the slug/title
        pageCandidate = subParts[subParts.length - 1] || subParts[0] || null;
      }
      return {
        prefix: hashMatch[1],
        page: pageCandidate
      };
    }

    // Pattern 2: Bare 10-char base58 prefix
    const bareMatch = str.match(/^[1-9A-HJ-NP-Za-km-z]{10}$/);
    if (bareMatch) {
      return { prefix: bareMatch[0], page: null };
    }

    // Pattern 3: Look for any 10-char base58 sequence
    const anyMatch = str.match(/([1-9A-HJ-NP-Za-km-z]{10})/);
    if (anyMatch) {
      return { prefix: anyMatch[1], page: null };
    }

    return { prefix: str, page: null };
  }

  // =========================================================================
  // 3. DELTA CONTRACT REGISTRY & CACHE (DYNAMIC ONLY - NO HARDCODED PRESETS)
  // =========================================================================
  const PRESETS = {};

  // Helper functions to serialize / deserialize custom created Linktree into shareable URL hash
  function encodeCustomData(siteData, activePage) {
    try {
      const payload = {
        p: siteData.prefix || 'custom',
        n: siteData.name || 'Linktree',
        h: siteData.handle || '@linktree',
        b: siteData.bio || '',
        pages: siteData.pages || {},
        a: activePage || 'Links'
      };
      const json = JSON.stringify(payload);
      const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));
      return `data=${encodeURIComponent(b64)}`;
    } catch (e) {
      return siteData.prefix || '';
    }
  }

  function decodeCustomData(hash) {
    try {
      const match = hash.match(/^data=(.+)$/);
      if (!match) return null;
      const b64 = decodeURIComponent(match[1]);
      const bin = atob(b64);
      const json = decodeURIComponent(Array.prototype.map.call(bin, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      const parsed = JSON.parse(json);
      return {
        prefix: parsed.p || 'custom',
        name: parsed.n || 'Delta Site',
        handle: parsed.h || '@custom',
        bio: parsed.b || '',
        avatar: null,
        pages: parsed.pages || {},
        activePage: parsed.a || Object.keys(parsed.pages || {})[0] || 'Links'
      };
    } catch (e) {
      return null;
    }
  }

  // =========================================================================
  // 4. STORAGE & THEME HELPER
  // =========================================================================
  const safeStorage = {
    getItem(key) {
      try {
        return window.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        window.localStorage?.setItem(key, value);
      } catch {}
    }
  };

  function getInitialTheme() {
    const saved = safeStorage.getItem('freetree_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  }

  // =========================================================================
  // 5. APPLICATION CONTROLLER
  // =========================================================================
  class FreetreeApp {
    constructor() {
      this.currentPresetKey = null;
      this.siteData = null;
      this.activePageTitle = null;
      this.isCustomData = false;
      this.theme = getInitialTheme();

      this.initElements();
      this.initTheme();
      this.initEventListeners();
      this.handleRoute();
      this.updateNodeStatus('ready');
    }

    initElements() {
      this.el = {
        themeBtn: document.getElementById('theme-btn'),
        themeBtnText: document.getElementById('theme-btn-text'),
        shareBtn: document.getElementById('share-profile-btn'),
        exportBtn: document.getElementById('export-link-btn'),
        cardExportBtn: document.getElementById('card-export-btn'),
        brandLogoBtn: document.getElementById('brand-logo-btn'),
        editBtn: document.getElementById('edit-site-btn'),
        openLoadBtn: document.querySelector('[data-action="open-load"]'),
        nodeStatus: document.getElementById('node-status-badge'),
        statusDot: document.getElementById('node-status-dot'),
        statusText: document.getElementById('node-status-text'),
        
        presetBtns: document.querySelectorAll('[data-preset]'),
        
        avatarImg: document.getElementById('profile-avatar-img'),
        avatarFallback: document.getElementById('profile-avatar-fallback'),
        handle: document.getElementById('profile-handle'),
        bio: document.getElementById('profile-bio'),
        deltaBadge: document.getElementById('delta-prefix-badge'),
        pageTabs: document.getElementById('page-tabs'),
        linksList: document.getElementById('links-list'),
        
        toast: document.getElementById('toast'),
        toastText: document.getElementById('toast-text'),
        
        modal: document.getElementById('editor-modal-backdrop'),
        closeModalBtn: document.getElementById('modal-close-btn'),
        modalUrlInput: document.getElementById('modal-url-input'),
        modalLoadBtn: document.getElementById('modal-load-btn'),
        modalTitleInput: document.getElementById('modal-title-input'),
        modalBioInput: document.getElementById('modal-bio-input'),
        modalMarkdownInput: document.getElementById('modal-markdown-input'),
        modalApplyBtn: document.getElementById('modal-apply-btn'),

        exportModal: document.getElementById('export-modal-backdrop'),
        closeExportModalBtn: document.getElementById('export-modal-close-btn'),
        exportUrlInput: document.getElementById('export-url-input'),
        copyExportUrlBtn: document.getElementById('copy-export-url-btn'),
        exportMarkdownInput: document.getElementById('export-markdown-input'),
        copyExportMarkdownBtn: document.getElementById('copy-export-markdown-btn'),
        testExportLinkBtn: document.getElementById('test-export-link-btn'),
        exportDoneBtn: document.getElementById('export-done-btn')
      };
    }

    initTheme() {
      document.documentElement.setAttribute('data-theme', this.theme);
      this.updateThemeUi();
    }

    updateThemeUi() {
      if (this.el.themeBtnText) {
        this.el.themeBtnText.textContent = this.theme === 'dark' ? '[ light ]' : '[ dark ]';
      }
    }

    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', this.theme);
      safeStorage.setItem('freetree_theme', this.theme);
      this.updateThemeUi();
    }

    updateNodeStatus(status) {
      if (!this.el.statusDot || !this.el.statusText) return;

      this.el.statusDot.className = 'status-dot';
      if (status === 'connected') {
        this.el.statusText.textContent = 'Freenet: Connected';
      } else {
        this.el.statusText.textContent = 'Freenet: Active';
      }
    }

    initEventListeners() {
      // Theme toggle
      this.el.themeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleTheme();
      });

      // Reset to empty state via logo
      this.el.brandLogoBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        try { window.location.hash = ''; } catch {}
        this.loadEmptyState();
      });

      // Export profile via link
      this.el.exportBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.openExportModal();
      });

      this.el.shareBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.openExportModal();
      });

      this.el.cardExportBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.openExportModal();
      });

      // Close export modal
      this.el.closeExportModalBtn?.addEventListener('click', () => this.closeExportModal());
      this.el.exportDoneBtn?.addEventListener('click', () => this.closeExportModal());
      this.el.exportModal?.addEventListener('click', (e) => {
        if (e.target === this.el.exportModal) this.closeExportModal();
      });

      // Copy export URL
      this.el.copyExportUrlBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.copyToClipboard(this.el.exportUrlInput?.value || '', 'Freetree link copied!');
      });

      // Copy export markdown
      this.el.copyExportMarkdownBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.copyToClipboard(this.el.exportMarkdownInput?.value || '', 'Markdown snippet copied!');
      });

      // Test export link
      this.el.testExportLinkBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        const url = this.el.exportUrlInput?.value;
        if (url) window.open(url, '_blank');
      });

      // Brand logo button -> Home / Reset
      this.el.brandLogoBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        try { window.location.hash = ''; } catch {}
        this.loadEmptyState();
      });

      // Preset buttons in topbar (if present)
      this.el.presetBtns?.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const presetKey = btn.getAttribute('data-preset');
          this.loadPreset(presetKey);
          try {
            window.location.hash = presetKey;
          } catch {}
        });
      });

      // "+ load" pill in topbar
      this.el.openLoadBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.openEditorModal();
      });

      // Open Modal button in topbar ("[ load link ]")
      this.el.editBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.openEditorModal();
      });

      // Modal close button
      this.el.closeModalBtn?.addEventListener('click', () => this.closeEditorModal());

      // Primary Load Button: loads directly from Delta Link / Prefix!
      this.el.modalLoadBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        const inputVal = this.el.modalUrlInput?.value || '';
        this.loadFromDeltaInput(inputVal);
      });

      // Enter key in URL input triggers load directly
      this.el.modalUrlInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.el.modalLoadBtn?.click();
        }
      });

      // Optional manual markdown apply button inside <details>
      this.el.modalApplyBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.applyCustomData();
      });

      // Close modal on backdrop click
      this.el.modal?.addEventListener('click', (e) => {
        if (e.target === this.el.modal) this.closeEditorModal();
      });

      // Hashchange navigation
      window.addEventListener('hashchange', () => this.handleRoute());

      // Delegate copy clicks on pill ⋮ buttons
      this.el.linksList?.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('[data-copy]');
        if (copyBtn) {
          e.preventDefault();
          e.stopPropagation();
          const urlToCopy = copyBtn.getAttribute('data-copy');
          const isAddr = urlToCopy.startsWith('0x') || urlToCopy.startsWith('bc1') || urlToCopy.startsWith('t1') || urlToCopy.length > 35;
          this.copyToClipboard(urlToCopy, isAddr ? 'Address copied to clipboard!' : 'Link copied to clipboard!');
        }
      });

      // Delta badge click opens the link loader
      this.el.deltaBadge?.addEventListener('click', (e) => {
        e.preventDefault();
        this.openEditorModal();
      });

      // Hook up Freenet node status listener from bridge
      if (window.freenetDelta) {
        window.freenetDelta.onStatus((status) => {
          if (this.el.statusText) {
            if (status === 'connected') {
              this.el.statusText.textContent = 'Freenet: Active';
              this.el.statusDot?.classList.remove('is-offline');
            } else if (status === 'connecting') {
              this.el.statusText.textContent = 'Freenet: Connecting...';
            } else {
              this.el.statusText.textContent = 'Freenet: Offline';
              this.el.statusDot?.classList.add('is-offline');
            }
          }
        });
      }
    }

    renderLoading(prefix) {
      if (this.el.handle) this.el.handle.textContent = `@${prefix}`;
      if (this.el.bio) this.el.bio.textContent = 'Loading Delta site from Freenet...';
      if (this.el.linksList) {
        this.el.linksList.innerHTML = `
          <div class="empty-state" style="padding: 30px 10px;">
            <div style="font-size: 1.5rem; margin-bottom: 12px; animation: pulse 1.5s infinite;">⏳</div>
            <p>Querying Freenet node for <strong>${escapeHtml(prefix)}</strong>...</p>
            <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">Retrieving Delta contract and pages via P2P WebSocket</span>
          </div>
        `;
      }
      if (this.el.pageTabs) this.el.pageTabs.style.display = 'none';
      if (this.el.deltaBadge) {
        this.el.deltaBadge.innerHTML = `
          ${ICONS.delta}
          <span>delta: ${escapeHtml(prefix)}</span>
        `;
      }
    }

    /**
     * Load Delta site directly from Link or Prefix (Zero Markdown typing needed!)
     */
    async loadFromDeltaInput(rawInput) {
      if (!rawInput || !rawInput.trim()) {
        this.showToast('Paste a Delta link or prefix!');
        return;
      }

      const { prefix, page } = extractDeltaPrefixAndPage(rawInput);
      if (!prefix) {
        this.showToast('Invalid Delta link!');
        return;
      }

      // 1. Check if known in PRESETS/registry
      for (const [key, site] of Object.entries(PRESETS)) {
        const matches = site.prefix.toLowerCase() === prefix.toLowerCase() ||
          key.toLowerCase() === prefix.toLowerCase() ||
          (site.aliases && site.aliases.some(a => a.toLowerCase() === prefix.toLowerCase()));
        if (matches) {
          this.loadPreset(key, page);
          try {
            window.location.hash = page ? `${site.prefix}/${page}` : site.prefix;
          } catch {}
          this.closeEditorModal();
          this.showToast(`Loaded ${site.name}!`);
          return;
        }
      }

      // 2. Dynamically fetch ANY Delta site from the node via freenetDelta (same technique as Radica!)
      if (window.freenetDelta && /^[1-9A-HJ-NP-Za-km-z]{10}$/.test(prefix)) {
        this.closeEditorModal();
        this.renderLoading(prefix);
        this.showToast(`Searching Delta site (${prefix}) on Freenet...`);
        try {
          const site = await window.freenetDelta.fetchDeltaSite(prefix);
          if (site && site.pages && Object.keys(site.pages).length > 0) {
            this.currentPresetKey = prefix;
            this.isCustomData = false;
            this.siteData = {
              ...site,
              pages: site.pages
            };
            const availablePages = Object.keys(site.pages);
            const matched = matchPage(availablePages, page);
            this.activePageTitle = matched || availablePages[0] || 'Links';
            this.updateActivePresetButton(null);
            this.render();
            try {
              window.location.hash = page ? `${prefix}/${page}` : prefix;
            } catch {}
            this.showToast(`Loaded ${site.name} from Freenet!`);
            return;
          }
        } catch (e) {
          console.warn('Dynamic Delta fetch failed:', e);
        }
      }

      // 3. If not found or offline, fallback to custom placeholder
      this.loadCustomPrefix(prefix, page);
      try {
        window.location.hash = page ? `${prefix}/${page}` : prefix;
      } catch {}
      this.closeEditorModal();
      this.showToast(`Delta site (${prefix}) loaded!`);
    }

    handleRoute() {
      let rawHash = '';
      try {
        rawHash = window.location.hash.replace(/^#\/?/, '').trim();
      } catch {}

      if (!rawHash) {
        this.loadEmptyState();
        return;
      }

      // Check portable custom data
      if (rawHash.startsWith('data=')) {
        const customData = decodeCustomData(rawHash);
        if (customData) {
          this.loadCustomData(customData);
          return;
        }
      }

      const { prefix, page } = extractDeltaPrefixAndPage(rawHash);

      // 1. Check presets
      for (const [key, preset] of Object.entries(PRESETS)) {
        const matches = key.toLowerCase() === prefix.toLowerCase() ||
          preset.prefix.toLowerCase() === prefix.toLowerCase() ||
          (preset.aliases && preset.aliases.some(a => a.toLowerCase() === prefix.toLowerCase()));
        if (matches) {
          this.loadPreset(key, page);
          return;
        }
      }

      // 2. Dynamically fetch via window.freenetDelta
      if (window.freenetDelta && /^[1-9A-HJ-NP-Za-km-z]{10}$/.test(prefix)) {
        this.renderLoading(prefix);
        window.freenetDelta.fetchDeltaSite(prefix).then(site => {
          if (site && site.pages && Object.keys(site.pages).length > 0) {
            this.currentPresetKey = prefix;
            this.isCustomData = false;
            this.siteData = {
              ...site,
              pages: site.pages
            };
            const availablePages = Object.keys(site.pages);
            const matched = matchPage(availablePages, page);
            this.activePageTitle = matched || availablePages[0] || 'Links';
            this.updateActivePresetButton(null);
            this.render();
          } else {
            this.loadCustomPrefix(prefix, page);
          }
        }).catch(() => {
          this.loadCustomPrefix(prefix, page);
        });
        return;
      }

      this.loadCustomPrefix(prefix, page);
    }

    /**
     * Start clean without any pages loaded
     */
    loadEmptyState() {
      this.currentPresetKey = null;
      this.siteData = null;
      this.activePageTitle = null;
      this.isCustomData = false;
      this.updateActivePresetButton(null);
      this.renderEmptyState();
    }

    renderEmptyState() {
      if (this.el.handle) this.el.handle.textContent = 'freetree';
      if (this.el.bio) {
        this.el.bio.textContent = 'Decentralized Linktree for Freenet. Paste any Delta site link or prefix to generate your profile page with all your links instantly.';
      }

      if (this.el.deltaBadge) {
        this.el.deltaBadge.innerHTML = `
          ${ICONS.delta}
          <span>freenet // linktree</span>
        `;
      }

      if (this.el.avatarImg) this.el.avatarImg.style.display = 'none';
      if (this.el.avatarFallback) {
        this.el.avatarFallback.style.display = 'flex';
        this.el.avatarFallback.textContent = 'FT';
      }

      if (this.el.pageTabs) this.el.pageTabs.style.display = 'none';
      if (this.el.cardExportBtn) this.el.cardExportBtn.style.display = 'none';

      if (this.el.linksList) {
        this.el.linksList.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-state-icon">
              ${ICONS.link}
            </div>
            <div class="empty-state-title">No site loaded</div>
            <div class="empty-state-subtitle">Paste any Delta site link or prefix to generate your decentralized Linktree profile page.</div>

            <div class="empty-state-form">
              <input type="text" id="empty-url-input" class="form-input" placeholder="e.g. http://.../#7jKW1CQj7R or AnCVD9ZD3U" autofocus />
              <button type="button" id="empty-load-btn" class="btn-primary" style="width: 100%; text-align: center; padding: 10px; font-size: 0.82rem;">
                ⚡ Generate Linktree from Delta
              </button>
            </div>
          </div>
        `;

        const emptyInput = document.getElementById('empty-url-input');
        const emptyBtn = document.getElementById('empty-load-btn');
        emptyBtn?.addEventListener('click', (e) => {
          e.preventDefault();
          this.loadFromDeltaInput(emptyInput?.value || '');
        });
        emptyInput?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            emptyBtn?.click();
          }
        });
      }
    }

    loadPreset(presetKey, targetPage) {
      const preset = PRESETS[presetKey];
      if (!preset) return;

      this.currentPresetKey = presetKey;
      this.isCustomData = false;
      const filteredPages = filterPagesWithLinks(preset.pages || {}, preset.prefix);
      this.siteData = {
        prefix: preset.prefix,
        name: preset.name,
        handle: preset.handle,
        bio: preset.bio,
        avatar: preset.avatar,
        pages: filteredPages
      };

      const availablePages = Object.keys(filteredPages);
      const matched = matchPage(availablePages, targetPage);
      if (matched) {
        this.activePageTitle = matched;
      } else if (preset.activePage && availablePages.includes(preset.activePage)) {
        this.activePageTitle = preset.activePage;
      } else {
        this.activePageTitle = availablePages[0] || 'Links';
      }

      this.updateActivePresetButton(presetKey);
      this.render();
    }

    loadCustomPrefix(prefix, targetPage) {
      this.currentPresetKey = 'custom';
      this.isCustomData = false;
      const pageTitle = targetPage ? (targetPage.charAt(0).toUpperCase() + targetPage.slice(1)) : 'Links';
      const deltaSubpath = targetPage ? `/${targetPage}` : '';
      this.siteData = {
        prefix: prefix,
        name: `Delta Site (${prefix})`,
        handle: `@${prefix}`,
        bio: `Decentralized Delta site (${prefix}).`,
        avatar: null,
        pages: {
          [pageTitle]: `# ${pageTitle}\n\n## Links\n* [Open on Delta](http://127.0.0.1:7509/v1/contract/web/EqJ5YpEEV3XLqEvKWLQHFhGAac2qXzSUoE6k2zbdnXBr/#${prefix}${deltaSubpath}) - View full page on Delta\n* [Freenet Gateway](http://127.0.0.1:7509/) - Local node status & diagnostics\n* [River Chat](http://127.0.0.1:7509/v1/contract/web/raAqMhMG7KUpXBU2SxgCQ3Vh4PYjttxdSWd9ftV7RLv/) - P2P communication channel`
        }
      };
      this.activePageTitle = pageTitle;
      this.updateActivePresetButton('custom');
      this.render();
    }

    loadCustomData(custom) {
      this.currentPresetKey = 'custom';
      this.isCustomData = true;
      this.siteData = {
        prefix: custom.prefix,
        name: custom.name,
        handle: custom.handle,
        bio: custom.bio,
        avatar: custom.avatar,
        pages: custom.pages
      };
      this.activePageTitle = custom.activePage || Object.keys(custom.pages)[0] || 'Links';
      this.updateActivePresetButton('custom');
      this.render();
      this.showToast(`Loaded ${custom.name}!`);
    }

    openExportModal() {
      if (!this.siteData) {
        this.showToast('Load a Delta site first to export!');
        this.openEditorModal();
        return;
      }

      const shareUrl = this.getShareableUrl();
      if (this.el.exportUrlInput) {
        this.el.exportUrlInput.value = shareUrl;
      }

      if (this.el.exportMarkdownInput) {
        const title = this.siteData.name || 'My Linktree';
        this.el.exportMarkdownInput.value = `* [${title}](${shareUrl}) - Linktree profile on Freenet`;
      }

      this.el.exportModal?.classList.add('is-open');
      setTimeout(() => {
        this.el.exportUrlInput?.focus();
        this.el.exportUrlInput?.select();
      }, 100);
    }

    closeExportModal() {
      this.el.exportModal?.classList.remove('is-open');
    }

    getShareableUrl() {
      let origin = window.location.origin;
      if (!origin || origin === 'null') {
        origin = 'http://127.0.0.1:7509';
      }
      let pathname = window.location.pathname;
      if (!pathname || pathname === '/' || pathname.endsWith('index.html')) {
        pathname = '/v1/contract/web/4SC5QCzLzKWH9BSFFybivTynfBRkPw3PtXwegjXbPm8x/';
      }

      if (this.currentPresetKey === 'custom' && this.isCustomData) {
        return `${origin}${pathname}#${encodeCustomData(this.siteData, this.activePageTitle)}`;
      }

      const prefix = this.siteData.prefix || this.currentPresetKey || '';
      const page = this.activePageTitle;
      if (page && page !== 'Links' && page !== 'Home') {
        return `${origin}${pathname}#${prefix}/${encodeURIComponent(page)}`;
      }
      return `${origin}${pathname}#${prefix}`;
    }

    updateActivePresetButton(activeKey) {
      this.el.presetBtns?.forEach(btn => {
        const key = btn.getAttribute('data-preset');
        if (key && key === activeKey) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });
    }

    render() {
      if (!this.siteData) {
        this.renderEmptyState();
        return;
      }

      // Handle & Bio
      if (this.el.handle) this.el.handle.textContent = this.siteData.handle || this.siteData.name;
      if (this.el.bio) this.el.bio.textContent = this.siteData.bio;

      // Delta Prefix Badge
      if (this.el.deltaBadge) {
        this.el.deltaBadge.innerHTML = `
          ${ICONS.delta}
          <span>delta: ${this.siteData.prefix || 'custom'}</span>
        `;
      }

      // Avatar
      if (this.siteData.avatar) {
        if (this.el.avatarImg) {
          this.el.avatarImg.src = this.siteData.avatar;
          this.el.avatarImg.style.display = 'block';
        }
        if (this.el.avatarFallback) {
          this.el.avatarFallback.style.display = 'none';
        }
      } else {
        if (this.el.avatarImg) {
          this.el.avatarImg.style.display = 'none';
        }
        if (this.el.avatarFallback) {
          this.el.avatarFallback.style.display = 'flex';
          const initials = (this.siteData.name || 'FT')
            .split(' ')
            .map(w => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
          this.el.avatarFallback.textContent = initials;
        }
      }

      // Card export button visible when a site is loaded
      if (this.el.cardExportBtn) {
        this.el.cardExportBtn.style.display = 'inline-flex';
      }

      // Page Tabs: filter out pages without links (Linktree only shows pages with links!)
      const allPages = this.siteData.pages || {};
      let pageKeys = Object.keys(allPages).filter(title => {
        return pageHasLinks(allPages[title], this.siteData.prefix);
      });
      if (pageKeys.length === 0) {
        pageKeys = Object.keys(allPages);
      }

      // If activePageTitle has no links or is not in pageKeys, switch to first page with links
      if (!pageKeys.includes(this.activePageTitle)) {
        this.activePageTitle = pageKeys[0] || 'Links';
      }

      if (this.el.pageTabs) {
        if (pageKeys.length > 1) {
          this.el.pageTabs.style.display = 'flex';
          this.el.pageTabs.innerHTML = pageKeys.map(title => `
            <button type="button" class="page-tab-btn ${title === this.activePageTitle ? 'is-active' : ''}" data-page="${escapeAttr(title)}">
              ${escapeHtml(title)}
            </button>
          `).join('');

          this.el.pageTabs.querySelectorAll('[data-page]').forEach(tab => {
            tab.addEventListener('click', () => {
              this.activePageTitle = tab.getAttribute('data-page');
              this.renderPageTabs();
              this.renderLinks();
            });
          });
        } else {
          this.el.pageTabs.style.display = 'none';
        }
      }

      this.renderLinks();
    }

    renderPageTabs() {
      this.el.pageTabs?.querySelectorAll('[data-page]').forEach(tab => {
        const page = tab.getAttribute('data-page');
        if (page === this.activePageTitle) {
          tab.classList.add('is-active');
        } else {
          tab.classList.remove('is-active');
        }
      });
    }

    renderLinks() {
      if (!this.el.linksList || !this.siteData) return;

      const rawMarkdown = this.siteData.pages[this.activePageTitle] || '';
      const parsed = parseDeltaMarkdown(rawMarkdown, this.siteData.prefix);
      this.el.linksList.innerHTML = renderLinktreeHtml(parsed);
    }

    openEditorModal() {
      if (!this.el.modal) return;

      if (this.el.modalUrlInput) {
        this.el.modalUrlInput.value = this.siteData?.prefix 
          ? `http://127.0.0.1:7509/v1/contract/web/EqJ5YpEEV3XLqEvKWLQHFhGAac2qXzSUoE6k2zbdnXBr/#${this.siteData.prefix}`
          : '';
      }
      if (this.el.modalTitleInput) this.el.modalTitleInput.value = this.siteData?.name || '';
      if (this.el.modalBioInput) this.el.modalBioInput.value = this.siteData?.bio || '';
      if (this.el.modalMarkdownInput) this.el.modalMarkdownInput.value = this.siteData?.pages[this.activePageTitle] || '';

      this.el.modal.classList.add('is-open');
      setTimeout(() => {
        this.el.modalUrlInput?.focus();
        this.el.modalUrlInput?.select();
      }, 100);
    }

    closeEditorModal() {
      this.el.modal?.classList.remove('is-open');
    }

    applyCustomData() {
      const title = this.el.modalTitleInput.value.trim() || 'Custom Delta Site';
      const bio = this.el.modalBioInput.value.trim() || '';
      const markdown = this.el.modalMarkdownInput.value.trim();

      this.currentPresetKey = 'custom';
      this.siteData = {
        prefix: this.siteData?.prefix || 'custom',
        name: title,
        handle: `@${title.replace(/\s+/g, '_').toLowerCase()}`,
        bio: bio,
        avatar: null,
        pages: {
          'Links': markdown
        }
      };
      this.activePageTitle = 'Links';

      this.updateActivePresetButton('custom');
      this.render();
      this.closeEditorModal();
      this.showToast('Configuration updated!');
    }

    copyToClipboard(text, message) {
      if (!text) return;
      message = message || 'Copied to clipboard!';

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => this.showToast(message))
          .catch(() => this.fallbackCopy(text, message));
      } else {
        this.fallbackCopy(text, message);
      }
    }

    fallbackCopy(text, message) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.showToast(message);
      } catch (e) {
        this.showToast('Failed to copy');
      }
      document.body.removeChild(textarea);
    }

    showToast(message) {
      if (!this.el.toast || !this.el.toastText) return;

      this.el.toastText.textContent = message;
      this.el.toast.classList.add('is-visible');

      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        this.el.toast.classList.remove('is-visible');
      }, 2400);
    }
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

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  // =========================================================================
  // 6. INITIALIZATION
  // =========================================================================
  function bootstrap() {
    try {
      window.freetree = new FreetreeApp();
    } catch (err) {
      console.error('Freetree initialization error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
