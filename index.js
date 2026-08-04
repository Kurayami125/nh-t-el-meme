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
// TEXT WRAP
// ========================================

function wrapText(text) {

    const words = text.split(/\s+/);

    const lines = [];

    let current = "";

    // Độ rộng tối đa của một dòng
    const maxCharacters = 24;

    for (const word of words) {

        const test =
            current === ""
                ? word
                : current + " " + word;

        if (test.length <= maxCharacters) {

            current = test;

        } else {

            if (current !== "") {
                lines.push(current);
            }

            current = word;
        }
    }

    if (current !== "") {
        lines.push(current);
    }

    return lines;
}

// ========================================
// CREATE SVG
// ========================================

function createSvg(text) {

    // ====================================
    // MAIN TEXT CONFIG
    // ====================================

    // Tâm phần bên phải
    const centerX = 1120;

    // Vùng chữ
    const top = 190;
    const bottom = 470;

    const areaHeight =
        bottom - top;

    // Font chính
    const fontSize = 58;

    // Khoảng cách dòng
    const lineHeight = 76;

    // ====================================
    // UPPERCASE
    // ====================================

    const upperText =
        text.toLocaleUpperCase("vi-VN");

    // ====================================
    // WRAP
    // ====================================

    const lines =
        wrapText(upperText);

    // ====================================
    // CENTER VERTICAL
    // ====================================

    const totalHeight =
        lines.length * lineHeight;

    let startY =
        top +
        (areaHeight - totalHeight) / 2 +
        lineHeight / 2;

    let elements = "";

    // ====================================
    // MAIN TEXT
    // ====================================

    for (const line of lines) {

        elements += `
            <text
                x="${centerX}"
                y="${startY}"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="${fontSize}px"
                font-weight="400"
                fill="#ffffff"
            >${escapeXml(line)}</text>
        `;

        startY += lineHeight;
    }

    // ====================================
    // AUTHOR
    // ====================================

    elements += `
        <text
            x="${centerX}"
            y="510"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="34px"
            font-weight="400"
            font-style="italic"
            fill="#ffffff"
        >- NhậtEL</text>
    `;

    // ====================================
    // USERNAME
    // ====================================

    elements += `
        <text
            x="${centerX}"
            y="552"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="23px"
            font-weight="400"
            fill="#ffffff"
        >@nhatel</text>
    `;

    // ====================================
    // SVG
    // ====================================

    return `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="${WIDTH}"
            height="${HEIGHT}"
            viewBox="0 0 ${WIDTH} ${HEIGHT}"
        >

            ${elements}

        </svg>
    `;
}

// ========================================
// MEME API
// ========================================

app.get("/meme", async (req, res) => {

    try {

        let text = req.query.text;

        // =================================
        // CHECK TEXT
        // =================================

        if (!text) {

            return res.status(400).json({
                success: false,
                error: "Missing text parameter.",
                usage:
                    "/meme?text=Hello%20World"
            });

        }

        text = String(text).trim();

        // =================================
        // LIMIT
        // =================================

        if (text.length > 180) {

            return res.status(400).json({
                success: false,
                error:
                    "Text is too long. Maximum 180 characters."
            });

        }

        console.log(
            "Generating meme:",
            text
        );

        // =================================
        // CREATE SVG
        // =================================

        const svg =
            createSvg(text);

        const svgBuffer =
            Buffer.from(svg);

        // =================================
        // PROCESS IMAGE
        // =================================

        const output =
            await sharp(TEMPLATE)
                .resize(
                    WIDTH,
                    HEIGHT,
                    {
                        fit: "fill"
                    }
                )
                .composite([
                    {
                        input: svgBuffer,
                        top: 0,
                        left: 0
                    }
                ])
                .png({
                    compressionLevel: 9
                })
                .toBuffer();

        console.log(
            "Generated:",
            output.length,
            "bytes"
        );

        // =================================
        // RESPONSE
        // =================================

        res.setHeader(
            "Content-Type",
            "image/png"
        );

        res.setHeader(
            "Cache-Control",
            "no-cache, no-store, must-revalidate"
        );

        res.send(output);

    } catch (error) {

        console.error(
            "Meme generation error:",
            error
        );

        res.status(500).json({
            success: false,
            error: "Failed to generate meme.",
            details: error.message
        });

    }

});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(
        `NhậtEL Meme API running on port ${PORT}`
    );

});
