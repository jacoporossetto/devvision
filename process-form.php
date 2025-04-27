<?php
/**
 * DevVision Form Processor
 * Architettura di gestione form con validazione avanzata e risposte standardizzate
 */

// Start session for submission tracking
session_start();

// Set response headers
header('Content-Type: application/json');

// Initial response structure
$response = [
    'success' => false,
    'message' => '',
    'data'    => null
];

// Check for duplicate submission
$submission_id = $_POST['submission_id'] ?? '';
if (!empty($submission_id)) {
    if (isset($_SESSION['processed_submissions'][$submission_id])) {
        $response['message'] = 'Richiesta già elaborata';
        $response['success'] = true; // Return success to avoid user confusion
        echo json_encode($response);
        exit;
    }
    
    $_SESSION['processed_submissions'][$submission_id] = time();
    
    // Cleanup old submissions (keep last 50)
    if (count($_SESSION['processed_submissions']) > 50) {
        $_SESSION['processed_submissions'] = array_slice($_SESSION['processed_submissions'], -50, 50, true);
    }
}

// Input validation for DevVision form fields
function validate_input($data) {
    $errors = [];
    
    // Mandatory fields validation with contextual error messages
    if (empty($data['name'])) {
        $errors[] = 'Il tuo nome è necessario per personalizzare la nostra comunicazione';
    }
    
    if (empty($data['email'])) {
        $errors[] = 'Un indirizzo email valido è essenziale per il nostro dialogo digitale';
    } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Il formato dell\'email fornita necessita di una revisione';
    }
    
    if (empty($data['projectType'])) {
        $errors[] = 'La tipologia di progetto aiuta a orientare la nostra conversazione creativa';
    }
    
    if (empty($data['message'])) {
        $errors[] = 'Una breve descrizione del tuo progetto è il punto di partenza del nostro percorso';
    } elseif (strlen($data['message']) < 10) {
        $errors[] = 'Una descrizione leggermente più articolata ci permetterà di comprendere meglio la tua visione';
    }
    
    if (empty($data['privacy']) || $data['privacy'] !== 'accepted') {
        $errors[] = 'Per procedere, è necessario acconsentire alla nostra politica sulla privacy';
    }
    
    // Honeypot check - silent failure for bots
    if (!empty($data['website'])) {
        return [];
    }
    
    return $errors;
}

// Sanitize user input
function sanitize_input($data) {
    $sanitized = [];
    
    foreach ($data as $key => $value) {
        if (is_string($value)) {
            $sanitized[$key] = htmlspecialchars(strip_tags(trim($value)));
        } else {
            $sanitized[$key] = $value;
        }
    }
    
    return $sanitized;
}

// CSRF verification
function verify_csrf() {
    $headers = getallheaders();
    $request_token = isset($headers['X-Requested-With']) ? $headers['X-Requested-With'] : '';
    
    if ($request_token !== 'XMLHttpRequest') {
        return false;
    }
    
    $referrer = $_SERVER['HTTP_REFERER'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    
    if (empty($referrer) || strpos($referrer, $host) === false) {
        return false;
    }
    
    return true;
}

// Check for POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Metodo non consentito';
    echo json_encode($response);
    exit;
}

// Verify CSRF protection
if (!verify_csrf()) {
    $response['message'] = 'Richiesta non valida';
    echo json_encode($response);
    exit;
}

// Get raw POST data
$post_data = $_POST;

// Validate input
$validation_errors = validate_input($post_data);
if (!empty($validation_errors)) {
    $response['message'] = 'Perfezionamento richiesto';
    $response['data'] = ['errors' => $validation_errors];
    echo json_encode($response);
    exit;
}

// Sanitize inputs
$sanitized_data = sanitize_input($post_data);

// Process form fields specific to DevVision
$name = $sanitized_data['name'];
$email = $sanitized_data['email'];
$projectType = $sanitized_data['projectType'] ?? 'Non specificato';
$budget = $sanitized_data['budget'] ?? 'Non specificato';
$message = $sanitized_data['message'];
$timestamp = date('Y-m-d H:i:s');

