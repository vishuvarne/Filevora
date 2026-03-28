const fs = require('fs');
const path = require('path');

const files = [
    'app/[lang]/signup/page.tsx', 
    'app/[lang]/profile/page.tsx', 
    'app/[lang]/privacy/page.tsx', 
    'app/[lang]/page.tsx', 
    'app/[lang]/not-found.tsx', 
    'app/[lang]/login/page.tsx', 
    'app/[lang]/help/page.tsx', 
    'app/[lang]/donate/page.tsx', 
    'app/[lang]/contact/page.tsx', 
    'app/[lang]/blog/page.tsx', 
    'app/[lang]/about/page.tsx'
];

files.forEach(f => { 
    const p = path.join('c:/Users/dear_/OneDrive/Desktop/filevora/frontend', f); 
    if(fs.existsSync(p)) {
        let c = fs.readFileSync(p, 'utf8'); 
        c = c.replace(/import Link from 'next\/link';/g, "import Link from '@/components/LocalizedLink';"); 
        c = c.replace(/import Link from \"next\/link\";/g, "import Link from '@/components/LocalizedLink';"); 
        fs.writeFileSync(p, c); 
        console.log('Replaced ' + f); 
    }
});
