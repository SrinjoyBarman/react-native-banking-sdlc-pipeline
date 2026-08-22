const fs = require('fs');
const inPath = process.argv[2];
const outPath = process.argv[3] || (inPath && inPath.replace(/npm-audit-summary.json$/, 'finding-summary.json'));
try {
  if (!inPath || !fs.existsSync(inPath)) {
    console.log(JSON.stringify({ error: 'no-audit-file' }));
    process.exit(0);
  }
  const raw = fs.readFileSync(inPath, 'utf8').trim();
  if (!raw) { console.log(JSON.stringify({ error: 'empty-audit-file' })); process.exit(0); }
  const data = JSON.parse(raw);
  const vulns = [];
  // npm v6-style: advisories
  if (data.advisories && typeof data.advisories === 'object') {
    for (const id of Object.keys(data.advisories)) {
      const a = data.advisories[id];
      const sev = (a.severity || '').toLowerCase();
      if (sev === 'critical' || sev === 'high') {
        const findings = Array.isArray(a.findings) ? a.findings : [];
        const devOnly = findings.length > 0 && findings.every(f => f.dev === true);
        const fixAvailable = !!(a.fix_available || a.fix && (a.fix.version || a.fix.available));
        vulns.push({ name: a.module_name || a.module_name, severity: sev, via: a.title || a.overview || '', range: a.vulnerable_versions || '', fixAvailable, production: !devOnly });
      }
    }
  }
  // npm newer format: vulnerabilities map
  if (data.vulnerabilities && typeof data.vulnerabilities === 'object') {
    for (const name of Object.keys(data.vulnerabilities)) {
      const v = data.vulnerabilities[name];
      const sev = (v.severity || '').toLowerCase();
      if (sev === 'critical' || sev === 'high') {
        let prod = true;
        if (typeof v.dev === 'boolean') prod = !v.dev;
        else if (Array.isArray(v.findings) && v.findings.length) prod = v.findings.some(f => !f.dev);
        const fixAvailable = !!(v.fixAvailable || (v.fix && v.fix[0]));
        vulns.push({ name: v.name || name, severity: sev, via: (v.via && (Array.isArray(v.via)?v.via[0]:v.via)) || '', range: v.range || '', fixAvailable, production: prod });
      }
    }
  }
  // fallback: scan top-level advisories-like arrays
  if (!vulns.length && data.advisories && Array.isArray(data.advisories)) {
    for (const a of data.advisories) {
      const sev = (a.severity || '').toLowerCase();
      if (sev === 'critical' || sev === 'high') {
        const findings = Array.isArray(a.findings) ? a.findings : [];
        const devOnly = findings.length > 0 && findings.every(f => f.dev === true);
        const fixAvailable = !!(a.fix_available || a.fix && (a.fix.version || a.fix.available));
        vulns.push({ name: a.module_name || a.name, severity: sev, via: a.title || '', range: a.vulnerable_versions || '', fixAvailable, production: !devOnly });
      }
    }
  }
  const criticalHighProd = vulns.filter(v => v.production && (v.severity === 'critical' || v.severity === 'high'));
  const anyFixAvailable = vulns.some(v => v.fixAvailable);
  const summary = { totalCriticalHigh: vulns.length, criticalHighProdCount: criticalHighProd.length, anyFixAvailable, vulnerabilities: vulns };
  try { fs.writeFileSync(outPath, JSON.stringify(summary, null, 2)); } catch(e) {}
  console.log(JSON.stringify(summary));
} catch (e) {
  console.log(JSON.stringify({ error: 'exception', message: e.message }));
}
