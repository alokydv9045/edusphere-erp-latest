const QRCode = require('qrcode');

/**
 * Generates a base64 PNG QR code encoding the userId.
 * Payload: { uid: userId, v: 1 }
 * Returns a data URL: "data:image/png;base64,..."
 */
const generateUserQR = async (userId) => {
  const payload = JSON.stringify({ uid: userId, v: 1 });
  const dataUrl = await QRCode.toDataURL(payload, {
    width: 350,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });
  return dataUrl;
};

/**
 * Parses a QR payload string and returns the userId.
 * Returns null if the payload is invalid.
 */
const parseQRPayload = (qrPayload) => {
  try {
    const parsed = JSON.parse(qrPayload);
    if (parsed && parsed.uid) return parsed.uid;
    return null;
  } catch {
    return null;
  }
};

module.exports = { generateUserQR, parseQRPayload };
