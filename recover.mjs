import fs from 'fs';
import path from 'path';

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
const dirs = fs.readdirSync(historyDir);
for (const d of dirs) {
    const dPath = path.join(historyDir, d);
    if (!fs.statSync(dPath).isDirectory()) continue;
    
    const entriesPath = path.join(dPath, 'entries.json');
    if (fs.existsSync(entriesPath)) {
        try {
            const data = fs.readFileSync(entriesPath, 'utf8');
            if (data.toLowerCase().includes('ghostroom.ts') || data.toLowerCase().includes('ghoststate.ts')) {
                const parsed = JSON.parse(data);
                const resource = parsed.resource;
                const entries = parsed.entries;
                
                const latestEntry = entries[entries.length - 1];
                const fileToRecover = path.join(dPath, latestEntry.id);
                console.log('FOUND RESOURCE:', resource);
                console.log('LATEST ENTRY ID:', latestEntry.id);
                console.log('RECOVER FILE:', fileToRecover);
            }
        } catch (e) {
            // ignore
        }
    }
}
