const amqp = require('amqplib');
const fs = require('fs');

// RabbitMQ Configuration
// Auto-detect environment: fallback to localhost when Docker service name not resolvable
let RABBITMQ_URL = process.env.RABBITMQ_URL;
if (!RABBITMQ_URL) {
    // Default: localhost for development
    RABBITMQ_URL = 'amqp://root:root@localhost:5672';
} else if (RABBITMQ_URL.includes('bicap-message-queue')) {
    // Check if running inside Docker
    const isDocker = process.env.DOCKER_ENV === 'true' || 
                     process.env.HOSTNAME?.includes('container') ||
                     (process.platform !== 'win32' && fs.existsSync('/.dockerenv'));
    
    if (!isDocker) {
        console.log('⚠️  Detected local environment, using localhost instead of bicap-message-queue');
        RABBITMQ_URL = RABBITMQ_URL.replace('bicap-message-queue', 'localhost');
    }
}
const NOTIFICATION_QUEUE = 'farm.notifications';
const NOTIFICATION_EXCHANGE = 'notifications.exchange';
const RABBITMQ_ENABLED = process.env.RABBITMQ_ENABLED !== 'false'; // Default to true, can disable with RABBITMQ_ENABLED=false

// In-memory notification storage
const notifications = [];
const MAX_NOTIFICATIONS = 100;

// Connected SSE clients
const sseClients = new Set();

// RabbitMQ connection
let channel = null;
let connection = null;
let isConnecting = false;
let retryCount = 0;
const MAX_RETRY_COUNT = 10;
const INITIAL_RETRY_DELAY = 5000;
const MAX_RETRY_DELAY = 60000;

/**
 * Initialize RabbitMQ connection and consume messages
 */
async function initializeRabbitMQ() {
    // Check if RabbitMQ is disabled
    if (!RABBITMQ_ENABLED) {
        console.log('⚠️  RabbitMQ is disabled (RABBITMQ_ENABLED=false). Notifications will work in-memory only.');
        return;
    }

    // Prevent simultaneous connection attempts
    if (isConnecting) {
        return;
    }

    // Check retry count
    if (retryCount >= MAX_RETRY_COUNT) {
        console.error(`❌ RabbitMQ: Max retry count (${MAX_RETRY_COUNT}) reached. Stopping retry attempts.`);
        console.log('   Notifications will work in-memory only. To re-enable, restart the server.');
        return;
    }

    isConnecting = true;
    
    try {
        // Log URL with hidden password for security
        const logUrl = RABBITMQ_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
        console.log(`[${retryCount + 1}/${MAX_RETRY_COUNT}] Connecting to RabbitMQ at: ${logUrl}`);
        
        // Add timeout for connection (10 seconds)
        const connectPromise = amqp.connect(RABBITMQ_URL, {
            heartbeat: 60
        });
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
        );
        
        connection = await Promise.race([connectPromise, timeoutPromise]);
        channel = await connection.createChannel();
        
        // Declare exchange and queue
        await channel.assertExchange(NOTIFICATION_EXCHANGE, 'topic', { durable: true });
        await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
        
        // Bind queue to exchange with routing patterns
        await channel.bindQueue(NOTIFICATION_QUEUE, NOTIFICATION_EXCHANGE, 'farm.#');
        await channel.bindQueue(NOTIFICATION_QUEUE, NOTIFICATION_EXCHANGE, 'order.#');
        await channel.bindQueue(NOTIFICATION_QUEUE, NOTIFICATION_EXCHANGE, 'shipping.#');
        
        console.log(`✓ RabbitMQ connected. Listening on queue: ${NOTIFICATION_QUEUE}`);
        retryCount = 0; // Reset retry count on success
        
        // Start consuming messages
        channel.consume(NOTIFICATION_QUEUE, (msg) => {
            if (msg) {
                try {
                    const notification = JSON.parse(msg.content.toString());
                    handleNotification(notification);
                    channel.ack(msg);
                } catch (error) {
                    console.error('Error processing notification:', error);
                    channel.nack(msg, false, false); // Don't requeue
                }
            }
        });

        // Handle connection errors
        connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err.message);
            isConnecting = false;
        });

        connection.on('close', () => {
            console.log('RabbitMQ connection closed.');
            isConnecting = false;
            channel = null;
            connection = null;
            
            // Retry với exponential backoff (chỉ khi chưa đạt max retry)
            // retryCount sẽ được tăng trong catch block của initializeRabbitMQ
            if (retryCount < MAX_RETRY_COUNT) {
                const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
                console.log(`Reconnecting in ${delay / 1000} seconds...`);
                setTimeout(() => {
                    initializeRabbitMQ();
                }, delay);
            } else {
                console.error(`❌ RabbitMQ: Max retry count reached. Stopping retry attempts.`);
            }
        });

        isConnecting = false;

    } catch (error) {
        isConnecting = false;
        retryCount++;
        
        // Tính toán delay với exponential backoff
        const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount - 1), MAX_RETRY_DELAY);
        
        // Phân tích lỗi và đưa ra gợi ý
        let errorHint = '';
        if (error.message.includes('ACCESS_REFUSED') || error.message.includes('403')) {
            errorHint = '   💡 Hint: Check RabbitMQ username/password. Default: root:root';
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            errorHint = '   💡 Hint: RabbitMQ server may not be running. Check with: docker ps | grep rabbitmq';
        } else if (error.message.includes('timeout')) {
            errorHint = '   💡 Hint: RabbitMQ server may be slow to respond or unreachable';
        }
        
        if (retryCount < MAX_RETRY_COUNT) {
            console.error(`Failed to connect to RabbitMQ (attempt ${retryCount}/${MAX_RETRY_COUNT}): ${error.message}`);
            if (errorHint) console.log(errorHint);
            console.log(`Retrying in ${delay / 1000} seconds...`);
            console.log('   Server will continue running. Notifications will work in-memory only until RabbitMQ is available.');
            setTimeout(initializeRabbitMQ, delay);
        } else {
            console.error(`❌ RabbitMQ: Max retry count reached. Stopping retry attempts.`);
            console.log('   Notifications will work in-memory only. To re-enable, restart the server.');
            if (errorHint) console.log(errorHint);
            const logUrl = RABBITMQ_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
            console.log(`   Current RABBITMQ_URL: ${logUrl}`);
        }
    }
}

