<?php
require 'cors.php';
require 'db.php';

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Check if user is active (Assuming only active users can see library)
$stmt = $pdo->prepare("SELECT is_active FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user || $user['is_active'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'User not active']);
    exit;
}

$stmt = $pdo->query("SELECT * FROM library ORDER BY created_at DESC");
$items = $stmt->fetchAll();

echo json_encode($items);
?>
