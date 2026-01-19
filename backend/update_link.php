<?php
require 'cors.php';
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->link)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id or link']);
    exit;
}

// Check if user is admin
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$data->user_id]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Admins only']);
    exit;
}

// Update link
$sql = "INSERT INTO settings (key_name, value) VALUES ('live_meeting_url', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)";
$stmt = $pdo->prepare($sql);

try {
    $stmt->execute([$data->link]);
    echo json_encode(['success' => true, 'message' => 'Link updated']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Update failed: ' . $e->getMessage()]);
}
?>
