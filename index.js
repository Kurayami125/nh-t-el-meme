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
// XML ESCAPE
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

function wrapText(text, maxWidth, fontSize) {

    const words = text.split(/\s+/);

    const lines = [];

    let current = "";

    /*
     * Ước lượng độ rộng chữ.
     * Không dùng Canvas nên dùng hệ số tương đối
     * để SVG vẫn hoạt động ổn định trên Render.
     */

    const averageCharWidth =
        fontSize * 0.56;

    const maxCharacters =
        Math.max(
            1,
            Math.floor(
                maxWidth / averageCharWidth
            )
        );

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

            // Xử lý từ quá dài
            if (word.length > maxCharacters) {

                let remaining = word;

                while (
                    remaining.length >
                    maxCharacters
                ) {

                    lines.push(
                        remaining.substring(
                            0,
                            maxCharacters
                        )
                    );

                    remaining =
                        remaining.substring(
                            maxCharacters
                        );
                }

                current = remaining;

            } else {

                current = word;
            }
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
    // TEXT CONFIG
    // ====================================

    const centerX = 1120;

    const textAreaTop = 120;
    const textAreaBottom = 540;

    const textAreaHeight =
        textAreaBottom - textAreaTop;

    const fontSize = 58;

    const lineHeight = 72;

    const maxWidth = 720;

    // ====================================
    // WRAP
    // ====================================

    const lines = wrapText(
        text,
        maxWidth,
        fontSize
    );

    // ====================================
    // VERTICAL CENTER
    // ====================================

    const totalHeight =
        lines.length * lineHeight;

    let startY =
        textAreaTop +
        (textAreaHeight - totalHeight) / 2 +
        lineHeight / 2;

    let textElements = "";

    // ====================================
    // MAIN TEXT
    // ====================================

    for (const line of lines) {

        const safeLine =
            escapeXml(line);

        /*
         * Viền đen trước
         * Sau đó chữ trắng nằm trên.
         *
         * Cách này tạo cảm giác giống
         * chữ meme trong ảnh mẫu.
         */

        textElements += `
            <text
                x="${centerX}"
                y="${startY}"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="${fontSize}px"
                font-weight="700"
                fill="#ffffff"
                stroke="#000000"
                stroke-width="5"
                stroke-linejoin="round"
                paint-order="stroke fill"
            >${safeLine}</text>
        `;

        startY += lineHeight;
    }

    // ====================================
    // AUTHOR
    // ====================================

    textElements += `
        <text
            x="${centerX}"
            y="610"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="34px"
            font-style="italic"
            font-weight="600"
            fill="#ffffff"
            stroke="#000000"
            stroke-width="3"
            stroke-linejoin="round"
            paint-order="stroke fill"
        >- NhậtEL</text>
    `;

    // ====================================
    // USERNAME
    // ====================================

    textElements += `
        <text
            x="${centerX}"
            y="650"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="23px"
            font-weight="400"
            fill="#ffffff"
            stroke="#000000"
            stroke-width="2"
            stroke-linejoin="round"
            paint-order="stroke fill"
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

            ${textElements}

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
        // LOAD TEMPLATE
        // =================================

        const image =
            sharp(TEMPLATE);

        // =================================
        // COMPOSITE
        // =================================

        const output =
            await image
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
            "Generated image:",
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
            error:
                "Failed to generate meme.",
            details:
                error.message
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
