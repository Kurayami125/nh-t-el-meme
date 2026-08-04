const express = require("express");
const cors = require("cors");
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

// ===============================
// CONFIG
// ===============================

const TEMPLATE = path.join(__dirname, "template.jpg");

// Khu vực text bên phải
const TEXT_AREA = {
    x: 690,
    y: 150,
    width: 780,
    height: 480
};

// Font
const FONT_NAME = "Arial";

// Kích thước chữ
const FONT_SIZE = 58;

// Khoảng cách giữa các dòng
const LINE_HEIGHT = 1.35;

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "NhậtEL Meme API Online",
        usage: "/meme?text=Your%20text%20here"
    });
});

// ===============================
// TEXT WRAP
// ===============================

function wrapText(ctx, text, maxWidth) {

    const words = text.split(/\s+/);
    const lines = [];

    let currentLine = "";

    for (const word of words) {

        const testLine =
            currentLine.length === 0
                ? word
                : currentLine + " " + word;

        const width = ctx.measureText(testLine).width;

        if (width <= maxWidth) {

            currentLine = testLine;

        } else {

            if (currentLine.length > 0) {
                lines.push(currentLine);
            }

            currentLine = word;
        }
    }

    if (currentLine.length > 0) {
        lines.push(currentLine);
    }

    return lines;
}

// ===============================
// MEME API
// ===============================

app.get("/meme", async (req, res) => {

    try {

        let text = req.query.text;

        // Không có text
        if (!text) {
            return res.status(400).json({
                success: false,
                error: "Missing text parameter.",
                usage: "/meme?text=Hello%20world"
            });
        }

        // Decode
        text = String(text).trim();

        // Giới hạn ký tự
        if (text.length > 180) {
            return res.status(400).json({
                success: false,
                error: "Text is too long. Maximum 180 characters."
            });
        }

        // Load template
        const image = await loadImage(TEMPLATE);

        // Canvas cùng kích thước template
        const canvas = createCanvas(
            image.width,
            image.height
        );

        const ctx = canvas.getContext("2d");

        // Vẽ template
        ctx.drawImage(
            image,
            0,
            0,
            image.width,
            image.height
        );

        // ===============================
        // MAIN TEXT
        // ===============================

        ctx.font = `normal ${FONT_SIZE}px ${FONT_NAME}`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Wrap
        const lines = wrapText(
            ctx,
            text,
            TEXT_AREA.width
        );

        const lineHeight =
            FONT_SIZE * LINE_HEIGHT;

        // Tính tổng chiều cao
        const totalHeight =
            lines.length * lineHeight;

        // Căn giữa theo chiều dọc
        let startY =
            TEXT_AREA.y +
            (TEXT_AREA.height - totalHeight) / 2 +
            lineHeight / 2;

        // Vẽ từng dòng
        for (const line of lines) {

            ctx.fillText(
                line,
                TEXT_AREA.x + TEXT_AREA.width / 2,
                startY
            );

            startY += lineHeight;
        }

        // ===============================
        // AUTHOR
        // ===============================

        ctx.textAlign = "center";

        // - NhậtEL
        ctx.font = `italic 34px ${FONT_NAME}`;
        ctx.fillStyle = "#ffffff";

        ctx.fillText(
            "- NhậtEL",
            TEXT_AREA.x + TEXT_AREA.width / 2,
            605
        );

        // @nhatel
        ctx.font = `normal 23px ${FONT_NAME}`;

        ctx.fillText(
            "@nhatel",
            TEXT_AREA.x + TEXT_AREA.width / 2,
            645
        );

        // ===============================
        // OUTPUT
        // ===============================

        res.setHeader(
            "Content-Type",
            "image/png"
        );

        res.setHeader(
            "Cache-Control",
            "no-cache"
        );

        const buffer = canvas.toBuffer("image/png");

        res.send(buffer);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: "Failed to generate meme."
        });
    }
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

    console.log(
        `Meme API running on port ${PORT}`
    );

}); 
