const axios = require('axios');

const verifyCaptcha = async (req, res, next) => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // Skip if no key configured (dev fallback)
    if (!secretKey || secretKey === 'RECAPTCHA_SECRET_KEY_HERE') {
        return next();
    }

    const token = req.body.captchaToken;
    if (!token) {
        return res.status(400).json({ success: false, message: 'CAPTCHA token missing.' });
    }

    try {
        const { data } = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            { params: { secret: secretKey, response: token } }
        );

        if (!data.success || data.score < 0.5) {
            console.warn(`[CAPTCHA] Failed — success=${data.success} score=${data.score}`);
            return res.status(400).json({ success: false, message: 'CAPTCHA verification failed. Please try again.' });
        }

        next();
    } catch (err) {
        console.error('[CAPTCHA] Verification error:', err.message);
        next(); // fail open — don't block users if Google is unreachable
    }
};

module.exports = { verifyCaptcha };
