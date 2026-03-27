const heicConvert = require('heic-convert');
const fs = require('fs').promises;
const path = require('path');

/**
 * Converts HEIC/HEIF files to JPEG
 * @param {Array} files - Array of multer file objects
 * @returns {Promise<Array>} - Array of processed file objects
 */
const convertHeicToJpeg = async (files) => {
    if (!files || !Array.isArray(files)) return [];

    const processedFiles = await Promise.all(files.map(async (file) => {
        const ext = path.extname(file.originalname).toLowerCase();

        if (ext === '.heic' || ext === '.heif') {
            try {
                const inputBuffer = await fs.readFile(file.path);
                const outputBuffer = await heicConvert({
                    buffer: inputBuffer,
                    format: 'JPEG',
                    quality: 0.8
                });

                const newFilename = `${path.basename(file.filename, ext)}.jpg`;
                const newPath = path.join(path.dirname(file.path), newFilename);

                await fs.writeFile(newPath, outputBuffer);

                // Remove the original HEIC file
                try {
                    await fs.unlink(file.path);
                } catch (err) {
                    console.error("Failed to delete original HEIC file:", err);
                }

                // Update file object properties
                return {
                    ...file,
                    filename: newFilename,
                    path: newPath,
                    mimetype: 'image/jpeg'
                };
            } catch (error) {
                console.error(`HEIC conversion failed for ${file.originalname}:`, error);
                return file; // Return original if conversion fails
            }
        }
        return file;
    }));

    return processedFiles;
};

module.exports = { convertHeicToJpeg };
