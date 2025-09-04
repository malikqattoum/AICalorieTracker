<?php

// Configuration
$config = [
    'node_server' => 'http://localhost:3002',
    'timeout' => 30,
    'retry_attempts' => 3,
    'retry_delay' => 1,
    'allowed_ips' => ['127.0.0.1', '::1'],
    'max_memory' => 128 * 1024 * 1024, // 128MB
    'max_connections' => 10,
    'log_file' => 'logs/proxy.log'
];

// RequestHandler class for processing incoming HTTP requests
class RequestHandler {
    public function getMethod() {
        return $_SERVER['REQUEST_METHOD'];
    }

    public function getHeaders() {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0) {
                $header = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
                $headers[$header] = $value;
            }
        }
        return $headers;
    }

    public function getBody() {
        return file_get_contents('php://input');
    }

    public function getQueryString() {
        return $_SERVER['QUERY_STRING'] ?? '';
    }
}

// ProxyEngine class for forwarding requests to localhost:3002 using cURL
class ProxyEngine {
    private $config;

    public function __construct($config) {
        $this->config = $config;
    }

    public function forward($method, $url, $headers, $body, $query) {
        $ch = curl_init();
        $fullUrl = $this->config['node_server'] . $url;
        if ($query) {
            $fullUrl .= '?' . $query;
        }
        curl_setopt($ch, CURLOPT_URL, $fullUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->config['timeout']);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($body) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }
        $headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        $headerArray = [];
        foreach ($headers as $key => $value) {
            $headerArray[] = "$key: $value";
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headerArray);
        $fullResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Parse headers and body
        $headerEnd = strpos($fullResponse, "\r\n\r\n");
        if ($headerEnd !== false) {
            $headersString = substr($fullResponse, 0, $headerEnd);
            $responseBody = substr($fullResponse, $headerEnd + 4);
        } else {
            $headersString = '';
            $responseBody = $fullResponse;
        }

        // Parse headers into array
        $headerLines = explode("\r\n", $headersString);
        array_shift($headerLines); // Remove status line
        $responseHeaders = [];
        foreach ($headerLines as $line) {
            if (strpos($line, ': ') !== false) {
                list($key, $value) = explode(': ', $line, 2);
                $responseHeaders[$key] = $value;
            }
        }

        return ['response' => $responseBody, 'headers' => $responseHeaders, 'code' => $httpCode, 'error' => $error];
    }
}

// ResponseProcessor class for handling and returning responses
class ResponseProcessor {
    public function process($result) {
        if ($result['error']) {
            http_response_code(502);
            echo json_encode(['error' => 'Proxy error: ' . $result['error']]);
            return;
        }
        http_response_code($result['code']);

        // Set response headers
        if (isset($result['headers'])) {
            foreach ($result['headers'] as $key => $value) {
                // Skip headers that PHP handles automatically
                if (!in_array(strtolower($key), ['content-length', 'transfer-encoding', 'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'upgrade'])) {
                    header("$key: $value");
                }
            }
        }

        echo $result['response'];
    }
}

// ErrorHandler class for managing Node.js unavailability
class ErrorHandler {
    private $config;

    public function __construct($config) {
        $this->config = $config;
    }

    public function handleUnavailable() {
        http_response_code(503);
        echo json_encode(['error' => 'Node.js server is unavailable']);
    }

    public function log($message) {
        $logFile = $this->config['log_file'];
        $timestamp = date('Y-m-d H:i:s');
        file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
    }
}

// SecurityManager class for access control and validation
class SecurityManager {
    private $config;

    public function __construct($config) {
        $this->config = $config;
    }

    public function validateAccess() {
        $clientIp = $_SERVER['REMOTE_ADDR'];
        if (!in_array($clientIp, $this->config['allowed_ips'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            return false;
        }
        return true;
    }
}

// ResourceManager class for memory and connection management
class ResourceManager {
    private $config;
    private $connections = 0;

    public function __construct($config) {
        $this->config = $config;
    }

    public function checkResources() {
        if (memory_get_usage() > $this->config['max_memory']) {
            return false;
        }
        if ($this->connections >= $this->config['max_connections']) {
            return false;
        }
        $this->connections++;
        return true;
    }

    public function releaseConnection() {
        $this->connections--;
    }
}

// Main execution logic
try {
    $requestHandler = new RequestHandler();
    $method = $requestHandler->getMethod();
    $headers = $requestHandler->getHeaders();
    $body = $requestHandler->getBody();
    $query = $requestHandler->getQueryString();
    $url = $_SERVER['REQUEST_URI'];
    
    $resourceManager = new ResourceManager($config);
    if (!$resourceManager->checkResources()) {
        http_response_code(503);
        echo json_encode(['error' => 'Resource limit exceeded']);
        exit;
    }

    $proxyEngine = new ProxyEngine($config);
    $errorHandler = new ErrorHandler($config);

    $attempts = 0;
    $result = null;
    while ($attempts < $config['retry_attempts']) {
        $result = $proxyEngine->forward($method, $url, $headers, $body, $query);
        if (!$result['error'] && $result['code'] < 500) {
            break;
        }
        $attempts++;
        if ($attempts < $config['retry_attempts']) {
            sleep($config['retry_delay']);
        }
    }

    if ($result['error'] || $result['code'] >= 500) {
        $errorHandler->handleUnavailable();
        $errorHandler->log("Node.js unavailable: " . $result['error']);
    } else {
        $responseProcessor = new ResponseProcessor();
        $responseProcessor->process($result);
    }

    $resourceManager->releaseConnection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    if (isset($errorHandler)) {
        $errorHandler->log("Exception: " . $e->getMessage());
    }
}