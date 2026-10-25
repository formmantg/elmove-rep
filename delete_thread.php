<?php
include 'config.php';

$threads = read_json('threads.json');
$posts = read_json('posts.json');

$thread_id = intval($_POST['thread_id'] ?? 0);
$password = $_POST['password'] ?? '';

$ADMIN_PASSWORD = "szczurymiejskie";

// sprawdzenie admina
if ($password !== $ADMIN_PASSWORD) {
    die("❌ Błędne hasło admina");
}

// usuń wątek
$threads = array_values(array_filter($threads, function ($t) use ($thread_id) {
    return $t['id'] != $thread_id;
}));

// usuń posty z tego wątku
$posts = array_values(array_filter($posts, function ($p) use ($thread_id) {
    return $p['thread_id'] != $thread_id;
}));

write_json('threads.json', $threads);
write_json('posts.json', $posts);

// POWRÓT (NAJWAŻNIEJSZE!)
header("Location: index.php");
exit;