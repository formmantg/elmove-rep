// TRANSLATE BUTTON (Google)
const translateBtn = document.getElementById('translate-btn');

if (translateBtn) {
  translateBtn.addEventListener('click', function () {
    const lang = this.getAttribute('data-lang');

    if (lang === 'pl') {
        this.setAttribute('data-lang', 'en');
        this.textContent = 'PL';

        const currentUrl = window.location.href;

        window.location.href =
            'https://translate.google.com/translate?hl=en&sl=pl&u=' +
            encodeURIComponent(currentUrl);

    } else {
        this.setAttribute('data-lang', 'pl');
        this.textContent = 'EN';

        const cleanUrl = window.location.href
            .replace(/^https:\/\/translate\.googleusercontent\.com\/translate\?.*?u=/, '')
            .split('&')[0];

        window.location.href = decodeURIComponent(cleanUrl);
    }
  });
}