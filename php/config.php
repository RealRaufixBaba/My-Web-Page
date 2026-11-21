<?php
/**
 * Form ayarları — kendi bilgilerinle güncelle.
 * GitHub Pages'te bu dosya çalışmaz, PHP hosting'de çalışır.
 */

// Mesajların düşeceği adres
$MAIL_TO = getenv('MAIL_TO') ?: 'ornek@mail.com';

// From adresi: alan adına ait bir adres olmalı (spam'e düşmemesi için)
$MAIL_FROM = getenv('MAIL_FROM') ?: 'no-reply@example.com';
