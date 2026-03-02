const fs = require('fs');
const path = require('path');

const optionsList = [
    // Layout components
    { from: /from ['"]@\/components\/Navbar['"]/g, to: 'from "@/components/layout/Navbar"' },
    { from: /from ['"]@\/components\/Footer['"]/g, to: 'from "@/components/layout/Footer"' },
    { from: /from ['"]@\/components\/Sidebar['"]/g, to: 'from "@/components/layout/Sidebar"' },
    { from: /from ['"]@\/components\/MegaMenu['"]/g, to: 'from "@/components/layout/MegaMenu"' },
    { from: /import Navbar from ['"]\.\.\/components\/Navbar['"]/g, to: 'import Navbar from "../components/layout/Navbar"' },
    { from: /import Footer from ['"]\.\.\/components\/Footer['"]/g, to: 'import Footer from "../components/layout/Footer"' },
    { from: /from ['"]\.\.\/\.\.\/components\/Navbar['"]/g, to: 'from "../../components/layout/Navbar"' },
    { from: /from ['"]\.\.\/\.\.\/components\/Footer['"]/g, to: 'from "../../components/layout/Footer"' },
    { from: /from ['"]\.\.\/\.\.\/components\/Sidebar['"]/g, to: 'from "../../components/layout/Sidebar"' },

    // UI components
    { from: /from ['"]@\/components\/Breadcrumbs['"]/g, to: 'from "@/components/ui/Breadcrumbs"' },
    { from: /from ['"]@\/components\/Dropzone['"]/g, to: 'from "@/components/ui/Dropzone"' },
    { from: /from ['"]@\/components\/ProgressBar['"]/g, to: 'from "@/components/ui/ProgressBar"' },
    { from: /from ['"]@\/components\/ThemeToggle['"]/g, to: 'from "@/components/ui/ThemeToggle"' },
    { from: /from ['"]@\/components\/SkeletonLoader['"]/g, to: 'from "@/components/ui/SkeletonLoader"' },
    { from: /from ['"]@\/components\/TypewriterEffect['"]/g, to: 'from "@/components/ui/TypewriterEffect"' },
    { from: /from ['"]@\/components\/RangeSlider['"]/g, to: 'from "@/components/ui/RangeSlider"' },
    { from: /import Dropzone from ['"]\.\.\/Dropzone['"]/g, to: 'import Dropzone from "../ui/Dropzone"' },
    { from: /import ProgressBar from ['"]\.\.\/ProgressBar['"]/g, to: 'import ProgressBar from "../ui/ProgressBar"' },
    { from: /from ['"]\.\.\/\.\.\/components\/Dropzone['"]/g, to: 'from "../../components/ui/Dropzone"' }
];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            for (const { from, to } of optionsList) {
                if (content.match(from)) {
                    content = content.replace(from, to);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

// target directories
const directories = [
    path.join(__dirname, '../app'),
    path.join(__dirname, '../components')
];

for (const dir of directories) {
    processDirectory(dir);
}
