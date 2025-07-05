<?php
header('Content-Type: application/json');

// Configuración de la base de datos
$db_host = 'localhost';
$port = "5432";
$db_name = 'centros_cientificos';
$db_user = 'postgres';
$db_pass = '123';

// Conexión a la base de datos
try {
    $pdo = new PDO("pgsql:host=$db_host;port=$port;dbname=$db_name", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verificar si la tabla existe
    $tableCheck = $pdo->query("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'centros_cientificos')");
    $tableExists = $tableCheck->fetchColumn();
    
    if (!$tableExists) {
        echo json_encode(['error' => 'La tabla centros_cientificos no existe']);
        exit;
    }
} catch (PDOException $e) {
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
    exit;
}

// Obtener acción solicitada
$action = $_GET['action'] ?? '';

// Procesar acciones
switch ($action) {
    case 'get_centros':
        getCentros($pdo);
        break;
    default:
        echo json_encode(['error' => 'Acción no válida']);
        break;
}

// Obtener todos los centros científicos
function getCentros($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                id, nombre, tipo, ciudad, descripcion, direccion, 
                horario, telefono, web, facebook, imagen,
                ST_AsGeoJSON(geom)::json AS geometry
            FROM centros_cientificos
        ");
        
        if ($stmt === false) {
            echo json_encode(['error' => 'Error en la consulta SQL']);
            return;
        }
        
        $centros = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Verificar que la geometría existe
            if (!isset($row['geometry'])) {
                continue;
            }
            
            $centros[] = [
                'type' => 'Feature',
                'properties' => [
                    'id' => $row['id'],
                    'nombre' => $row['nombre'],
                    'tipo' => $row['tipo'],
                    'ciudad' => $row['ciudad'],
                    'descripcion' => $row['descripcion'],
                    'direccion' => $row['direccion'],
                    'horario' => $row['horario'],
                    'telefono' => $row['telefono'],
                    'web' => $row['web'],
                    'facebook' => $row['facebook'],
                    'imagen' => $row['imagen']
                ],
                'geometry' => json_decode($row['geometry'], true)
            ];
        }
        
        if (empty($centros)) {
            echo json_encode(['error' => 'No se encontraron centros científicos']);
            return;
        }
        
        echo json_encode($centros);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Error al obtener centros: ' . $e->getMessage()]);
    }
}
?>