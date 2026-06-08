const fs = require('fs');
const content = fs.readFileSync('C:/Users/Jakkrapongp/.gemini/antigravity/brain/e988a2c1-45da-4014-9c43-2aa1ff049d5f/.system_generated/steps/152/content.md', 'utf8');
const match = content.match(/"scriptSource":"(.*?)"/);
if(match) {
    console.log(match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
} else {
    console.log("No scriptSource found");
}
