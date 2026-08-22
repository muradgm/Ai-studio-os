import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const sourceRoot = path.join(repoRoot, 'artifacts', 'du-bonheur', 'counter-ritual-conversation-typography-refinement-v2', 'source-html');

const entries = (await fs.readdir(sourceRoot)).filter((name) => /language-(en|de|fr)\.html$/.test(name)).sort();
if (entries.length !== 6) throw new Error(`Expected 6 multilingual finalist sources, found ${entries.length}`);

function intersects(a, b, tolerance = 2) {
  return a.left < b.right - tolerance && a.right > b.left + tolerance && a.top < b.bottom - tolerance && a.bottom > b.top + tolerance;
}

const browser = await chromium.launch({ headless:true });
const evidence = [];
try {
  for (const entry of entries) {
    const page = await browser.newPage({ viewport:{ width:1440, height:900 }, deviceScaleFactor:1 });
    await page.goto(pathToFileURL(path.join(sourceRoot, entry)).href, { waitUntil:'networkidle', timeout:45000 });
    const result = await page.evaluate(async () => {
      const proof = window.__typeProof;
      await Promise.all([
        document.fonts.load(`600 64px "${proof.display}"`),
        document.fonts.load(`400 16px "${proof.body}"`)
      ]);
      await document.fonts.ready;
      const displayEl = document.querySelector('#display-test');
      const utilityEl = document.querySelector('#utility-test');
      const toObject = (rect) => rect ? ({ left:rect.left, right:rect.right, top:rect.top, bottom:rect.bottom, width:rect.width, height:rect.height }) : null;
      const glyphRects = [];
      if (displayEl) {
        const range = document.createRange();
        range.selectNodeContents(displayEl);
        for (const rect of range.getClientRects()) {
          if (rect.width > 1 && rect.height > 1) glyphRects.push(toObject(rect));
        }
      }
      return {
        entry:location.pathname.split('/').pop(),
        finalist:proof.finalist,
        scene:proof.scene,
        glyphRects,
        utility:toObject(utilityEl?.getBoundingClientRect?.() ?? null)
      };
    });
    await page.close();
    if (!result.glyphRects.length || !result.utility) throw new Error(`Missing collision targets: ${JSON.stringify(result)}`);
    result.intersectingGlyphRects = result.glyphRects.filter((rect) => intersects(rect, result.utility));
    result.intersects = result.intersectingGlyphRects.length > 0;
    evidence.push(result);
  }
} finally {
  await browser.close();
}

const collisions = evidence.filter((item) => item.intersects);
await fs.writeFile(path.join(path.dirname(sourceRoot), 'collision-evidence.json'), JSON.stringify({ pass:collisions.length === 0, evidence, collisions }, null, 2));
if (collisions.length) throw new Error(`Typography finalist collision gate failed: ${JSON.stringify(collisions)}`);
console.log(`Typography finalist collision gate passed: ${evidence.length} multilingual frames, 0 rendered-glyph/utility collisions.`);
