# Elmove – Ruch Uniesienia (Electron)

Aplikacja desktopowa Electron zawierająca całą stronę Ruchu Uniesienia z:

- **Forum** aktualizowanym w czasie rzeczywistym + **czat na żywo**
- Usuwanie wątków/odpowiedzi: wpisz **Brownie** → podaj hasło **szczurymiejskie**
- **Hyperclock**: po otwarciu zakładki wysyła impulsy do wszystkich podłączonych użytkowników; kliknięcie w **centrum zegara** wraca na stronę główną (bez nowej karty)
- **Lumen**: przycisk **+** pod listą osób/zespołów/organizacji – możesz dodać siebie, zespół lub organizację przez upload plików HTML/JS/CSS; wymaga zatwierdzenia hasłem admina
- HOME w Lumen otwiera stronę główną w tym samym oknie
- Brakujące obrazki zastępowane symbolem **EM** (`images/elmovelogo.png`)

## Wymagania

- Node.js 18+ (zalecane 20 LTS)
- npm

## Instalacja i uruchomienie (deweloperskie)

```bash
cd elmove-electron
npm install
npm start
```

## Budowa instalatora (przez terminal)

```bash
cd elmove-electron
npm install
npm run build          # Windows + Linux + macOS (jeśli dostępne)
# lub tylko:
npm run build:win      # instalator NSIS (.exe)
npm run build:linux    # AppImage + .deb
```

Gotowe instalatory pojawią się w folderze `dist/`.

**Uwaga:** ZIP źródłowy **nie zawiera** `node_modules` – po rozpakowaniu zawsze najpierw `npm install`.

## Hasła admina

| Akcja              | Trigger     | Hasło            |
|--------------------|-------------|------------------|
| Usuwanie na Forum  | `Brownie`   | `szczurymiejskie`|
| Zatwierdzanie Lumen| –           | `szczurymiejskie`|

## Struktura

```
elmove-electron/
├── main/           # proces główny Electron + serwer Express/Socket.IO
├── renderer/       # cała oryginalna treść strony (zachowana)
│   ├── index.html
│   ├── forum/
│   ├── lumen/
│   ├── hyperclockhtml/
│   └── …
├── package.json
└── README.md
```

Dane forum, czatu i zgłoszeń Lumen zapisywane są lokalnie w katalogu użytkownika Electron (`userData/elmove-data`).

Treść merytoryczna stron pozostawiona w oryginale.
