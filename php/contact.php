<?php
/**
 * RaufixBaba — iletişim formu işleyicisi
 * ---------------------------------------------------------------
 * Çalışması için PHP 7.4+ destekli bir sunucuda barındırılmalıdır.
 * GitHub Pages STATİK olduğu için bu dosya orada çalışmaz; site bu
 * durumda formu otomatik olarak GitHub issue akışına çevirir.
 *
 * Kurulum: php/config.php içindeki $MAIL_TO değerini değiştir.
 */

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

// --- basit flood koruması: aynı oturumdan 30 saniyede 1 mesaj
$now = time();
if (isset($_SESSION['last_mail']) && ($now - (int) $_SESSION['last_mail']) < 30) {
    respond(false, 'Çok hızlısın :d 30 saniye sonra tekrar dene.', 429);
}

// --- bal küpü (bot tuzağı)
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

// başlık enjeksiyonunu engelle
$clean = static function (string $value): string {
    return str_replace(["\r", "\n", "%0a", "%0d"], ' ', $value);
};

$subject = '=?UTF-8?B?' . base64_encode('Bio sitesi mesajı — ' . $clean($name)) . '?=';
$body = "Yeni mesaj var:\n\n"
      . "Ad     : {$name}\n"
      . "E-posta: {$email}\n"
      . "Tarih  : " . date('d.m.Y H:i') . " (sunucu saati)\n"
      . "IP     : " . ($_SERVER['REMOTE_ADDR'] ?? 'bilinmiyor') . "\n"
      . str_repeat('-', 42) . "\n\n"
      . $message . "\n";

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Bio Site <' . $MAIL_FROM . '>',
    'Reply-To: ' . $clean($email),
    'X-Mailer: RaufixBaba-Bio'
];

$sent = @mail($MAIL_TO, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    respond(false, 'Sunucu maili gönderemedi. GitHub üzerinden yazabilirsin.', 500);
}

$_SESSION['last_mail'] = $now;
respond(true, 'Mesaj gönderildi.');
