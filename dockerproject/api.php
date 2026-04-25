<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
error_reporting(0); 

$SECRET = "my_secret_key";
$pdo = new PDO("mysql:host=db;port=3306;dbname=app", "root", "root");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

if (!isset($_GET['action'])) {
    echo json_encode(["error" => "no action"]);
    exit;
}


function generateJWT($data, $secret) {
    return base64_encode(json_encode($data));
}
function verifyJWT($token, $secret) {
    return json_decode(base64_decode($token), true);
}


if ($_GET['action'] != 'login') {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        echo json_encode(["error" => "unauthorized"]);
        exit;
    }
    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $user = verifyJWT($token, $SECRET);
    if (!$user) {
        echo json_encode(["error" => "bad token"]);
        exit;
    }
}

if ($_GET['action'] == 'login') {
    $data = json_decode(file_get_contents("php://input"), true);

    $stmt = $pdo->prepare("SELECT * FROM users WHERE login = :login LIMIT 1");
    $stmt->execute([':login' => $data['login']]);
    $user = $stmt->fetch();

    
    $debug = [
        'input_login' => $data['login'],
        'input_password' => $data['password'], 
        'user_found' => $user ? true : false,
        'db_password_hash' => $user ? $user['password'] : 'no user',
        'verify_result' => $user ? (password_verify($data['password'], $user['password']) ? 'true' : 'false') : 'no user'
    ];

    if ($user && password_verify($data['password'], $user['password'])) {
        $token = generateJWT(["id"=>$user['id'], "login"=>$user['login'], "role"=>$user['role']], $SECRET);
        echo json_encode(["token" => $token, "debug" => $debug]);
        exit;
    } else {
        echo json_encode(["error" => "invalid", "debug" => $debug]);
        exit;
    }
}


if ($_GET['action'] == 'me') {
    echo json_encode($user);
    exit;
}


if ($_GET['action'] == 'users') {
    if ($user['role'] != 'admin') {
        echo json_encode(["error" => "forbidden"]);
        exit;
    }
    echo json_encode($pdo->query("SELECT id, login, role FROM users")->fetchAll());
    exit;
}


if ($_GET['action'] == 'set_role') {
    if ($user['role'] != 'admin') {
        echo json_encode(["error" => "forbidden"]);
        exit;
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("UPDATE users SET role=? WHERE id=?");
    $stmt->execute([$data['role'], $data['id']]);
    echo json_encode(["ok" => true]);
    exit;
}


if ($_GET['action'] == 'create_plan') {
    if ($user['role'] != 'curator') {
        echo json_encode(["error" => "forbidden"]);
        exit;
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("INSERT INTO plans (user_id, group_name, year) VALUES (?,?,?)");
    $stmt->execute([$user['id'], $data['group'], $data['year']]);
    $planId = $pdo->lastInsertId();

    
    $tpl = $pdo->query("SELECT content FROM templates ORDER BY id DESC LIMIT 1")->fetch();
    $defaultRows = [
        ['Кураторский час', '01.09', $user['login'], $data['group'], 'Гражданское'],
        ['Спортивное мероприятие', '15.10', $user['login'], $data['group'], 'Физическое'],
        ['Экологическая акция', '20.04', $user['login'], $data['group'], 'Экологическое']
    ];
    $ins = $pdo->prepare("INSERT INTO plan_rows (plan_id, module, deadline, responsible, participants, direction) VALUES (?,?,?,?,?,?)");
    foreach ($defaultRows as $r) {
        $ins->execute([$planId, $r[0], $r[1], $r[2], $r[3], $r[4]]);
    }
    echo json_encode(["ok" => true, "plan_id" => $planId]);
    exit;
}


if ($_GET['action'] == 'load_plan') {
    $planId = $_GET['plan_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT * FROM plan_rows WHERE plan_id=?");
    $stmt->execute([$planId]);
    echo json_encode($stmt->fetchAll());
    exit;
}


if ($_GET['action'] == 'add_plan_row') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("INSERT INTO plan_rows (plan_id, module, deadline, responsible, participants, direction) VALUES (?,?,?,?,?,?)");
    $stmt->execute([$data['plan_id'], $data['module'], $data['deadline'], $data['responsible'], $data['participants'], $data['direction']]);
    echo json_encode(["ok" => true]);
    exit;
}


if ($_GET['action'] == 'mark_plan_ready') {
    $data = json_decode(file_get_contents("php://input"), true);
    $pdo->prepare("UPDATE plans SET status='ready' WHERE id=?")->execute([$data['plan_id']]);
    echo json_encode(["ok" => true]);
    exit;
}


if ($_GET['action'] == 'events') {
    if ($user['role'] == 'curator') {
        $stmt = $pdo->prepare("SELECT * FROM events WHERE user_id=? ORDER BY date");
        $stmt->execute([$user['id']]);
    } else {
        $stmt = $pdo->query("SELECT * FROM events ORDER BY date");
    }
    echo json_encode($stmt->fetchAll());
    exit;
}


if ($_GET['action'] == 'add_event') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("INSERT INTO events (title, date, status, direction, participants, user_id) VALUES (?,?,?,?,?,?)");
    $stmt->execute([$data['title'], $data['date'], $data['status'] ?? 'planned', $data['direction'], $data['participants'] ?? 0, $user['id']]);
    echo json_encode(["ok" => true]);
    exit;
}


if ($_GET['action'] == 'update_event') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("UPDATE events SET status=?, comment=?, participants=?, success=? WHERE id=? AND user_id=?");
    $stmt->execute([$data['status'], $data['comment'] ?? '', $data['participants'] ?? 0, $data['success'] ?? 'neutral', $data['id'], $user['id']]);
    echo json_encode(["ok" => true]);
    exit;
}


