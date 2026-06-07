const data = window.__PORTFOLIO_DATA__ || { settings: { language: 'ru', bilingualMode: false }, developerProfile: {}, themes: [] };
const translations = window.__PORTFOLIO_TRANSLATIONS__ || {};
const bilingualMode = Boolean(data.settings && data.settings.bilingualMode);
let activeLanguage = data.settings && data.settings.language === 'en' ? 'en' : 'ru';
let activeThemeId = Array.isArray(data.themes) && data.themes.length ? data.themes[0].id : null;
let searchQuery = '';

const els = {
  brandLabel: document.getElementById('brandLabel'),
  themesPanelTitle: document.getElementById('themesPanelTitle'),
  developerPhotoPreview: document.getElementById('developerPhotoPreview'),
  developerName: document.getElementById('developerName'),
  developerBio: document.getElementById('developerBio'),
  themesList: document.getElementById('themesList'),
  currentThemeTitle: document.getElementById('currentThemeTitle'),
  currentThemeSubtitle: document.getElementById('currentThemeSubtitle'),
  projectsContainer: document.getElementById('projectsContainer'),
  searchInput: document.getElementById('searchInput'),
  themeCount: document.getElementById('themeCount'),
  projectCount: document.getElementById('projectCount'),
  themeCountLabel: document.getElementById('themeCountLabel'),
  projectCountLabel: document.getElementById('projectCountLabel'),
  langRuBtn: document.getElementById('langRuBtn'),
  langEnBtn: document.getElementById('langEnBtn')
};

function interpolate(message, values) {
  return String(message).replace(/\{(\w+)\}/g, function (_, key) {
    return String(values && values[key] != null ? values[key] : '');
  });
}

function getDictionary(language) {
  return translations[language] || translations.ru || {};
}

function t(key, values) {
  const dictionary = getDictionary(activeLanguage);
  return interpolate(dictionary[key] || key, values);
}

function normalizeText(value) {
  return String(value || '').trim();
}

function getAlternateLanguage(language) {
  return language === 'ru' ? 'en' : 'ru';
}

function getLocalizedPropertyName(base, language) {
  return base + (language === 'en' ? 'En' : 'Ru');
}

