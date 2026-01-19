<?php
require 'cors.php';
require 'db.php';

// Simple simulated auth: Client sends user_id in query param or body.
// Ideally this should be a token (JWT), but per instructions we simulate auth.
$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Check if user is active
$stmt = $pdo->prepare("SELECT is_active FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
}

if ($user['is_active'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'User not active']);
    exit;
}

// Get lessons
$stmt = $pdo->query("SELECT * FROM lessons ORDER BY order_index ASC");
$lessons = $stmt->fetchAll();

echo json_encode($lessons);
?>