// Log submission for analytics and backup
$log_data = [
    'timestamp' => $timestamp,
    'name' => $name,
    'email' => $email,
    'projectType' => $projectType,
    'budget' => $budget,
    'source' => $_SERVER['HTTP_REFERER'] ?? 'direct',
    'ip' => $_SERVER['REMOTE_ADDR']
];

// Save to log file
$log_file = 'form_submissions.log';
if (file_exists($log_file) && is_writable($log_file)) {
    file_put_contents(
        $log_file, 
        json_encode($log_data) . PHP_EOL, 
        FILE_APPEND
    );
}

// Email configuration
$to = "jacopo.rossetto@devvision.it"; // Cambia con la tua email
$subject = "Nuova richiesta progettuale da $name";

// Email headers
$headers = [];
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-Type: text/html; charset=UTF-8";
$headers[] = "From: DevVision <noreply@devvision.it>";
$headers[] = "Reply-To: $name <$email>";
$headers[] = "X-Mailer: PHP/" . phpversion();

// Email body with DevVision aesthetic
$body = <<<HTML
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuova richiesta progettuale - DevVision</title>
    <style>
        @media screen and (max-width: 600px) {
            .container {
                width: 100% !important;
            }
        }
        body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #1E293B;
            margin: 0;
            padding: 0;
            background-color: #F8FAFC;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
        }
        .header {
            background: linear-gradient(135deg, #0A1930, #1E293B);
            padding: 30px 20px;
            color: #F8FAFC;
            text-align: center;
        }
        .header svg {
            width: 40px;
            height: 40px;
            margin-bottom: 15px;
        }
        .logo-text {
            font-family: 'Poppins', Arial, sans-serif;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.01em;
        }
        .content {
            padding: 30px 20px;
            background: #FFFFFF;
        }
        .field {
            margin-bottom: 20px;
        }
        .label {
            font-family: 'Poppins', Arial, sans-serif;
            font-weight: 600;
            font-size: 14px;
            color: #0A1930;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .value {
            font-size: 16px;
            color: #334155;
            line-height: 1.6;
        }
        .message-box {
            background: #F8FAFC;
            padding: 20px;
            border-left: 3px solid #00E0FF;
            margin-top: 5px;
        }
        .footer {
            background: #F1F5F9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748B;
        }
        .accent {
            color: #00E0FF;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0L40 20L20 40L0 20L20 0Z" fill="#0A1930"/>
                <path d="M20 10L30 20L20 30L10 20L20 10Z" fill="#00E0FF"/>
            </svg>
            <div class="logo-text">DevVision</div>
            <h2 style="margin-top:15px;font-weight:500;font-size:18px;">Nuova Richiesta Progettuale</h2>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">Nome</div>
                <div class="value">{$name}</div>
            </div>
            <div class="field">
                <div class="label">Email</div>
                <div class="value">{$email}</div>
            </div>
            <div class="field">
                <div class="label">Tipologia Progetto</div>
                <div class="value">{$projectType}</div>
            </div>
            <div class="field">
                <div class="label">Budget Indicativo</div>
                <div class="value">{$budget}</div>
            </div>
            <div class="field">
                <div class="label">Descrizione Progetto</div>
                <div class="message-box">{$message}</div>
            </div>
            <div class="field">
                <div class="label">Data Richiesta</div>
                <div class="value">{$timestamp}</div>
            </div>
        </div>
        <div class="footer">
            <p>Questa notifica è stata generata automaticamente dal sistema di contatti <span class="accent">DevVision</span>.</p>
        </div>
    </div>
</body>
</html>
HTML;

// Send email with error checking
try {
    $mail_sent = mail($to, $subject, $body, implode("\r\n", $headers));
    
    if ($mail_sent) {
        $response['success'] = true;
        $response['message'] = 'Messaggio inviato con successo!';
        $response['data'] = [
            'timestamp' => $timestamp
        ];
    } else {
        throw new Exception('Mail server error');
    }
} catch (Exception $e) {
    // Log error
    error_log('Email sending error: ' . $e->getMessage());
    
    $response['message'] = 'Si è verificato un problema durante l\'invio. Ti preghiamo di riprovare tra qualche istante.';
    $response['data'] = [
        'error_type' => 'mail_error'
    ];
}

// Return JSON response
echo json_encode($response);
exit;