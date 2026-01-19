<?php
require 'cors.php';
require 'db.php';

$user_id = $_POST['user_id'] ?? null;
$title = $_POST['title'] ?? null;

if (!$user_id || !$title || !isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing data or file']);
    exit;
}

// Auth check
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$target_dir = "uploads/";
$filename = uniqid() . "_" . basename($_FILES["file"]["name"]);
$target_file = $target_dir . $filename;

if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
    // Save to DB
    // Use full URL for simplicity in frontend
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $file_url = "$protocol://$host/uploads/$filename";

    $stmt = $pdo->prepare("INSERT INTO library (title, file_path) VALUES (?, ?)");
    try {
        $stmt->execute([$title, $file_url]);
        echo json_encode(['success' => true, 'message' => 'File uploaded', 'url' => $file_url]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'DB Error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to move uploaded file']);
}
?>
