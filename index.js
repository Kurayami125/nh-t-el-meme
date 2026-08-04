const express = require("express");
const cors = require("cors");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

// ==============================
// TEMPLATE
// ==============================

const TEMPLATE_PATH = path.join(__dirname, "template.jpg");

// ==============================
// CONFIG
// ==============================

const IMAGE_WIDTH = 1536;
const IMAGE_HEIGHT = 806;

// Khu vực chữ bên phải
const TEXT_X = 700;
const TEXT_WIDTH = 800;

// Vùng chính để đặt câu quote
const QUOTE_TOP = 150;
const QUOTE_HEIGHT = 400;

// Font
const FONT_SIZE = 58;
const LINE_HEIGHT = 1.35;

// ==============================
// HOME
// ==============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "NhậtEL Meme API Online",
        usage: "/meme?text=Hello%20World"
    });
});

// ==============================
// TEXT WRAP
// ==============================

function wrapText(ctx, text, maxWidth) {

    const words = text.split(/\s+/);
    const lines = [];

    let line = "";

    for (const word of words) {

        const test =
            line === ""
                ? word
                : line + " " + word;

        const width = ctx.measureText(test).width;

        if (width <= maxWidth) {

            line = test;

        } else {

            if (line !== "") {
                lines.push(line);
            }

            line = word;
        }
    }

    if (line !== "") {
        lines.push(line);
    }

    return lines;
}

// ==============================
// MEME
// ==============================

app.get("/meme", async (req, res) => {

    try {

        let text = req.query.text;

        // ==========================
        // CHECK TEXT
        // ==========================

        if (!text) {

            return res.status(400).json({
                success: false,
                error: "Missing text.",
                usage: "/meme?text=Hello%20World"
            });

        }

        text = String(text).trim();

        if (text.length > 180) {

            return res.status(400).json({
                success: false,
                error: "Text must be 180 characters or less."
            });

        }

        // ==========================
        // LOAD TEMPLATE
        // ==========================

        const image = await loadImage(TEMPLATE_PATH);

        // ==========================
        // CANVAS
        // ==========================

        const canvas = createCanvas(
            IMAGE_WIDTH,
            IMAGE_HEIGHT
        );

        const ctx = canvas.getContext("2d");

        // Vẽ template
        ctx.drawImage(
            image,
            0,
            0,
            IMAGE_WIDTH,
            IMAGE_HEIGHT
        );

        // ==========================
        // MAIN TEXT
        // ==========================

        ctx.font = `${FONT_SIZE}px Arial`;

        ctx.fillStyle = "#ffffff";

        ctx.textAlign = "center";

        ctx.textBaseline = "middle";

        // Wrap text
        const lines = wrapText(
            ctx,
            text,
            TEXT_WIDTH
        );

        const lineHeight =
            FONT_SIZE * LINE_HEIGHT;

        const totalHeight =
            lines.length * lineHeight;

        // Tâm vùng quote
        const centerX =
            TEXT_X + TEXT_WIDTH / 2;

        const centerY =
            QUOTE_TOP + QUOTE_HEIGHT / 2;

        let y =
            centerY -
            totalHeight / 2 +
            lineHeight / 2;

        // Vẽ từng dòng
        for (const line of lines) {

            ctx.fillText(
                line,
                centerX,
                y
            );

            y += lineHeight;
        }

        // ==========================
        // AUTHOR
        // ==========================

        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";

        // - NhậtEL
        ctx.font = "italic 34px Arial";

        ctx.fillText(
            "- NhậtEL",
            centerX,
            625
        );

        // @nhatel
        ctx.font = "23px Arial";

        ctx.fillText(
            "@nhatel",
            centerX,
            662
        );

        // ==========================
        // SEND IMAGE
        // ==========================

        const buffer = canvas.toBuffer("image/png");

        res.setHeader(
            "Content-Type",
            "image/png"
        );

        res.setHeader(
            "Content-Length",
            buffer.length
        );

        res.send(buffer);

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

// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {

    console.log(
        `NhậtEL Meme API running on port ${PORT}`
    );

});
