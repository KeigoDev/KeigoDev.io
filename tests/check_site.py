"""Security checks for the site. Run from the repo root: python3 tests/check_site.py
Add --history to also scan every past commit for leaked keys.
Add --fix after editing an inline <script> to refresh that page's CSP hashes."""
import base64, hashlib, re, subprocess, sys

PAGES = ['index.html', '404.html',
         'projects/ap-reporting-agent-flow/index.html',
         'projects/food-affordability/index.html']
SECRETS = {
    'AWS key': r'AKIA[0-9A-Z]{16}',
    'private key': r'-----BEGIN [A-Z ]*PRIVATE KEY-----',
    'GitHub token': r'gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}',
    'OpenAI/Anthropic key': r'sk-(ant-)?[A-Za-z0-9_-]{32,}',
    'Google API key': r'AIza[0-9A-Za-z_-]{35}',
    'Slack token': r'xox[abprs]-[A-Za-z0-9-]{10,}',
    'hard-coded password': r'(?i)passw(or)?d\s*[:=]\s*["\'][^"\']{4,}["\']',
}
fails = []

def tracked():
    return subprocess.run(['git', 'ls-files'], capture_output=True, text=True).stdout.split()

for page in PAGES:
    html = open(page, encoding='utf-8').read()
    csp = re.search(r'http-equiv="Content-Security-Policy" content="([^"]+)"', html)
    if not csp:
        fails.append(f'{page}: no Content-Security-Policy meta tag')
        continue
    hashes = ["'sha256-%s'" % base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()
              for attrs, body in re.findall(r'<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>', html, re.S)
              if 'ld+json' not in attrs]
    if '--fix' in sys.argv:
        policy = re.sub(r" 'sha256-[^']+'", '', csp.group(1)).replace(
            "script-src 'self'", ' '.join(["script-src 'self'"] + hashes) if hashes else "script-src 'self'", 1)
        html = html.replace(csp.group(1), policy)
        open(page, 'w', encoding='utf-8').write(html)
        csp = re.search(r'http-equiv="Content-Security-Policy" content="([^"]+)"', html)
    for h in hashes:
        if h not in csp.group(1):
            fails.append(f'{page}: an inline script changed, so its CSP hash is stale. Run with --fix')
    for tag in re.findall(r'<script[^>]*src="https?://[^>]*>', html):
        if 'integrity=' not in tag:
            fails.append(f'{page}: CDN script without integrity hash: {tag[:80]}')

for f in tracked():
    if not f.endswith(('.html', '.js', '.css', '.json', '.md', '.txt', '.xml', '.py', '.yml')):
        continue
    text = open(f, encoding='utf-8', errors='ignore').read()
    for name, pat in SECRETS.items():
        if re.search(pat, text):
            fails.append(f'{f}: looks like a {name}')
    if f.startswith('js/') and 'vendor' not in f and re.search(r'\bdebugger\b|console\.(log|debug)\(', text):
        fails.append(f'{f}: leftover debugging code')

if '--history' in sys.argv:
    log = subprocess.run(['git', 'log', '-p', '--all', '--no-color', '-U0'],
                         capture_output=True, text=True, errors='ignore').stdout
    for name, pat in SECRETS.items():
        if re.search(pat, log):
            fails.append(f'git history: a past commit contains something like a {name}')

print('\n'.join(fails) or 'All security checks passed.')
sys.exit(1 if fails else 0)
