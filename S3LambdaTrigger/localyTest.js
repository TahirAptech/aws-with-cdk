const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceFolder = './images';       // Folder where original images are located
const targetFolder = './resizedImages'; // Folder where resized images will be saved

// Ensure target folder exists
if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
}

// Read all files from the source folder
fs.readdir(sourceFolder, (err, files) => {
    if (err) {
        console.error("Error listing the files:", err);
        return;
    }

    files.forEach(file => {
        const sourceFilePath = path.join(sourceFolder, file);
        const targetFilePath = path.join(targetFolder, file);

        // Resize the image
        sharp(sourceFilePath)
            .resize(250, 100) // Resize to the desired dimensions
            .toFormat('jpeg') // Convert to JPEG format
            .toFile(targetFilePath, (err, info) => {
                if (err) {
                    console.error(`Error processing ${file}:`, err);
                } else {
                    console.log(`Processed ${file}:`, info);
                }
            });
    });
});