/**
 * Handle incoming notification from RabbitMQ
 */
function handleNotification(notification) {
    // Add timestamp if not present
    if (!notification.timestamp) {
        notification.timestamp = new Date().toISOString();
    }
    
    // Add ID if not present
    if (!notification.id) {
        notification.id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    console.log('📬 New notification:', notification);
    
    // Store notification
    notifications.unshift(notification);
    
    // Keep only recent notifications
    if (notifications.length > MAX_NOTIFICATIONS) {
        notifications.pop();
    }
    
    // Broadcast to all connected SSE clients
    broadcastToClients(notification);
}

/**
 * Broadcast notification to all SSE clients
 */
function broadcastToClients(notification) {
    sseClients.forEach(client => {
        try {
            client.write(`data: ${JSON.stringify(notification)}\n\n`);
        } catch (error) {
            console.error('Error sending to SSE client:', error);
            sseClients.delete(client);
        }
    });
}

/**
 * SSE endpoint handler - establishes connection for real-time notifications
 */
exports.streamNotifications = (req, res) => {
    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    // Send initial connection success message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

    // Send recent notifications to new client
    const recentNotifications = notifications.slice(0, 10);
    recentNotifications.reverse().forEach(notification => {
        res.write(`data: ${JSON.stringify(notification)}\n\n`);
    });

    // Add client to set
    sseClients.add(res);
    console.log(`New SSE client connected. Total clients: ${sseClients.size}`);

    // Remove client on disconnect
    req.on('close', () => {
        sseClients.delete(res);
        console.log(`SSE client disconnected. Total clients: ${sseClients.size}`);
    });
};

/**
 * Get all notifications (REST endpoint)
 */
exports.getAllNotifications = (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json({
        success: true,
        total: notifications.length,
        notifications: notifications.slice(0, limit)
    });
};

/**
 * Mark notification as read
 */
exports.markAsRead = (req, res) => {
    const { id } = req.params;
    const notification = notifications.find(n => n.id === id);
    
    if (notification) {
        notification.read = true;
        res.json({ success: true, message: 'Notification marked as read' });
    } else {
        res.status(404).json({ success: false, message: 'Notification not found' });
    }
};

/**
 * Delete notification
 */
exports.deleteNotification = (req, res) => {
    const { id } = req.params;
    const index = notifications.findIndex(n => n.id === id);
    
    if (index !== -1) {
        notifications.splice(index, 1);
        res.json({ success: true, message: 'Notification deleted' });
    } else {
        res.status(404).json({ success: false, message: 'Notification not found' });
    }
};

/**
 * Clear all notifications
 */
exports.clearAllNotifications = (req, res) => {
    notifications.length = 0;
    res.json({ success: true, message: 'All notifications cleared' });
};

/**
 * Render notifications page
 */
exports.getNotificationsPage = (req, res) => {
    res.render('notifications', {
        user: req.user || {},
        notifications: notifications.slice(0, 20)
    });
};

/**
 * Send test notification (for debugging)
 */
exports.sendTestNotification = async (req, res) => {
    const testNotification = {
        type: req.body.type || 'info',
        title: req.body.title || 'Test Notification',
        message: req.body.message || 'This is a test notification from the system',
        from: req.body.from || 'System',
        timestamp: new Date().toISOString()
    };

    try {
        if (!channel) {
            handleNotification(testNotification);
            return res.json({
                success: true,
                message: 'Test notification generated in memory only (RabbitMQ is not connected).'
            });
        }

        channel.publish(
            NOTIFICATION_EXCHANGE,
            'farm.test',
            Buffer.from(JSON.stringify(testNotification)),
            { persistent: true }
        );
        res.json({ success: true, message: 'Test notification sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Initialize RabbitMQ connection on module load (non-blocking)
// Sử dụng setImmediate để không block server startup
setImmediate(() => {
    if (RABBITMQ_ENABLED) {
        initializeRabbitMQ();
    } else {
        console.log('⚠️  RabbitMQ is disabled. Notifications will work in-memory only.');
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing RabbitMQ connection...');
    if (channel) await channel.close();
    if (connection) await connection.close();
    process.exit(0);
});
