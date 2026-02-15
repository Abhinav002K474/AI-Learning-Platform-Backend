const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

const STUDY_DIR = path.join(__dirname, "../uploads/study-materials");

let materialIndex = [];

// Helper to recursively find all PDF files
function getAllPdfFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;

    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllPdfFiles(fullPath, arrayOfFiles);
        } else if (file.toLowerCase().endsWith(".pdf")) {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

// Function to chunk text with overlap
function chunkText(text, size = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + size, text.length);
        const chunk = text.slice(start, end);
        chunks.push(chunk);
        start += (size - overlap);
        if (start >= text.length) break;
    }
    return chunks;
}

async function buildIndex() {
    console.log("🔄 Building RAG Index from:", STUDY_DIR);
    materialIndex = [];

    try {
        if (!fs.existsSync(STUDY_DIR)) {
            console.log("⚠️ Study Materials directory not found.");
            return;
        }

        const files = getAllPdfFiles(STUDY_DIR);

        for (const filePath of files) {
            // FIX 1: Explicit Log
            console.log("Indexed file:", filePath);

            try {
                const buffer = fs.readFileSync(filePath);
                const data = await pdf(buffer);

                // FIX 4: Normalize Text
                let rawText = data.text || "";

                // Normalization: 
                // 1. Replace multiple spaces/newlines with single space
                // 2. Remove non-alphanumeric chars except basic punctuation (optional, user requested simpler set)
                // User regex: /[^a-zA-Z0-9.,()– ]/g
                // We will be slightly lenient to include common text chars but normalize widely.
                const normalized = rawText
                    .replace(/\s+/g, " ") // Collapse whitespace
                    .replace(/[^a-zA-Z0-9.,()–\-\? ]/g, "") // Remove weird symbols but keep sentence punctuation
                    .trim();

                // FIX 3: Increase Chunk Size & Overlap
                const chunks = chunkText(normalized, 1000, 200);

                chunks.forEach(chunk => {
                    if (chunk.length > 50) { // Filter extremely short chunks
                        materialIndex.push({
                            source: path.basename(filePath),
                            text: chunk
                        });
                    }
                });

            } catch (fileErr) {
                console.error(`❌ Error parsing ${path.basename(filePath)}:`, fileErr.message);
            }
        }

        console.log("📚 RAG Index built successfully. Total text chunks:", materialIndex.length);
    } catch (err) {
        console.error("❌ RAG Build Failed:", err);
    }
}

function searchIndex(query) {
    if (!query) return [];

    // Normalize query to match index
    const normalizedQuery = query.toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .trim();

    // FIX 2: Fuzzy/Keyword Search
    const keywords = normalizedQuery.split(/\s+/).filter(k => k.length > 2);

    if (keywords.length === 0) return [];

    const results = materialIndex.map(item => {
        let matches = 0;
        const itemLower = item.text.toLowerCase();

        keywords.forEach(k => {
            if (itemLower.includes(k)) matches++;
        });

        return { ...item, matches };
    });

    // Sort by relevance
    return results
        .filter(item => item.matches > 0)
        .sort((a, b) => b.matches - a.matches)
        .slice(0, 5); // Return top 5 relevant chunks
}

module.exports = { buildIndex, searchIndex };
