<?php
require 'cors.php';
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit;
}

$stmt = $pdo->prepare("SELECT id, password_hash, is_active, role FROM users WHERE email = ?");
$stmt->execute([$data->email]);
$user = $stmt->fetch();

if ($user && password_verify($data->password, $user['password_hash'])) {
    echo json_encode([
        'success' => true,
        'user_id' => $user['id'],
        'is_active' => (bool)$user['is_active'],
        'role' => $user['role']
    ]);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
}
?>
