const express = require("express");
const cors = require("cors");
const sharp = require("sharp");
const path = require("path");

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

const TEMPLATE = path.join(__dirname, "template.jpg");

const WIDTH = 1536;
const HEIGHT = 806;

// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "NhậtEL Meme API Online",
        usage: "/meme?text=Hello%20World"
    });
});

// ========================================
// ESCAPE XML
// ========================================

function escapeXml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

// ========================================
// WRAP TEXT
// ========================================

function wrapText(text, maxChars = 24) {

    const words = text.split(/\s+/);

    const lines = [];
    let current = "";

    for (const word of words) {

        const test =
            current.length === 0
                ? word
                : current + " " + word;

        if (test.length <= maxChars) {

            current = test;

        } else {

            if (current.length > 0) {
                lines.push(current);
            }

            // Nếu một từ quá dài
            if (word.length > maxChars) {

                let remaining = word;

                while (remaining.length > maxChars) {

                    lines.push(
                        remaining.substring(0, maxChars)
                    );

                    remaining =
                        remaining.substring(maxChars);
                }

                current = remaining;

            } else {

                current = word;
            }
        }
    }

    if (current.length > 0) {
        lines.push(current);
    }

    return lines;
}

// ========================================
// CREATE SVG TEXT
// ========================================

function createTextSvg(text) {

    const lines = wrapText(text, 24);

    // Khu vực bên phải
    const centerX = 1120;

    // Vị trí quote
    const centerY = 350;

    const fontSize = 58;
    const lineHeight = 78;

    const totalHeight =
        lines.length * lineHeight;

    let startY =
        centerY -
        totalHeight / 2 +
        lineHeight / 2;

    let quoteText = "";

    for (const line of lines) {

        quoteText += `
            <text
                x="${centerX}"
                y="${startY}"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family="Arial, sans-serif"
                font-size="${fontSize}px"
                font-weight="bold"
                fill="white"
                stroke="black"
                stroke-width="3"
                paint-order="stroke"
            >${escapeXml(line)}</text>
        `;

        startY += lineHeight;
    }

    // Author
    quoteText += `
        <text
            x="${centerX}"
            y="610"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial, sans-serif"
            font-size="34px"
            font-style="italic"
            fill="white"
            stroke="black"
            stroke-width="2"
            paint-order="stroke"
        >- NhậtEL</text>

        <text
            x="${centerX}"
            y="650"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial, sans-serif"
            font-size="23px"
            fill="white"
            stroke="black"
            stroke-width="1.5"
            paint-order="stroke"
        >@nhatel</text>
    `;

    return `
        <svg
            width="${WIDTH}"
            height="${HEIGHT}"
            xmlns="http://www.w3.org/2000/svg"
        >
            ${quoteText}
        </svg>
    `;
}

// ========================================
// MEME API
// ========================================

app.get("/meme", async (req, res) => {

    try {

        let text = req.query.text;

        // Không có text
        if (!text) {

            return res.status(400).json({
                success: false,
                error: "Missing text parameter.",
                usage: "/meme?text=Hello%20World"
            });

        }

        text = String(text).trim();

        // Giới hạn
        if (text.length > 180) {

            return res.status(400).json({
                success: false,
                error: "Text is too long. Maximum 180 characters."
            });

        }

        console.log(
            "Generating meme:",
            text
        );

        // ==================================
        // SVG
        // ==================================

        const svg = createTextSvg(text);

        const svgBuffer =
            Buffer.from(svg);

        // ==================================
        // TEMPLATE + SVG
        // ==================================

        const output = await sharp(TEMPLATE)
            .resize(WIDTH, HEIGHT)
            .composite([
                {
                    input: svgBuffer,
                    top: 0,
                    left: 0
                }
            ])
            .png()
            .toBuffer();

        console.log(
            "Generated:",
            output.length,
            "bytes"
        );

        // ==================================
        // SEND
        // ==================================

        res.setHeader(
            "Content-Type",
            "image/png"
        );

        res.setHeader(
            "Content-Length",
            output.length
        );

        res.setHeader(
            "Cache-Control",
            "no-cache, no-store, must-revalidate"
        );

        res.send(output);

    } catch (error) {

        console.error(
            "Meme error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

// ========================================
// START
// ========================================

app.listen(PORT, () => {

    console.log(
        `NhậtEL Meme API running on port ${PORT}`
    );

}); 
