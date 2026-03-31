import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '../public');
const OUTPUT_FILE = path.join(__dirname, '../src/data/publicImages.json');

function generateManifest() {
  // 1. Read all files in the public directory
  const files = fs.readdirSync(PUBLIC_DIR);
  
  // 2. Filter for image files only
  const images = files.filter(file => /\.(png|jpe?g|svg|webp|gif)$/i.test(file));

  // 3. Set up our categories
  const categories = {
    'Battle Maps': [],
    'Tokens': [],
    'Portraits & Art': []
  };

  // 4. Automatically categorize based on filename conventions
  images.forEach(file => {
    const url = `/${file}`;
    
    // Skip app icons/manifest files
    if (file === 'vite.svg' || file === 'icon.png') return;

    if (file.includes('_enc') || file.includes('map')) {
      categories['Battle Maps'].push(url);
    } else if (file.includes('_bm') || file.includes('token')) {
      categories['Tokens'].push(url);
    } else {
      categories['Portraits & Art'].push(url);
    }
  });

  // 5. Format to match what ImageSelector expects
  const manifest = Object.entries(categories)
    .filter(([_, urls]) => urls.length > 0) // Remove empty categories
    .map(([category, urls]) => ({
      category,
      urls
    }));

  // 6. Ensure the src/data directory exists
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 7. Write the JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`✅ Arkla Image Manifest generated with ${images.length} images.`);
}

generateManifest();