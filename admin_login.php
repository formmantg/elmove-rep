<?php
if ($_POST['password'] === "szczurymiejskie") {
    setcookie("em_admin", "1", time() + (86400), "/"); // 24h
}

header("Location: index.php");
exit;