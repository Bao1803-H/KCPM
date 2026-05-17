const amqp = require('amqplib');

// RabbitMQ Configuration
let RABBITMQ_URL = process.env.RABBITMQ_URL;
if (!RABBITMQ_URL) {
    RABBITMQ_URL = 'amqp://root:root@localhost:5672';
} else if (RABBITMQ_URL.includes('bicap-message-queue')) {
    // Auto-detect: nếu không có DOCKER_ENV và không phải trong container, dùng localhost
    const isDocker = process.env.DOCKER_ENV === 'true' || 
                     process.env.HOSTNAME?.includes('container') ||
                     (process.platform !== 'win32' && require('fs').existsSync('/.dockerenv'));
    
    if (!isDocker) {
        console.log('[RabbitMQ Client] Detected local environment, using localhost');
        RABBITMQ_URL = RABBITMQ_URL.replace('bicap-message-queue', 'localhost');
    }
}

// RabbitMQ connection pool
let connection = null;
let channel = null;
let isConnecting = false;

// Exchange và Queue names
const EXCHANGE_NAME = 'bicap.internal.exchange';
const REQUEST_QUEUE_PREFIX = 'farm.web.request';
const RESPONSE_QUEUE_PREFIX = 'farm.web.response';

/**
 * Initialize RabbitMQ connection
 */
async function ensureConnection() {
    if (connection && !connection.connection.ready) {
        connection = null;
        channel = null;
    }

    if (connection && channel) {
        return { connection, channel };
    }

    if (isConnecting) {
        // Wait for existing connection attempt
        let attempts = 0;
        while (isConnecting && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (connection && channel) {
            return { connection, channel };
        }
    }

    isConnecting = true;
    try {
        const logUrl = RABBITMQ_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
        console.log(`[RabbitMQ Client] Connecting to: ${logUrl}`);
        
        connection = await amqp.connect(RABBITMQ_URL, { heartbeat: 60 });
        channel = await connection.createChannel();
        
        // Declare exchange
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        
        console.log(`[RabbitMQ Client] ✓ Connected and ready`);
        isConnecting = false;
        return { connection, channel };
    } catch (error) {
        isConnecting = false;
        console.error(`[RabbitMQ Client] Connection failed: ${error.message}`);
        throw error;
    }
}

/**
 * Send RPC request via RabbitMQ
 * @param {string} routingKey - Routing key for the request
 * @param {object} payload - Request payload
 * @param {number} timeout - Timeout in milliseconds (default: 30000)
 * @returns {Promise<object>} Response from service
 */
async function sendRPCRequest(routingKey, payload, timeout = 30000) {
    try {
        const { channel } = await ensureConnection();
        
        // Create unique response queue
        const responseQueue = `${RESPONSE_QUEUE_PREFIX}.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
        await channel.assertQueue(responseQueue, { exclusive: true, autoDelete: true });
        
        // Send request
        const correlationId = Math.random().toString(36).substr(2, 9);
        const requestPayload = JSON.stringify(payload);
        
        channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(requestPayload), {
            persistent: true,
            correlationId: correlationId,
            replyTo: responseQueue
        });
        
        // Wait for response
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                channel.cancel(consumerTag);
                reject(new Error(`RPC request timeout after ${timeout}ms`));
            }, timeout);
            
            const consumerTag = channel.consume(responseQueue, (msg) => {
                if (msg && msg.properties.correlationId === correlationId) {
                    clearTimeout(timeoutId);
                    channel.cancel(consumerTag);
                    try {
                        const response = JSON.parse(msg.content.toString());
                        channel.ack(msg);
                        resolve(response);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                } else if (msg) {
                    channel.nack(msg, false, false);
                }
            }, { noAck: false });
        });
    } catch (error) {
        console.error(`[RabbitMQ Client] RPC request failed: ${error.message}`);
        throw error;
    }
}

/**
 * Publish message to exchange (fire and forget)
 * @param {string} routingKey - Routing key
 * @param {object} payload - Message payload
 */
async function publishMessage(routingKey, payload) {
    try {
        const { channel } = await ensureConnection();
        const message = Buffer.from(JSON.stringify(payload));
        
        channel.publish(EXCHANGE_NAME, routingKey, message, { persistent: true });
        console.log(`[RabbitMQ Client] Published message to ${routingKey}`);
    } catch (error) {
        console.error(`[RabbitMQ Client] Publish failed: ${error.message}`);
        throw error;
    }
}

/**
 * Close RabbitMQ connection
 */
async function closeConnection() {
    try {
        if (channel) {
            await channel.close();
            channel = null;
        }
        if (connection) {
            await connection.close();
            connection = null;
        }
        console.log('[RabbitMQ Client] Connection closed');
    } catch (error) {
        console.error(`[RabbitMQ Client] Error closing connection: ${error.message}`);
    }
}

// Handle connection errors
if (typeof process !== 'undefined') {
    process.on('SIGINT', closeConnection);
    process.on('SIGTERM', closeConnection);
}

module.exports = {
    ensureConnection,
    sendRPCRequest,
    publishMessage,
    closeConnection,
    EXCHANGE_NAME
};
