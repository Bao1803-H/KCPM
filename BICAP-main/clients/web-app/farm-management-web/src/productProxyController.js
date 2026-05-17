const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const getApiGatewayBaseUrl = () => {
    const marketplacePath = process.env.MARKETPLACE_API_PATH || 'http://localhost:8000/api/marketplace-products';
    return marketplacePath.split('/api')[0] || 'http://localhost:8000';
};

const apiGatewayBaseUrl = getApiGatewayBaseUrl();
const marketplaceProductsApiUrl =
    process.env.MARKETPLACE_API_PATH || `${apiGatewayBaseUrl}/api/marketplace-products`;
const imagesApiUrl = process.env.IMAGES_API_PATH || `${apiGatewayBaseUrl}/api/images`;
const farmApiUrl = process.env.FARM_API_URL || `${apiGatewayBaseUrl}/api/farm-features`;

const getToken = (req) => req.cookies.farm_token || req.cookies.auth_token || null;
const getOwnerId = (req) => req.user?.userId || req.user?.id || req.user?.sub || null;

const readErrorMessage = (error, fallbackMessage) => {
    const responseData = error.response?.data;

    if (typeof responseData === 'string') {
        try {
            const parsed = JSON.parse(responseData);
            return parsed.message || parsed.error || fallbackMessage;
        } catch (_error) {
            return responseData || fallbackMessage;
        }
    }

    return responseData?.message || responseData?.error || error.message || fallbackMessage;
};

const getFarmId = async (ownerId, token) => {
    try {
        const response = await axios.get(`${farmApiUrl}/owner/${ownerId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data?.id || null;
    } catch (error) {
        console.error('Error getting farm ID:', error.message);
        return null;
    }
};

exports.getProductsByFarm = async (req, res) => {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ error: 'Authentication token is missing.' });
    }

    try {
        const { farmId } = req.params;
        const response = await axios.get(`${marketplaceProductsApiUrl}/farm/${farmId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return res.json(response.data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            error: readErrorMessage(error, 'Could not load marketplace products.')
        });
    }
};

exports.createProduct = async (req, res) => {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ error: 'Authentication token is missing.' });
    }

    try {
        const productData = { ...req.body };

        if (!productData.farmId) {
            const ownerId = getOwnerId(req);
            const farmId = ownerId ? await getFarmId(ownerId, token) : null;

            if (!farmId) {
                return res.status(400).json({
                    error: 'Farm not found. Please create farm information first.'
                });
            }

            productData.farmId = farmId;
        }

        const response = await axios.post(marketplaceProductsApiUrl, productData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return res.json(response.data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            error: readErrorMessage(error, 'Could not create marketplace product.')
        });
    }
};

exports.updateProduct = async (req, res) => {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ error: 'Authentication token is missing.' });
    }

    try {
        const { productId } = req.params;
        const response = await axios.put(`${marketplaceProductsApiUrl}/${productId}`, req.body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return res.json(response.data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            error: readErrorMessage(error, 'Could not update marketplace product.')
        });
    }
};

exports.deleteProduct = async (req, res) => {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ error: 'Authentication token is missing.' });
    }

    try {
        const { productId } = req.params;
        const response = await axios.delete(`${marketplaceProductsApiUrl}/${productId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return res.json(response.data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            error: readErrorMessage(error, 'Could not delete marketplace product.')
        });
    }
};

exports.uploadProductImage = async (req, res) => {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ error: 'Authentication token is missing.' });
    }

    try {
        const { productId, farmId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Please choose an image file.' });
        }

        if (!productId || !farmId) {
            return res.status(400).json({ error: 'productId and farmId are required.' });
        }

        const formData = new FormData();
        const fileBuffer = file.buffer || fs.readFileSync(file.path);
        formData.append('file', fileBuffer, { filename: file.originalname });
        formData.append('productId', productId);
        formData.append('farmId', farmId);

        const response = await axios.post(`${imagesApiUrl}/upload`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...formData.getHeaders()
            }
        });

        return res.json(response.data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            error: readErrorMessage(error, 'Could not upload product image.')
        });
    }
};

exports.uploadMarketplaceProductImage = async (req, res) => {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ error: 'Authentication token is missing.' });
    }

    try {
        const { productId } = req.params;
        const { farmId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Please choose an image file.' });
        }

        if (!productId || !farmId) {
            return res.status(400).json({ error: 'productId and farmId are required.' });
        }

        const formData = new FormData();
        const fileBuffer = file.buffer || fs.readFileSync(file.path);
        formData.append('file', fileBuffer, { filename: file.originalname });
        formData.append('farmId', farmId);

        const response = await axios.post(`${marketplaceProductsApiUrl}/${productId}/images`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...formData.getHeaders()
            }
        });

        return res.json(response.data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            error: readErrorMessage(error, 'Could not upload marketplace product image.')
        });
    }
};
