<?php
// /var/www/html/webrtc/ha1.php

header('Content-Type: application/json');

// === Config ===
$extensions = [
    '1111' => 'P@ssw0rd', // username => password mapping
];
$realm = 'your.domain.com'; // same as SIP realm
$ttl = 180; // token validity in seconds (optional metadata)
$now = time();

// === Get username from GET parameter ===
if (!isset($_GET['user']) || !isset($extensions[$_GET['user']])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid user']);
    exit;
}

$username = $_GET['user'];
$password = $extensions[$username];

// === Compute HA1 ===
$ha1 = md5("{$username}:{$realm}:{$password}");

echo json_encode([
    'username' => $username,
    'realm' => $realm,
    'ha1' => $ha1,
    'expires' => $now + $ttl
]);
