const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const dotenv=require('dotenv')
const app = express();

require('dotenv').config()
app.use(cors({
  methods: 'GET,POST',
  credentials: true,
}));

app.use(bodyParser.json());

app.post('/generate-qr', async (req, res) => {
  try {
    const { text, color, width, height } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const qrColor = color || '#000000';

    const qrCodeImage = await QRCode.toDataURL(text, {
      color: {
        dark: qrColor,
        light: '#FFFFFF',
      },
    });

    const doc = new PDFDocument();
    const pdfFileName = `qr_code_${Date.now()}.pdf`;
    const pdfDir = path.join(__dirname, 'pdfs');
    const filePath = path.join(pdfDir, pdfFileName);

    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir);
    }

    const pdfStream = fs.createWriteStream(filePath);
    doc.pipe(pdfStream);

    

    const imgWidth = width || 250; 
    const imgHeight = height || 250; 

    doc.image(qrCodeImage, {
      fit: [imgWidth, imgHeight],
      align: 'center',
      valign: 'center',
    });

    doc.end();

    pdfStream.on('finish', () => {
      res.download(filePath, pdfFileName, (err) => {
        if (err) {
          console.error('Download error:', err);
          return res.status(500).json({ message: 'Error downloading file' });
        }
        fs.unlinkSync(filePath);
      });
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).json({ message: 'Error generating QR code', error: err.message });
  }
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
