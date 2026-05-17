const express = require('express');

module.exports = (requireAuth) => {
    const router = express.Router();
    const authServiceUpdateUrl = process.env.AUTH_SERVICE_URL_UPDATE || 'http://localhost:8000/api/update';
    const authServiceBaseUrl = (() => {
        try {
            return new URL(authServiceUpdateUrl).origin;
        } catch (_error) {
            return 'http://localhost:8000';
        }
    })();

    const buildUserViewModel = (req, profileData = {}) => ({
        username: req.user?.sub || req.user?.username || 'Unknown',
        email: req.user?.email || 'Unknown',
        roles: req.user?.roles || [],
        ...profileData
    });

    router.get('/profile', requireAuth, async (req, res) => {
        let profileData = {};

        try {
            const token = req.cookies.farm_token || req.cookies.auth_token;
            const response = await fetch(`${authServiceUpdateUrl}/profile`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });

            if (response.ok) {
                profileData = await response.json();

                const avatarSource = profileData.avatarBase64 || profileData.avatarBytes;
                if (avatarSource) {
                    profileData.avatar = `data:image/png;base64,${avatarSource}`;
                }

                if (Array.isArray(profileData.businessLicenses)) {
                    profileData.businessLicenses.forEach((license) => {
                        if (license.licenseBase64) {
                            license.licensePath = `data:image/png;base64,${license.licenseBase64}`;
                            return;
                        }

                        if (license.licensePath && !license.licensePath.startsWith('data:')) {
                            try {
                                const filename = license.licensePath.substring(
                                    license.licensePath.lastIndexOf('/') + 1
                                );
                                license.licensePath = `${authServiceBaseUrl}/api/update/license/${filename}`;
                            } catch (_error) {
                                license.licensePath = '/assets/img/image_placeholder.jpg';
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error.message);
        }

        res.render('profile', {
            user: buildUserViewModel(req, profileData)
        });
    });

    router.post('/api/profile/update', requireAuth, async (req, res) => {
        try {
            const response = await fetch(`${authServiceUpdateUrl}/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${(req.cookies.farm_token || req.cookies.auth_token) || ''}`
                },
                body: JSON.stringify(req.body)
            });

            const rawBody = await response.text();
            if (rawBody.length > 1e7) {
                throw new Error('Response too large - possible serialization error');
            }

            if (!response.ok) {
                throw new Error(`Backend returned ${response.status}: ${rawBody}`);
            }

            try {
                return res.json(rawBody ? JSON.parse(rawBody) : { message: 'Profile updated successfully' });
            } catch (_error) {
                return res.status(502).json({ error: 'Invalid response from backend' });
            }
        } catch (error) {
            console.error('Profile update error:', error.message);
            return res.status(500).json({
                error: 'Server error during profile update.',
                message: error.message
            });
        }
    });

    return router;
};
