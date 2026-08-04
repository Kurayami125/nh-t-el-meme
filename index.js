const express = require("express");
const cors = require("cors");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;
const TEMPLATE = path.join(__dirname, "template.jpg");

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "NhậtEL Meme API Online"
    });
});

app.get("/meme", async (req, res) => {

    try {

        const text = String(req.query.text || "TEST TEXT");

        console.log("TEXT:", text);

        const image = await loadImage(TEMPLATE);

        console.log(
            "Template:",
            image.width,
            "x",
            image.height
        );

        const canvas = createCanvas(
            image.width,
            image.height
        );

        const ctx = canvas.getContext("2d");

        // Template
        ctx.drawImage(
            image,
            0,
            0,
            image.width,
            image.height
        );

        // =========================
        // TEST TEXT
        // =========================

        ctx.font = "bold 70px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Cố tình đặt giữa vùng bên phải
        ctx.fillText(
            text,
            1120,
            350
        );

        // =========================
        // AUTHOR
        // =========================

        ctx.font = "italic 35px Arial";

        ctx.fillText(
            "- NhậtEL",
            1120,
            600
        );

        ctx.font = "24px Arial";

        ctx.fillText(
            "@nhatel",
            1120,
            640
        );

        // =========================
        // OUTPUT
        // =========================

        const buffer = canvas.toBuffer("image/png");

        res.setHeader(
            "Content-Type",
            "image/png"
        );

        res.send(buffer);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});
