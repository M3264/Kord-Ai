// Helper function to convert a stream to buffer
async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });
        stream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
        });
        stream.on('error', (err) => {
            reject(err);
        });
    });
}

const writeTempFile = (tempDir, bufferData, filename, resolve, reject) => {
    const tempFilePath = path.join(tempDir, filename);
    fs.writeFile(tempFilePath, bufferData, (err) => {
      if (err) {
        reject(err);
      } else {
        fs.readFile(tempFilePath, (err, fileContent) => {
          if (err) {
            reject(err);
          } else {
            resolve(fileContent);
          }
        });
      }
    });
  };

module.exports = { streamToBuffer, writeTempFile };
