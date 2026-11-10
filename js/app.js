/**
 * Freetree — Main Application Controller
 */

import { ICONS } from './icons.js';
import { parseDeltaMarkdown, renderLinktreeHtml } from './parser.js';
import { freenetClient } from './freenet.js';

// Safe localStorage wrapper for sandboxed iframes (Freenet Gateway sandbox lacks allow-same-origin)
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
    } catch {
      // Ignored in sandboxed iframes
    }
  }
};

function getInitialTheme() {
  const saved = safeStorage.getItem('freetree_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // fallback
  }
  return 'light';
}

class FreetreeApp {
  constructor() {
    this.currentPresetKey = null;
    this.siteData = null;
    this.activePageTitle = null;
    this.theme = getInitialTheme();

    this.initElements();
    this.initTheme();
    this.initEventListeners();
    this.handleRoute();

    // Initialize Freenet connection safely after initial UI render
    try {
      this.initFreenet();
    } catch (e) {
      console.warn('Freenet init warning (running in sandbox mode):', e);
    }
  }

  initElements() {
    this.el = {
      themeBtn: document.getElementById('theme-btn'),
      themeBtnText: document.getElementById('theme-btn-text'),
      themeIcon: document.getElementById('theme-icon'),
      shareBtn: document.getElementById('share-profile-btn'),
      editBtn: document.getElementById('edit-site-btn'),
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
      cancelModalBtn: document.getElementById('modal-cancel-btn'),
      applyModalBtn: document.getElementById('modal-apply-btn'),
      modalPrefixInput: document.getElementById('modal-prefix-input'),
      modalTitleInput: document.getElementById('modal-title-input'),
      modalBioInput: document.getElementById('modal-bio-input'),
      modalMarkdownInput: document.getElementById('modal-markdown-input')
    };
  }

  initTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    this.updateThemeUi();
  }

  updateThemeUi() {
    if (this.el.themeBtnText) {
      this.el.themeBtnText.textContent = this.theme === 'dark' ? 'Light' : 'Dark';
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.theme);
    safeStorage.setItem('freetree_theme', this.theme);
    this.updateThemeUi();
  }

  initFreenet() {
    freenetClient.onStatusChange((status) => {
      this.updateNodeStatus(status);
    });
    // Attempt local node connection
    freenetClient.connect();
  }

  updateNodeStatus(status) {
    if (!this.el.statusDot || !this.el.statusText) return;

    this.el.statusDot.className = 'status-dot';
    if (status === 'connected') {
      this.el.statusText.textContent = 'Freenet Node: Connesso';
    } else if (status === 'connecting') {
      this.el.statusDot.classList.add('connecting');
      this.el.statusText.textContent = 'Freenet: Connessione...';
    } else {
      this.el.statusDot.classList.add('offline');
      this.el.statusText.textContent = 'Freenet: Offline / Locale';
    }
  }

  initEventListeners() {
    // Theme toggle
    this.el.themeBtn?.addEventListener('click', () => this.toggleTheme());

    // Share profile
    this.el.shareBtn?.addEventListener('click', () => {
      this.copyToClipboard(window.location.href, 'Link profilo copiato negli appunti!');
    });

    // Preset buttons
    this.el.presetBtns?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const presetKey = btn.getAttribute('data-preset');
        if (presetKey === 'custom') {
          this.openEditorModal();
        } else {
          this.loadPreset(presetKey);
          window.location.hash = presetKey;
        }
      });
    });

    // Edit / Import button
    this.el.editBtn?.addEventListener('click', () => this.openEditorModal());

    // Modal controls
    this.el.closeModalBtn?.addEventListener('click', () => this.closeEditorModal());
    this.el.cancelModalBtn?.addEventListener('click', () => this.closeEditorModal());
    this.el.applyModalBtn?.addEventListener('click', () => this.applyCustomData());

    // Hashchange for navigation
    window.addEventListener('hashchange', () => this.handleRoute());

    // Delegate copy clicks on pill ⋮ buttons
    this.el.linksList?.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        e.preventDefault();
        e.stopPropagation();
        const urlToCopy = copyBtn.getAttribute('data-copy');
        this.copyToClipboard(urlToCopy, 'Link copiato negli appunti!');
      }
    });

    // Delta badge click opens editor with prefix
    this.el.deltaBadge?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openEditorModal();
    });
  }

  handleRoute() {
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    if (!rawHash) {
      this.loadCustomPrefix('freetree');
      return;
    }

    const parts = rawHash.split('/');
    const identifier = parts[0];
    const pageTarget = parts[1] ? decodeURIComponent(parts[1]) : null;

    // Load as prefix or custom site dynamically from Freenet
    this.loadCustomPrefix(identifier, pageTarget);
  }

  loadCustomPrefix(prefix, targetPage = null) {
    this.currentPresetKey = 'custom';
    this.siteData = {
      prefix: prefix,
      name: `Delta Site (${prefix})`,
      handle: `@delta_${prefix.slice(0, 6)}`,
      bio: `Sito decentralizzato Delta caricato dalla rete Freenet (prefix: ${prefix}).`,
      avatar: null,
      pages: {
        'Links': `# Links\n\n* [Delta Site](http://127.0.0.1:7509/v1/contract/web/EqJ5YpEEV3XLqEvKWLQHFhGAac2qXzSUoE6k2zbdnXBr/#${prefix}) - Apri il sito originale in Delta\n* [Freenet Gateway](http://127.0.0.1:7509/) - Stato del nodo locale\n* [River Chat](http://127.0.0.1:7509/v1/contract/web/raAqMhMG7KUpXBU2SxgCQ3Vh4PYjttxdSWd9ftV7RLv/) - Canale della community`
      }
    };
    this.activePageTitle = 'Links';
    this.updateActivePresetButton('custom');
    this.render();
  }

  updateActivePresetButton(activeKey) {
    this.el.presetBtns?.forEach(btn => {
      const key = btn.getAttribute('data-preset');
      if (key === activeKey) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });
  }

  render() {
    if (!this.siteData) return;

    // Profile Handle & Bio
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

    // Page Tabs (if multiple pages exist)
    const pageKeys = Object.keys(this.siteData.pages || {});
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
    this.el.modalPrefixInput.value = this.siteData?.prefix || '';
    this.el.modalTitleInput.value = this.siteData?.name || '';
    this.el.modalBioInput.value = this.siteData?.bio || '';
    this.el.modalMarkdownInput.value = this.siteData?.pages[this.activePageTitle] || '';

    this.el.modal.classList.add('is-open');
  }

  closeEditorModal() {
    this.el.modal?.classList.remove('is-open');
  }

  applyCustomData() {
    const prefix = this.el.modalPrefixInput.value.trim() || 'custom';
    const name = this.el.modalTitleInput.value.trim() || 'Custom Delta Site';
    const bio = this.el.modalBioInput.value.trim() || '';
    const markdown = this.el.modalMarkdownInput.value.trim();

    this.currentPresetKey = 'custom';
    this.siteData = {
      prefix,
      name,
      handle: `@${name.replace(/\s+/g, '_').toLowerCase()}`,
      bio,
      avatar: null,
      pages: {
        'Links': markdown
      }
    };
    this.activePageTitle = 'Links';

    this.updateActivePresetButton('custom');
    this.render();
    this.closeEditorModal();
    this.showToast('Configurazione aggiornata con successo!');
  }

  copyToClipboard(text, message = 'Copiato negli appunti!') {
    if (!text) return;

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
      this.showToast('Errore durante la copia');
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

// Start application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.freetree = new FreetreeApp();
});

