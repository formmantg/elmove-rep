<?php
session_start();
include 'config.php';

if (!isset($_SESSION['threads_access']))
    $_SESSION['threads_access'] = [];

$thread_id = intval($_GET['id'] ?? 0);
$threads = read_json('threads.json');
$posts = read_json('posts.json');
$users = file_exists('users.json') ? read_json('users.json') : [];

// znajdź wątek
$thread = null;
foreach ($threads as $t) {
    if ($t['id'] === $thread_id) {
        $thread = $t;
        break;
    }
}
if (!$thread) die('Nie znaleziono wątku');

// --- hasło do wątku ---
$thread_error = '';
if (isset($thread['thread_password']) && !isset($_SESSION['threads_access'][$thread_id])) {

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['thread_password'])) {
        $input = trim($_POST['thread_password']);

        if (password_verify($input, $thread['thread_password'])) {
            $_SESSION['threads_access'][$thread_id] = true;
        } else {
            $thread_error = "❌ Błędne hasło do wątku.";
        }
    }

    if (!isset($_SESSION['threads_access'][$thread_id])) {
        ?>
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <title>Hasło do wątku</title>
            <link rel="stylesheet" href="styles.css">
        </head>
        <body>
            <h1>Wątek chroniony</h1>

            <?php if ($thread_error): ?>
                <p class="error"><?= $thread_error ?></p>
            <?php endif; ?>

            <form method="post">
                <input type="password" name="thread_password" placeholder="Hasło do wątku" required>
                <button type="submit">Wejdź</button>
            </form>

            <a href="index.php">← Powrót</a>
        </body>
        </html>
        <?php
        exit;
    }
}

// filtruj posty
$thread_posts = array_values(array_filter($posts, fn($p) => $p['thread_id'] == $thread_id));

// --- AJAX POST ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['author'])) {

    $author = trim($_POST['author']);
    $content = trim($_POST['content'] ?? '');
    $password = trim($_POST['password'] ?? '');

    $response = ['error' => '', 'success' => '', 'post' => null];

    if ($author === '' || $content === '') {
        $response['error'] = "❌ Wypełnij wszystkie pola.";
    } else {

        if (isset($users[$author]) && $users[$author] !== '') {
            // istniejący użytkownik
            if ($password === '' || !password_verify($password, $users[$author])) {
                $response['error'] = "❌ Błędne hasło do nicka.";
            }
        } else {
            // nowy użytkownik
            if ($password !== '') {
                $users[$author] = password_hash($password, PASSWORD_DEFAULT);
                write_json('users.json', $users);
            }
        }
    }

    if ($response['error'] === '') {
        $new_post = [
            'thread_id' => $thread_id,
            'author' => htmlspecialchars($author),
            'content' => htmlspecialchars($content),
            'created_at' => date('Y-m-d H:i:s')
        ];

        $posts[] = $new_post;
        write_json('posts.json', $posts);

        $response['success'] = "✅ Post dodany!";
        $response['post'] = $new_post;
    }

    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
?>
<!DOCTYPE html>
<html lang="pl">

<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($thread['title']) ?> | ELMOVE.CLOUD</title>

    <link rel="stylesheet" href="styles.css">
</head>

<body>

<h1><?= htmlspecialchars($thread['title']) ?></h1>
<a href="index.php">← Powrót</a>

<h3>Dodaj odpowiedź</h3>

<form id="replyForm">
    <input type="text" name="author" placeholder="Twój nick" required>
    <input type="password" name="password" placeholder="Hasło do nicka">
    <textarea name="content" placeholder="Treść posta" required></textarea>
    <button type="submit">Wyślij</button>
</form>

<div id="message"></div>
<div id="posts"></div>

<script>
const postsDiv = document.getElementById('posts');

// dodawanie posta do DOM
function addPost(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';

    postDiv.innerHTML = `
        <strong>${post.author}</strong><br>
        ${post.content.replace(/\n/g, '<br>')}<br>
        <small>${post.created_at}</small>
    `;

    postsDiv.prepend(postDiv);
}

// AJAX submit
document.getElementById('replyForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch('', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        const msg = document.getElementById('message');

        if (data.error) {
            msg.innerHTML = `<div class="error">${data.error}</div>`;
        } else {
            msg.innerHTML = `<div class="success">${data.success}</div>`;
            addPost(data.post);
            this.reset();
        }
    });
});

// wczytaj posty
const threadPosts = <?= json_encode($thread_posts) ?>;

// sortuj malejąco
threadPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

// render
threadPosts.forEach(p => addPost(p));
</script>

</body>
</html>