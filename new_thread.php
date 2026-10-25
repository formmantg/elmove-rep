<?php
include 'config.php';

// dane
$threads = read_json('threads.json');
$posts = read_json('posts.json');
$users = file_exists('users.json') ? read_json('users.json') : [];

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $title = trim($_POST['title'] ?? '');
    $author = trim($_POST['author'] ?? '');
    $content = trim($_POST['content'] ?? '');
    $password = trim($_POST['password'] ?? ''); // 🔥 spójne z thread.php
    $threadPassword = trim($_POST['thread_password'] ?? '');

    if ($title === '' || $author === '' || $content === '') {
        $error = "❌ Wypełnij wszystkie wymagane pola.";
    } else {

        // --- obsługa nicka ---
        if (isset($users[$author])) {
            // istniejący nick → musi podać hasło
            if ($password === '' || !password_verify($password, $users[$author])) {
                $error = "❌ Błędne hasło do nicka.";
            }
        } else {
            // nowy nick
            if ($password !== '') {
                $users[$author] = password_hash($password, PASSWORD_DEFAULT);
                write_json('users.json', $users);
            }
        }
    }

    if ($error === '') {

        $id = $threads ? max(array_column($threads, 'id')) + 1 : 1;

        $threadData = [
            'id' => $id,
            'title' => htmlspecialchars($title),
            'created_at' => date('Y-m-d H:i:s')
        ];

        // hasło do wątku
        if ($threadPassword !== '') {
            $threadData['thread_password'] = password_hash($threadPassword, PASSWORD_DEFAULT);
        }

        $threads[] = $threadData;

        // pierwszy post
        $posts[] = [
            'thread_id' => $id,
            'author' => htmlspecialchars($author),
            'content' => htmlspecialchars($content),
            'created_at' => date('Y-m-d H:i:s')
        ];

        write_json('threads.json', $threads);
        write_json('posts.json', $posts);

        header("Location: thread.php?id=$id");
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="pl">

<head>
    <meta charset="UTF-8">
    <title>Nowy wątek | Forum.EM</title>
    <link rel="stylesheet" href="styles.css">
</head>

<body>

<h1>Nowy wątek</h1>

<?php if ($error): ?>
    <div class="error"><?= $error ?></div>
<?php endif; ?>

<form method="post">

    <input type="text" name="title" placeholder="Tytuł wątku" required>

    <input type="text" name="author" placeholder="Twój nick" required>

    <input type="password" name="password" placeholder="Hasło do nicka (opcjonalne)">

    <input type="password" name="thread_password" placeholder="Hasło do wątku (opcjonalne)">

    <textarea name="content" placeholder="Treść posta" required></textarea>

    <button type="submit">Utwórz wątek</button>

</form>

<a href="index.php">← Powrót</a>

</body>

</html>