if ($_GET['action'] == 'save_social_passport') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("REPLACE INTO social_passports (user_id, content) VALUES (?,?)");
    $stmt->execute([$user['id'], $data['text']]);
    echo json_encode(["ok" => true]);
    exit;
}
if ($_GET['action'] == 'get_social_passport') {
    $stmt = $pdo->prepare("SELECT content FROM social_passports WHERE user_id=?");
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();
    echo json_encode(["text" => $row['content'] ?? '']);
    exit;
}


if ($_GET['action'] == 'generate_report') {
    $events = $pdo->prepare("SELECT * FROM events WHERE user_id=?");
    $events->execute([$user['id']]);
    $events = $events->fetchAll();

    $total = count($events);
    $done = 0;
    $directions = [];
    $success = [];
    $fail = [];
    foreach ($events as $e) {
        if ($e['status'] == 'conducted') $done++;
        if (!isset($directions[$e['direction']])) $directions[$e['direction']] = 0;
        $directions[$e['direction']]++;
        if ($e['success'] == 'good') $success[] = $e;
        if ($e['success'] == 'bad') $fail[] = $e;
    }
    $percent = $total ? round($done / $total * 100) : 0;

    
    $planStmt = $pdo->prepare("SELECT * FROM plans WHERE user_id=? ORDER BY id DESC LIMIT 1");
    $planStmt->execute([$user['id']]);
    $plan = $planStmt->fetch();
    $planFact = [];
    if ($plan) {
        $rows = $pdo->prepare("SELECT * FROM plan_rows WHERE plan_id=?");
        $rows->execute([$plan['id']]);
        $rows = $rows->fetchAll();
        foreach ($rows as $r) {
            $planned = 1;
            $fact = 0;
            
            foreach ($events as $e) {
                if (stripos($e['title'], $r['module']) !== false && $e['status'] == 'conducted') {
                    $fact = 1;
                    break;
                }
            }
            $planFact[] = [
                'module' => $r['module'],
                'planned' => $planned,
                'fact' => $fact,
                'percent' => $planned ? round($fact/$planned*100) : 0
            ];
        }
    }

    $text = "САМООТЧЕТ КУРАТОРА\n\n";
    $text .= "Всего мероприятий: $total\n";
    $text .= "Проведено: $done ($percent%)\n\n";
   
    arsort($directions);
    $maxDir = array_key_first($directions);
    asort($directions);
    $minDir = array_key_first($directions);

    $text .= "Успешные мероприятия:\n";
    foreach (array_slice($success, 0, 3) as $s) $text .= "- ".$s['title']."\n";
    $text .= "\nПроблемные мероприятия:\n";
    foreach (array_slice($fail, 0, 3) as $f) $text .= "- ".$f['title']."\n";
    $text .= "\nЛучшее направление: $maxDir\n";
    $text .= "Слабое направление: $minDir\n";

    echo json_encode([
        "text" => $text,
        "percent" => $percent,
        "directions" => $directions,
        "planFact" => $planFact
    ]);
    exit;
}


