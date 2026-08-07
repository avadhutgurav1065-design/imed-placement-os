const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(process.cwd(), 'app'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('from "@supabase/supabase-js"')) {
    content = content.replace(
      /import\s+{\s*createClient\s*}\s+from\s+["']@supabase\/supabase-js["'];?/g,
      'import { createClient } from "@/lib/supabase/client";'
    );
    changed = true;
  }

  // Remove process.env args from createClient()
  const regex = /const\s+supabase\s*=\s*createClient\s*\(\s*(?:process\.env\.NEXT_PUBLIC_SUPABASE_URL!|supabaseUrl)\s*,\s*(?:process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!|supabaseKey)\s*\);?/g;
  if (regex.test(content)) {
    content = content.replace(regex, 'const supabase = createClient();');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
