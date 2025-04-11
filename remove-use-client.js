import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the directories to search
const directories = [
  path.join(__dirname, 'src/components'),
  path.join(__dirname, 'src/pages')
];

// Function to remove "use client" directive from a file
async function removeUseClientDirective(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Check if the file starts with "use client"
    if (content.trim().startsWith('"use client"') || content.trim().startsWith("'use client'")) {
      // Remove the "use client" directive and any empty lines that follow
      content = content.replace(/["']use client["'](\r?\n)+/, '');
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Removed "use client" from ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

// Function to recursively process all .tsx and .ts files in a directory
async function processDirectory(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        await removeUseClientDirective(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${directory}:`, error);
  }
}

// Main function
async function main() {
  console.log('🔍 Starting to remove "use client" directives...');
  
  let modifiedCount = 0;
  
  for (const directory of directories) {
    console.log(`📁 Processing directory: ${directory}`);
    await processDirectory(directory);
  }
  
  console.log('✨ Finished processing all files!');
}

main().catch(console.error);