if ($_GET['action'] == 'export_report_docx') {
    $period = $_GET['period'] ?? '2025-2026';
    $reportText = $_GET['text'] ?? 'Отчёт';
    $planFact = json_decode($_GET['planFact'] ?? '[]', true);

    $zip = new ZipArchive();
    $tmp = tempnam(sys_get_temp_dir(), 'docx');
    $zip->open($tmp, ZipArchive::CREATE);
    $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    
    $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>';
    $xml .= '<w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Отчёт куратора за '.htmlspecialchars($period).'</w:t></w:r></w:p>';
    $xml .= '<w:p><w:r><w:t>'.htmlspecialchars($reportText).'</w:t></w:r></w:p>';
    
    if (!empty($planFact)) {
       
        $xml .= '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/></w:tblPr><w:tblGrid><w:gridCol w:w="2500"/><w:gridCol w:w="1250"/><w:gridCol w:w="1250"/></w:tblGrid>';
        $xml .= '<w:tr><w:tc><w:p><w:r><w:t>Модуль</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>План</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Факт</w:t></w:r></w:p></w:tc></w:tr>';
        foreach ($planFact as $row) {
            $xml .= '<w:tr>';
            $xml .= '<w:tc><w:p><w:r><w:t>'.htmlspecialchars($row['module']).'</w:t></w:r></w:p></w:tc>';
            $xml .= '<w:tc><w:p><w:r><w:t>'.htmlspecialchars($row['planned']).'</w:t></w:r></w:p></w:tc>';
            $xml .= '<w:tc><w:p><w:r><w:t>'.htmlspecialchars($row['fact']).'</w:t></w:r></w:p></w:tc>';
            $xml .= '</w:tr>';
        }
        $xml .= '</w:tbl>';
    }
    $xml .= '</w:body></w:document>';
    $zip->addFromString('word/document.xml', $xml);
    $zip->close();

    header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    header('Content-Disposition: attachment; filename="report.docx"');
    readfile($tmp);
    unlink($tmp);
    exit;
}


if ($_GET['action'] == 'export_report_pdf') {
    $period = $_GET['period'] ?? '2025-2026';
    $text = $_GET['text'] ?? '';
    $planFact = json_decode($_GET['planFact'] ?? '[]', true);
    ?>
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><title>Отчёт</title></head>
    <body onload="window.print()">
        <h1>Отчёт за <?= htmlspecialchars($period) ?></h1>
        <pre><?= htmlspecialchars($text) ?></pre>
        <?php if (!empty($planFact)): ?>
        <table border="1" cellpadding="5">
            <tr><th>Модуль</th><th>План</th><th>Факт</th><th>%</th></tr>
            <?php foreach ($planFact as $r): ?>
            <tr><td><?= htmlspecialchars($r['module']) ?></td><td><?= $r['planned'] ?></td><td><?= $r['fact'] ?></td><td><?= $r['percent'] ?>%</td></tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </body></html>
    <?php
    exit;
}


if ($_GET['action'] == 'summary_data') {
    if ($user['role'] != 'organizer' && $user['role'] != 'admin') {
        echo json_encode(["error" => "forbidden"]);
        exit;
    }
    $data = $pdo->query("SELECT u.login, p.group_name, p.status, p.year FROM plans p JOIN users u ON p.user_id=u.id")->fetchAll();
    echo json_encode($data);
    exit;
}


if ($_GET['action'] == 'export_summary_excel') {
    if ($user['role'] != 'organizer' && $user['role'] != 'admin') {
        echo json_encode(["error" => "forbidden"]);
        exit;
    }
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="summary.csv"');
    $output = fopen('php://output', 'w');
    fputcsv($output, ['Куратор', 'Группа', 'Статус', 'Год']);
    $data = $pdo->query("SELECT u.login, p.group_name, p.status, p.year FROM plans p JOIN users u ON p.user_id=u.id")->fetchAll();
    foreach ($data as $row) fputcsv($output, [$row['login'], $row['group_name'], $row['status'], $row['year']]);
    fclose($output);
    exit;
}


if ($_GET['action'] == 'get_templates') {
    echo json_encode($pdo->query("SELECT * FROM templates")->fetchAll());
    exit;
}
if ($_GET['action'] == 'save_template') {
    if ($user['role'] != 'admin') {
        echo json_encode(["error" => "forbidden"]);
        exit;
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("INSERT INTO templates (user, content) VALUES (?,?)");
    $stmt->execute([$user['login'], $data['content']]);
    echo json_encode(["ok" => true]);
    exit;
}


if ($_GET['action'] == 'dnevnik') {
    $response = @file_get_contents("http://127.0.0.1:8000/user/me");
    if (!$response) {
        echo json_encode(["error" => "dnevnik offline"]);
    } else {
        echo $response;
    }
    exit;
}

echo json_encode(["error" => "unknown action"]);
if ($_GET['action'] == 'login') {
    $data = json_decode(file_get_contents("php://input"), true);

    $stmt = $pdo->prepare("SELECT * FROM users WHERE login = :login LIMIT 1");
    $stmt->execute([':login' => $data['login']]);
    $user = $stmt->fetch();


    error_log("Login attempt: " . json_encode($data));
    error_log("User found: " . ($user ? 'yes' : 'no'));

    if ($user) {
        error_log("DB password: " . $user['password']);
        $verify = password_verify($data['password'], $user['password']);
        error_log("Password verify result: " . ($verify ? 'true' : 'false'));
        

        
        if ($data['password'] === $user['password'] || $verify) {
            $token = generateJWT([
                "id"   => $user['id'],
                "login"=> $user['login'],
                "role" => $user['role']
            ], $SECRET);
            echo json_encode(["token" => $token]);
            exit;
        }
    }
    echo json_encode(["error" => "invalid"]);
    exit;
}