import { HEADER_CONFIG, FALLBACK_DIALOG_LABEL } from '../constants';

export function updateHeaderForScreen(name, elements) {
    const { header, headerEyebrow, headerTitle, headerSubtitle, modal, headerDefaults } = elements;

    const config = HEADER_CONFIG[name] || HEADER_CONFIG.form || {};
    const eyebrowText = typeof config.eyebrow === 'string' ? config.eyebrow : '';
    const titleText = typeof config.title === 'string' ? config.title : '';
    const subtitleText = typeof config.subtitle === 'string' ? config.subtitle : '';
    const describe = !!config.describe;

    if (header) {
        header.classList.toggle('bould-widget__header--compact', !!config.compact);
    }

    if (headerEyebrow) {
        if (eyebrowText) {
            headerEyebrow.hidden = false;
            headerEyebrow.textContent = eyebrowText;
        } else {
            headerEyebrow.hidden = true;
            headerEyebrow.textContent = headerDefaults.eyebrow;
        }
    }

    if (headerTitle) {
        if (titleText) {
            headerTitle.hidden = false;
            headerTitle.textContent = titleText;
        } else {
            headerTitle.hidden = true;
            headerTitle.textContent = '';
        }
    }

    if (headerSubtitle) {
        if (subtitleText) {
            headerSubtitle.hidden = false;
            headerSubtitle.textContent = subtitleText;
        } else {
            headerSubtitle.hidden = true;
            headerSubtitle.textContent = '';
        }
    }

    if (modal) {
        if (titleText && headerTitle && !headerTitle.hidden) {
            modal.setAttribute('aria-labelledby', headerTitle.id);
            modal.removeAttribute('aria-label');
        } else {
            modal.removeAttribute('aria-labelledby');
            modal.setAttribute('aria-label', config.ariaLabel || FALLBACK_DIALOG_LABEL);
        }

        if (describe && headerSubtitle && !headerSubtitle.hidden) {
            modal.setAttribute('aria-describedby', headerSubtitle.id);
        } else {
            modal.removeAttribute('aria-describedby');
        }
    }
}
