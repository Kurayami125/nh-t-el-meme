const express = require("express");
const cors = require("cors");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;
const TEMPLATE = path.join(__dirname, "template.jpg");

// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "NhậtEL Meme API Online"
    });
});

// ========================================
// FONT TEST
// ========================================

app.get("/test", (req, res) => {

    try {

        const canvas = createCanvas(1536, 806);
        const ctx = canvas.getContext("2d");

        // Background
        ctx.fillStyle = "#000000";
        ctx.fillRect(
            0,
            0,
            1536,
            806
        );

        // BIG TEST TEXT
        ctx.font = "bold 100px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            "HELLO",
            768,
            350
        );

        ctx.font = "bold 50px Arial";

        ctx.fillText(
            "NHATEL",
            768,
            500
        );

        const buffer =
            canvas.toBuffer("image/png");

        res.setHeader(
            "Content-Type",
            "image/png"
        );

        res.send(buffer);

    } catch (error) {

        console.error(
            "TEST ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// MEME
// ========================================

app.get("/meme", async (req, res) => {

    try {

        const text =
            String(req.query.text || "HELLO");

        console.log("TEXT:", text);

        const image =
            await loadImage(TEMPLATE);

        console.log(
            "Template:",
            image.width,
            "x",
            image.height
        );

        const canvas =
            createCanvas(
                image.width,
                image.height
            );

        const ctx =
            canvas.getContext("2d");

        // ==================================
        // DRAW TEMPLATE
        // ==================================

        ctx.drawImage(
            image,
            0,
            0
        );

        // ==================================
        // TEXT
        // ==================================

        ctx.font =
            "bold 60px Arial";

        ctx.fillStyle =
            "#FFFFFF";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        // Vùng phải
        const centerX = 1120;
        const centerY = 350;

        // Viền đen nhẹ để chữ dễ nhìn
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#000000";

        ctx.strokeText(
            text,
            centerX,
            centerY
        );

        ctx.fillText(
            text,
            centerX,
            centerY
        );

        // ==================================
        // AUTHOR
        // ==================================

        ctx.font =
            "italic 35px Arial";

        ctx.strokeText(
            "- NhậtEL",
            centerX,
            600
        );

        ctx.fillText(
            "- NhậtEL",
            centerX,
            600
        );

        ctx.font =
            "24px Arial";

        ctx.strokeText(
            "@nhatel",
            centerX,
            640
        );

        ctx.fillText(
            "@nhatel",
            centerX,
            640
        );

        // ==================================
        // OUTPUT
        // ==================================

        const buffer =
            canvas.toBuffer("image/png");

        console.log(
            "Generated image:",
            buffer.length,
            "bytes"
        );

        res.setHeader(
            "Content-Type",
            "image/png"
        );

        res.setHeader(
            "Cache-Control",
            "no-cache, no-store, must-revalidate"
        );

        res.send(buffer);

    } catch (error) {

        console.error(
            "MEME ERROR:",
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
        `Server running on port ${PORT}`
    );

});
