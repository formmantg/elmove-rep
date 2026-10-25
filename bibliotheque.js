(() => {
  "use strict";

  const map = document.querySelector(".map");
  const hint = document.querySelector(".map-hint");
  const poem = document.querySelector(".poem");

  if (!map || !hint) return;

  const originalMap = map.innerHTML;
  let currentTree = "main";
  let isTravelling = false;
  let travelTimer = null;

  const content = {
    geneza: {
      title: "Geneza",
      subtitle: "Początek Ruchu Uniesienia",
      text: "Rok 2012, parkour, pierwsze idee i droga, która zaczęła prowadzić dalej niż sport. Geneza to miejsce, w którym ruch staje się pytaniem o sposób istnienia, rozwój i wspólnotę."
    },
    walka: {
      title: "Dobra walka",
      subtitle: "Droga, upadek i odrodzenie",
      text: "Nie każda walka toczy się z przeciwnikiem. Czasem chodzi o własne ograniczenia, czasem o odwagę, by zacząć od nowa. Dobra walka nie musi oznaczać zwycięstwa nad kimś — może być świadomym wyborem, by nie przestać się rozwijać."
    },
    czas: {
      title: "Czas",
      subtitle: "Pamięć, chwila i przemijanie",
      text: "Czas porządkuje wspomnienia, zmienia znaczenie zdarzeń i sprawia, że chwila staje się historią. To przestrzeń pomiędzy tym, co już było, tym, co przeżywamy, a tym, co dopiero może nadejść."
    },
    percepcja: {
      title: "Percepcja",
      subtitle: "To, co widzimy — i to, co dopowiadamy",
      text: "Świadomość, podświadomość, sny i symbole wpływają na to, jak odczytujemy rzeczywistość. Zmiana perspektywy nie zawsze zmienia świat, ale może odsłonić jego inną warstwę."
    },
    uniesienie: {
      title: "Uniesienie",
      subtitle: "Moment przekroczenia",
      text: "Wspólny rytm, wolność, siła i doświadczenie przemiany. Uniesienie zaczyna się tam, gdzie człowiek wychodzi poza automatyzm i świadomie uczestniczy w tym, co tworzy."
    },
    center: {
      title: "Bibliothèque",
      subtitle: "Mapa uniwersum Elation Movement",
      text: "Wybierz punkt na mapie, aby rozpocząć własną eksplorację. Żadna ścieżka nie jest narzucona — to Ty decydujesz, od czego zaczniesz."
    }
  };

  const elementContent = {
    centrum: {
      title: "Żywioły",
      subtitle: "Pięć dróg poznania",
      text: "Każdy żywioł otwiera inną perspektywę. Lód prowadzi do Ego, Ogień do Przemiany, Ziemia do Duszy, Wiatr do Przesłania, a Dźwięk do Boga."
    },

    lod: {
      title: "Lód",
      subtitle: "Ego",
      text: "Lód jest granicą, którą budujemy wokół siebie. Utrwala obraz własnego ja, chroni, ale może też oddzielać nas od świata. Czy Ego jest naszą prawdziwą naturą, czy jedynie odbiciem, którego próbujemy bronić?"
    },

    ogien: {
      title: "Ogień",
      subtitle: "Przemiana",
      text: "Ogień niszczy dotychczasową formę, ale daje też początek nowej. Symbolizuje działanie, doświadczenie i odwagę, by przejść przez zmianę. Przemiana nie zawsze oznacza utratę — czasem pozwala zobaczyć, kim możemy się stać."
    },

    ziemia: {
      title: "Ziemia",
      subtitle: "Dusza",
      text: "Ziemia jest fundamentem istnienia. To miejsce, w którym myśli stają się działaniem, a doświadczenia zapuszczają korzenie. Dusza pozostaje pytaniem o to, co w człowieku trwa, kiedy zmienia się wszystko wokół niego."
    },

    wiatr: {
      title: "Wiatr",
      subtitle: "Przesłanie",
      text: "Wiatr pozostaje niewidzialny, lecz można rozpoznać jego obecność po tym, co porusza. Tak samo działa przesłanie — przekracza granice, niesie myśl dalej i nabiera nowych znaczeń w umysłach tych, którzy je przyjmują."
    },

    dzwiek: {
      title: "Dźwięk",
      subtitle: "Bóg",
      text: "Dźwięk jest drganiem, które dociera do nas i pozostawia ślad. Może stać się głosem, muzyką, ciszą albo pytaniem o obecność czegoś większego. Bóg pozostaje tutaj przestrzenią do własnego odkrywania — nie gotową odpowiedzią, lecz pytaniem o źródło istnienia."
    }
  };

  const panel = document.createElement("section");
  panel.className = "discovery-panel";
  panel.hidden = true;
  panel.setAttribute("aria-live", "polite");
  panel.setAttribute("aria-label", "Odkrywana treść");
  hint.insertAdjacentElement("afterend", panel);

  function closePanel() {
    panel.hidden = true;
    panel.innerHTML = "";
  }

  function closeNodePreviews() {
    map.querySelectorAll(".node[aria-expanded]").forEach((node) => {
      node.setAttribute("aria-expanded", "false");
    });
    map.querySelectorAll(".connection").forEach((line) => {
      line.classList.remove("is-hot");
    });
  }

  function highlightConnections(id) {
    map.querySelectorAll(".connection").forEach((line) => {
      line.classList.toggle("is-hot", line.dataset.from === id);
    });
  }

  function renderPanel(id, customContent = null) {
    const item = customContent || content[id];
    if (!item) return;

    closePanel();
    panel.innerHTML = `
      <p class="panel-kicker">Elation Movement · Bibliothèque</p>
      <h2></h2>
      <h3></h3>
      <p></p>
      <button class="panel-close" type="button">Zamknij ×</button>
    `;
    panel.querySelector("h2").textContent = item.title;
    panel.querySelector("h3").textContent = item.subtitle;
    panel.querySelector("p:not(.panel-kicker)").textContent = item.text;
    panel.hidden = false;
    panel.querySelector(".panel-close").addEventListener("click", closePanel);
  }

  function renderElementsTree() {
    map.innerHTML = `
      <div class="element-tree" aria-label="Drzewo żywiołów">
        <button class="tree-back" type="button">← Powrót do mapy</button>

        <svg class="connections" viewBox="0 0 1200 900"
             preserveAspectRatio="none" aria-hidden="true">
          <line class="connection" x1="600" y1="432" x2="600" y2="180" />
          <line class="connection" x1="600" y1="432" x2="288" y2="423" />
          <line class="connection" x1="600" y1="432" x2="432" y2="666" />
          <line class="connection" x1="600" y1="432" x2="900" y2="423" />
          <line class="connection" x1="600" y1="432" x2="768" y2="666" />
        </svg>

        <button class="element-node" data-element="centrum"
                type="button" aria-pressed="false">
          <span class="node-core"></span>
          <span class="element-label">Żywioły</span>
        </button>

        <button class="element-node" data-element="ogien"
                type="button" aria-pressed="false">
          <span class="node-core"></span>
          <span class="element-label">Ogień</span>
        </button>

        <button class="element-node" data-element="lod"
                type="button" aria-pressed="false">
          <span class="node-core"></span>
          <span class="element-label">Lód</span>
        </button>

        <button class="element-node" data-element="ziemia"
                type="button" aria-pressed="false">
          <span class="node-core"></span>
          <span class="element-label">Ziemia</span>
        </button>

        <button class="element-node" data-element="wiatr"
                type="button" aria-pressed="false">
          <span class="node-core"></span>
          <span class="element-label">Wiatr</span>
        </button>

        <button class="element-node" data-element="dzwiek"
                type="button" aria-pressed="false">
          <span class="node-core"></span>
          <span class="element-label">Dźwięk</span>
        </button>
      </div>
    `;

    currentTree = "elements";
    hint.textContent = "wybierz żywioł, aby odkryć jego znaczenie";
}

  function travelToElements() {
    if (isTravelling) return;
    isTravelling = true;
    closePanel();
    if (poem) poem.classList.remove("is-visible");
    closeNodePreviews();
    map.classList.remove("is-arrived");
    map.classList.add("is-travelling");

    travelTimer = window.setTimeout(() => {
      renderElementsTree();
      map.classList.remove("is-travelling");
      map.classList.add("is-arrived");
      isTravelling = false;
      travelTimer = null;
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 10 : 650);
  }

  function returnToMainTree() {
    if (isTravelling) return;
    isTravelling = true;
    closePanel();
    map.classList.remove("is-arrived");
    map.classList.add("is-travelling");

    travelTimer = window.setTimeout(() => {
      map.innerHTML = originalMap;
      currentTree = "main";
      isTravelling = false;
      travelTimer = null;
      map.classList.remove("is-travelling", "is-arrived");
      hint.textContent = "kliknij punkt, aby rozpocząć eksplorację";
      closeNodePreviews();
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 10 : 650);
  }

  function toggleArchive() {
    if (!poem) return;
    const wasVisible = poem.classList.contains("is-visible");
    closePanel();
    closeNodePreviews();
    poem.classList.toggle("is-visible", !wasVisible);
    if (!wasVisible) {
      poem.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    }
  }

  map.addEventListener("click", (event) => {
    const backButton = event.target.closest(".tree-back");
    if (backButton && currentTree === "elements") {
      returnToMainTree();
      return;
    }

    const elementNode = event.target.closest("[data-element]");

    if (elementNode && currentTree === "elements") {
      map.querySelectorAll(".element-node").forEach((node) => {
        node.setAttribute("aria-pressed", "false");
      });

      elementNode.setAttribute("aria-pressed", "true");

      const element = elementNode.dataset.element;
      const item = elementContent[element];

      if (item) {
        renderPanel("selected-element", item);
      }

      return;
    }

    const node = event.target.closest(".node[data-node]");
    if (!node || currentTree !== "main" || isTravelling) return;

    const id = node.dataset.node;
    const clickedDiscover = Boolean(event.target.closest(".node-content em"));

    if (id === "archiwum") {
      toggleArchive();
      return;
    }

    if (id === "zywioly") {
      travelToElements();
      return;
    }

    if (id === "center") {
      closeNodePreviews();
      closePanel();
      if (poem) poem.classList.remove("is-visible");
      return;
    }

    if (clickedDiscover) {
      closeNodePreviews();
      if (poem) poem.classList.remove("is-visible");
      renderPanel(id);
      return;
    }

    const wasOpen = node.getAttribute("aria-expanded") === "true";
    closeNodePreviews();
    closePanel();
    if (poem) poem.classList.remove("is-visible");
    if (wasOpen) return;
    node.setAttribute("aria-expanded", "true");
    highlightConnections(id);
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("reduce-motion");
  }

  window.addEventListener("pagehide", () => {
    if (travelTimer !== null) window.clearTimeout(travelTimer);
  });
})();
