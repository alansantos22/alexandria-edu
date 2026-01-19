<?php
require 'cors.php';
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->lesson_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Admin check
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$data->user_id]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// Update fields provided
$fields = [];
$values = [];

if (isset($data->title)) {
    $fields[] = "title = ?";
    $values[] = $data->title;
}
if (isset($data->video_url)) {
    $fields[] = "video_url = ?";
    $values[] = $data->video_url;
}
if (isset($data->material_link)) {
    $fields[] = "material_link = ?";
    $values[] = $data->material_link;
}
if (isset($data->description)) {
    $fields[] = "description = ?";
    $values[] = $data->description;
}

if (empty($fields)) {
    echo json_encode(['success' => true, 'message' => 'No changes']);
    exit;
}

$values[] = $data->lesson_id;
$sql = "UPDATE lessons SET " . implode(", ", $fields) . " WHERE id = ?";
$stmt = $pdo->prepare($sql);

try {
    $stmt->execute($values);
    echo json_encode(['success' => true, 'message' => 'Lesson updated']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Update failed: ' . $e->getMessage()]);
}
?>
