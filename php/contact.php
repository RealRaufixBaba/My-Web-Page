<?php
declare(strict_types=1);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require __DIR__ . '/config.php';

function respond(bool $ok, string $message = '', int $code = 200): void
{
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'error' => $ok ? null : $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Sadece POST istekleri kabul edilir.', 405);
}

$now = time();
if (isset($_SESSION['last_mail']) && ($now - (int) $_SESSION['last_mail']) < 30) {
    respond(false, 'Çok hızlısın :d 30 saniye sonra tekrar dene.', 429);
}

if (!empty($_POST['website'])) {
    respond(true, 'Teşekkürler.');
}

$name    = trim((string) ($_POST['name'] ?? ''));
$email   = trim((string) ($_POST['email'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

$errors = [];
if (mb_strlen($name) < 2 || mb_strlen($name) > 60) {
    $errors[] = 'Adın 2-60 karakter arasında olmalı.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 120) {
    $errors[] = 'Geçerli bir e-posta adresi yaz.';
}
if (mb_strlen($message) < 10 || mb_strlen($message) > 1200) {
    $errors[] = 'Mesaj 10-1200 karakter arasında olmalı.';
}

if ($errors) {
    respond(false, $errors[0], 422);
}

$clean = static function (string $value): string {
    return str_replace(["\r", "\n", "%0a", "%0d"], ' ', $value);
};

$subject = '=?UTF-8?B?' . base64_encode('Site mesajı: ' . $clean($name)) . '?=';
$body = "Yeni mesaj var:\n\n"
      . "Ad     : {$name}\n"
      . "E-posta: {$email}\n"
      . "Tarih  : " . date('d.m.Y H:i') . "\n"
      . "IP     : " . ($_SERVER['REMOTE_ADDR'] ?? 'bilinmiyor') . "\n"
      . str_repeat('-', 42) . "\n\n"
      . $message . "\n";

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Site <' . $MAIL_FROM . '>',
    'Reply-To: ' . $clean($email),
    'X-Mailer: PHP'
];

$sent = @mail($MAIL_TO, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    respond(false, 'Sunucu maili gönderemedi. GitHub profilinden yazabilirsin.', 500);
}

$_SESSION['last_mail'] = $now;
respond(true, 'Mesaj gönderildi.');