function getLocalizedValue(entity, base, language) {
  if (!bilingualMode) {
    return normalizeText(entity && entity[base]);
  }

  const primaryKey = getLocalizedPropertyName(base, language);
  const alternateKey = getLocalizedPropertyName(base, getAlternateLanguage(language));

  return normalizeText(entity && entity[primaryKey])
    || normalizeText(entity && entity[base])
    || normalizeText(entity && entity[alternateKey]);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getActiveTheme() {
  return (data.themes || []).find(function (theme) {
    return theme.id === activeThemeId;
  }) || null;
}

function getFilteredProjects(projects) {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return projects;

  return projects.filter(function (project) {
    const blob = [
      project.title,
      project.titleRu,
      project.titleEn,
      project.description,
      project.descriptionRu,
      project.descriptionEn,
      project.additional,
      project.additionalRu,
      project.additionalEn,
      project.link
    ].join(' ').toLowerCase();

    return blob.includes(query);
  });
}

function updateLanguageButtons() {
  if (!els.langRuBtn || !els.langEnBtn) return;

  els.langRuBtn.classList.toggle('is-active', activeLanguage === 'ru');
  els.langEnBtn.classList.toggle('is-active', activeLanguage === 'en');
}

function updateStaticTexts() {
  document.documentElement.lang = activeLanguage;
  document.title = t('pageTitle');

  if (els.brandLabel) els.brandLabel.textContent = t('brandLabel');
  if (els.themesPanelTitle) els.themesPanelTitle.textContent = t('themesTitle');
  if (els.currentThemeTitle && !getActiveTheme()) els.currentThemeTitle.textContent = t('chooseTheme');
  if (els.currentThemeSubtitle && !getActiveTheme()) els.currentThemeSubtitle.textContent = t('chooseThemeSubtitle');
  if (els.searchInput) els.searchInput.placeholder = t('searchPlaceholder');
  if (els.themeCountLabel) els.themeCountLabel.textContent = t('themesCountLabel');
  if (els.projectCountLabel) els.projectCountLabel.textContent = t('projectsCountLabel');

  updateLanguageButtons();
}

function renderDeveloperProfile() {
  const profile = data.developerProfile || {};
  const name = getLocalizedValue(profile, 'name', activeLanguage) || t('developerNameFallback');
  const bio = getLocalizedValue(profile, 'bio', activeLanguage) || t('developerBioFallback');
  const photo = normalizeText(profile.photo);

  els.developerName.textContent = name;
  els.developerBio.textContent = bio;

  if (photo) {
    els.developerPhotoPreview.innerHTML = '<img src="./' + escapeHtml(photo) + '" alt="' + escapeHtml(t('developerPhotoFallback')) + '">';
  } else {
    const letter = name.trim().charAt(0).toUpperCase() || t('developerPhotoFallback');
    els.developerPhotoPreview.innerHTML = '<span>' + escapeHtml(letter) + '</span>';
  }
}

function renderThemes() {
  const themes = Array.isArray(data.themes) ? data.themes : [];
  els.themeCount.textContent = String(themes.length);
  els.themesList.innerHTML = '';

  if (themes.length === 0) {
    els.themesList.innerHTML = '<div class="empty"><h3>' + escapeHtml(t('emptyThemesTitle')) + '</h3><p>' + escapeHtml(t('emptyThemesDescription')) + '</p></div>';
    els.currentThemeTitle.textContent = t('chooseTheme');
    els.currentThemeSubtitle.textContent = t('chooseThemeSubtitle');
    els.projectsContainer.innerHTML = '<div class="empty"><h3>' + escapeHtml(t('emptyNoSelectionTitle')) + '</h3><p>' + escapeHtml(t('emptyNoSelectionDescription')) + '</p></div>';
    els.projectCount.textContent = '0';
    return;
  }

  themes.forEach(function (theme) {
    const item = document.createElement('div');
    const themeName = getLocalizedValue(theme, 'name', activeLanguage) || t('themesTitle');

    item.className = 'theme-item' + (theme.id === activeThemeId ? ' active' : '');
    item.innerHTML = '<strong>' + escapeHtml(themeName) + '</strong><span>' + (Array.isArray(theme.projects) ? theme.projects.length : 0) + ' ' + escapeHtml(t('projectsShortLabel')) + '</span>';
    item.addEventListener('click', function () {
      activeThemeId = theme.id;
      render();
    });
    els.themesList.appendChild(item);
  });
}

function renderProjects() {
  const theme = getActiveTheme();
  if (!theme) {
    els.currentThemeTitle.textContent = t('chooseTheme');
    els.currentThemeSubtitle.textContent = t('chooseThemeSubtitle');
    els.projectsContainer.innerHTML = '<div class="empty"><h3>' + escapeHtml(t('emptyNoSelectionTitle')) + '</h3><p>' + escapeHtml(t('emptyNoSelectionDescription')) + '</p></div>';
    els.projectCount.textContent = '0';
    return;
  }

  const projects = getFilteredProjects(Array.isArray(theme.projects) ? theme.projects : [])
    .slice()
    .sort(function (a, b) {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

  els.currentThemeTitle.textContent = getLocalizedValue(theme, 'name', activeLanguage) || t('themesTitle');
  els.currentThemeSubtitle.textContent = t('chooseThemeSubtitle');
  els.projectCount.textContent = String(projects.length);

  if (projects.length === 0) {
    els.projectsContainer.innerHTML = '<div class="empty"><h3>' + escapeHtml(t('emptySearchTitle')) + '</h3><p>' + escapeHtml(t('emptySearchDescription')) + '</p></div>';
    return;
  }

  els.projectsContainer.innerHTML = '';
  projects.forEach(function (project) {
    const card = document.createElement('article');
    card.className = 'card';

    const title = getLocalizedValue(project, 'title', activeLanguage) || t('openProject');
    const description = getLocalizedValue(project, 'description', activeLanguage);
    const additional = getLocalizedValue(project, 'additional', activeLanguage);
    const cover = normalizeText(project.cover);
    const coverHtml = cover
      ? '<img src="./' + escapeHtml(cover) + '" alt="' + escapeHtml(title) + '">'
      : '<div class="fallback">' + escapeHtml((title || 'P').slice(0, 1).toUpperCase()) + '</div>';

    card.innerHTML =
      '<div class="cover">' + coverHtml + '</div>' +
      '<div class="card-body">' +
        '<div class="card-title">' +
          '<h3>' + escapeHtml(title) + '</h3>' +
        '</div>' +
        (description ? '<div class="desc">' + escapeHtml(description) + '</div>' : '') +
        (additional ? '<div class="pill">' + escapeHtml(t('additionalLabel') + ': ' + additional) + '</div>' : '') +
        '<div class="card-links">' +
          (project.link ? '<a class="link-btn" href="' + escapeHtml(project.link) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(t('openProject')) + '</a>' : '') +
        '</div>' +
      '</div>';

    els.projectsContainer.appendChild(card);
  });
}

function render() {
  updateStaticTexts();
  renderDeveloperProfile();
  renderThemes();
  renderProjects();
}

if (els.searchInput) {
  els.searchInput.addEventListener('input', function (event) {
    searchQuery = event.target.value;
    renderProjects();
  });
}

if (els.langRuBtn) {
  els.langRuBtn.addEventListener('click', function () {
    activeLanguage = 'ru';
    render();
  });
}

if (els.langEnBtn) {
  els.langEnBtn.addEventListener('click', function () {
    activeLanguage = 'en';
    render();
  });
}

render();