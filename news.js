// Tablica aktualności (po polsku)
const news = [
  {
    title: "📌 Hiperzegar — Moment jako materiał",
    category: "Eksploracja",
    content: "Każdy moment jest elastyczny. Twoja uwaga rozciąga go, ciekawość nadaje smak, a rutyna spręża czas. Obserwuj, jak wskazówki Hiperzegara pulsują w rytmie Twojej percepcji."
  },
  {
    title: "📌 Zakazany owoc wyobraźni",
    category: "Doświadczenie",
    content: "Na tarczy pojawia się owoc, lśniący czerwienią i złotem. Nie możesz go dotknąć ręką, lecz myślą możesz zbadać każdy niuans smaku i zapachu, tworząc własną symfonię czasu."
  },
  {
    title: "📌 Pulsacja sekund",
    category: "Sygnał",
    content: "Sekundy w Hiperzegarze nie są puste. Pulsują, rezonują z podświadomością, niosąc wskazówki, które zmieniają Twój odbiór chwili i rytm życia."
  },
  {
    title: "📌 Twój rytm, Twoje wzory",
    category: "Percepcja",
    content: "Każda wskazówka tworzy wzory tylko dla Ciebie. Im więcej eksplorujesz, tym bardziej czas żyje własnym rytmem, odkrywając unikalne harmonie momentów."
  },
  {
    title: "📌 Moment wolności",
    category: "Świadomość",
    content: "To Twój moment, Twój zakazany owoc i Twój Hiperzegar. Każdy smak, każda zmiana odzwierciedla Twoją wolność i świadomość. Nikt nie może Ci tego odebrać."
  }
];

// Funkcja renderująca aktualności – najnowsze wpisy na górze
function renderNews() {
  const main = document.querySelector("main");
  main.innerHTML = "<h2>Aktualności</h2>";

  news.slice().reverse().forEach((item, index) => {
    const article = document.createElement("article");
    article.style.opacity = "0";
    article.style.transform = "translateY(10px)";
    article.style.transition = "all 0.5s ease";

    const h3 = document.createElement("h3");
    h3.textContent = item.title;

    const category = document.createElement("small");
    category.textContent = item.category;
    category.style.display = "block";
    category.style.opacity = "0.6";

    const p = document.createElement("p");
    p.textContent = item.content;

    article.appendChild(h3);
    article.appendChild(category);
    article.appendChild(p);
    main.appendChild(article);

    // animacja z opóźnieniem
    setTimeout(() => {
      article.style.opacity = "1";
      article.style.transform = "translateY(0)";
    }, index * 120);
  });
}

// Wywołanie po załadowaniu DOM
document.addEventListener("DOMContentLoaded", renderNews);