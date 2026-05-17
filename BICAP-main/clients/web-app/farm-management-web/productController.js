const axios = require('axios');

const getApiGatewayBaseUrl = () => {
    const MARKETPLACE_API_PATH = process.env.MARKETPLACE_API_PATH || 'http://localhost:8000/api/marketplace';
    return MARKETPLACE_API_PATH.split('/api')[0] || 'http://localhost:8000';
};

const API_GATEWAY_BASE_URL = getApiGatewayBaseUrl();

const FARM_API_URL = process.env.FARM_API_URL || `${API_GATEWAY_BASE_URL}/api/farm-features`;
const EXPORT_BATCH_API_URL = process.env.EXPORT_BATCH_API_URL || `${API_GATEWAY_BASE_URL}/api/export-batches`;

// Helper function to get farmId from ownerId
const getFarmId = async (ownerId, token) => {
    try {
        const response = await axios.get(`${FARM_API_URL}/owner/${ownerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data.id;
    } catch (error) {
        console.error('Could not fetch farm ID:', error.message);
        return null;
    }
};

exports.getProductsPage = async (req, res) => {
    try {
        const ownerId = req.user.userId || req.user.id || req.user.sub;
        const token = req.cookies.farm_token || req.cookies.auth_token; // legacy fallback
        const farmId = await getFarmId(ownerId, token);

        // Construct the correct marketplace URL for the frontend
        // Frontend runs in browser, so must use localhost or public IP, not Docker service name
        let marketplaceApiHost = API_GATEWAY_BASE_URL;
        
        // Replace Docker service names with localhost for browser access
        if (marketplaceApiHost.includes('kong-gateway')) {
            marketplaceApiHost = marketplaceApiHost.replace('kong-gateway', 'localhost');
        }
        
        // Get marketplace API path
        let marketplaceApiPath = '/api/marketplace-products';
        if (process.env.MARKETPLACE_API_PATH) {
            if (process.env.MARKETPLACE_API_PATH.startsWith('/')) {
                marketplaceApiPath = process.env.MARKETPLACE_API_PATH;
            } else {
                try {
                    const url = new URL(process.env.MARKETPLACE_API_PATH);
                    marketplaceApiPath = url.pathname;
                } catch (e) {
                    // If not a valid URL, assume it's just a path
                    marketplaceApiPath = process.env.MARKETPLACE_API_PATH.startsWith('/') 
                        ? process.env.MARKETPLACE_API_PATH 
                        : `/${process.env.MARKETPLACE_API_PATH}`;
                }
            }
        }

        const marketplaceApiUrl = `${marketplaceApiHost}${marketplaceApiPath}`;
        console.log(`Product API URL for frontend: ${marketplaceApiUrl}`);
        
        let exportBatchApiUrl = EXPORT_BATCH_API_URL;
        if (exportBatchApiUrl.includes('kong-gateway')) {
            exportBatchApiUrl = exportBatchApiUrl.replace('kong-gateway', 'localhost');
        }

        res.render('products', {
            farmId: farmId,
            user: req.user,
            error: farmId ? null : 'Could not find your farm. Please create a farm first.',
            marketplaceApiUrl: marketplaceApiUrl,
            exportBatchApiUrl: exportBatchApiUrl
        });

    } catch (error) {
        console.error('Error getting products page:', error.message);
        res.render('products', {
            farmId: null,
            user: req.user,
            error: 'Could not load product management page.',
            marketplaceApiUrl: 'http://localhost:8000/api/marketplace-products',
            exportBatchApiUrl: 'http://localhost:8000/api/export-batches'
        });
    }
};

