<?php
require 'cors.php';
require 'db.php';

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Check active status
$stmt = $pdo->prepare("SELECT is_active FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user || $user['is_active'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'User not active']);
    exit;
}

// Fetch events (future events)
$stmt = $pdo->query("SELECT * FROM events WHERE event_start >= NOW() ORDER BY event_start ASC");
$events = $stmt->fetchAll();

echo json_encode($events);
?>
