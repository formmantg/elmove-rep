<?php
include 'config.php';

$threads = read_json('threads.json');

// sprawdzamy cookie admina
$isAdmin = isset($_COOKIE['em_admin']) && $_COOKIE['em_admin'] == "1";
?>
<!DOCTYPE html>
<html lang="pl">

<head>
    <script src="https://cdn.cookiehub.eu/c2/3e94fd47.js"></script>
<script type="text/javascript">
document.addEventListener("DOMContentLoaded", function(event) {
var cpm = {};
window.cookiehub.load(cpm);
});
</script>
    <meta charset="UTF-8">
    <title>ELMOVE.CLOUD</title>

    <meta name="description" content="Elation Movement Forum - przestrzeń idei, ruchu i świadomości.">
    <meta name="keywords" content="Elation Movement, forum, EM, dyskusje, świadomość, rozwój">
    <meta name="author" content="Mateusz Formicki">
    <meta property="og:title" content="ELMOVE.CLOUD – Ruch Uniesienia">
    <meta property="og:description" content="Społeczność Elation Movement">
    <meta property="og:image" content="https://www.elmove.cloud/summaryimg.png">
    <meta property="og:url" content="https://www.elmove.cloud/forum/">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="ELMOVE.CLOUD – Ruch Uniesienia">
    <meta name="twitter:description" content="Dołącz do Ruchu Uniesienia – przestrzeń idei, świadomości i Hiperzegara.">
    <meta name="twitter:image" content="https://www.elmove.cloud/summaryimg.png">
    <link rel="stylesheet" href="styles.css">

    <script>
        let typedKeys = '';

        document.addEventListener('keypress', (e) => {
            typedKeys += e.key.toLowerCase();

            if (typedKeys.includes('admin cookie')) {
                typedKeys = '';

                const password = prompt("Hasło admina:");
                if (password) {
                    const form = document.createElement("form");
                    form.method = "POST";
                    form.action = "admin_login.php";

                    const input = document.createElement("input");
                    input.type = "hidden";
                    input.name = "password";
                    input.value = password;

                    form.appendChild(input);
                    document.body.appendChild(form);
                    form.submit();
                }
            }
        });

        function deleteThread(id) {
            const password = prompt("Hasło admina:");
            if (!password) return;

            const form = document.createElement("form");
            form.method = "POST";
            form.action = "delete_thread.php";

            form.innerHTML = `
                <input type="hidden" name="thread_id" value="${id}">
                <input type="hidden" name="password" value="${password}">
            `;

            document.body.appendChild(form);
            form.submit();
        }
    </script>
</head>

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-2WYNZ1FP4B"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-2WYNZ1FP4B');
</script>

<body>

    <header>
        <h1>
            <a href="https://www.elmove.cloud" target="_blank">ELMOVE.CLOUD</a>
        </h1>
    </header>

    <main>
        <div class="actions">
            <a href="new_thread.php" class="btn">➕ Nowy wątek</a>
        </div>

        <ul class="thread-list">
            <?php foreach ($threads as $thread): ?>
                <li class="thread-item">
                    <a href="thread.php?id=<?= $thread['id'] ?>">
                        <?= htmlspecialchars($thread['title']) ?>
                    </a>

                    <span class="date">
                        <?= htmlspecialchars($thread['created_at']) ?>
                    </span>

                    <?php if ($isAdmin): ?>
                        <span class="delete-btn" onclick="deleteThread(<?= $thread['id'] ?>)">
                            🗑️
                        </span>
                    <?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </main>

</body>

</html>