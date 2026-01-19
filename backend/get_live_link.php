<?php
require 'cors.php';
require 'db.php';

$stmt = $pdo->prepare("SELECT value FROM settings WHERE key_name = 'live_meeting_url'");
$stmt->execute();
$result = $stmt->fetch();

echo json_encode(['url' => $result ? $result['value'] : '']);
?>
