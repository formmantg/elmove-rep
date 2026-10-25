<?php

// =========================
// ODCZYT JSON
// =========================
function read_json($file) {
    if (!file_exists($file)) {
        return [];
    }

    $content = file_get_contents($file);

    if ($content === false || $content === '') {
        return [];
    }

    $data = json_decode($content, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        // backup uszkodzonego pliku
        rename($file, $file . '.broken_' . time());
        return [];
    }

    return $data;
}

// =========================
// ZAPIS JSON (bezpieczny)
// =========================
function write_json($file, $data) {

    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    if ($json === false) {
        die("❌ Błąd kodowania JSON.");
    }

    // zapis z blokadą (ważne!)
    $result = file_put_contents($file, $json, LOCK_EX);

    if ($result === false) {
        die("❌ Nie można zapisać pliku: $file");
    }
}