async function handleProfileSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('profile-error');
    const successDiv = document.getElementById('profile-success');

    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';

    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';

    try {
        const formData = new FormData(form);
        const payload = {
            address: formData.get('address') || null,
            avatarBase64: null,
            businessLicenses: []
        };

        const businessLicenseFiles = form.querySelector('#businessLicenseUpload').files;
        if (businessLicenseFiles && businessLicenseFiles.length > 0) {
            for (let i = 0; i < businessLicenseFiles.length; i += 1) {
                const file = businessLicenseFiles[i];
                if (file.size > 0) {
                    const base64 = await fileToBase64(file);
                    payload.businessLicenses.push({
                        data: base64,
                        originalName: file.name
                    });
                }
            }
        }

        const avatarFile = formData.get('avatar');
        if (avatarFile && avatarFile.size > 0) {
            if (avatarFile.size > 10 * 1024 * 1024) {
                throw new Error('Image file is too large. Maximum allowed: 10MB');
            }
            payload.avatarBase64 = await fileToBase64(avatarFile);
        }

        const response = await fetch('/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to update profile');
        }

        if (successDiv) {
            successDiv.textContent = 'Profile updated successfully!';
            successDiv.style.display = 'block';
            setTimeout(() => window.location.reload(), 1500);
        }
    } catch (err) {
        console.error('Profile update failed:', err);
        if (errorDiv) {
            errorDiv.textContent = err.message || 'Failed to update profile';
            errorDiv.style.display = 'block';
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Profile';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('update-profile-form');
    const avatarInput = document.getElementById('avatar');
    const avatarPreview = document.getElementById('avatar-preview');

    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) {
                return;
            }

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                avatarPreview.src = loadEvent.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (form) {
        form.addEventListener('submit', handleProfileSubmit);
    }
});

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}
