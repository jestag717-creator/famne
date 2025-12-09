const express = require("express");
const path = require("path");
const app = express();

// Pterodactyl akan kasih PORT otomatis
const PORT = process.env.PORT || 3001;

// Folder public tempat l4.html + assets
const PUBLIC_DIR = path.join(__dirname, "public");

// Serve file statis
app.use(express.static(PUBLIC_DIR));

// Serve l4.html di route /
app.get("/", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "l4.html"));
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});