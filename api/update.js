export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, content } = req.body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo  = 'Work-Healthy-Australia/meal-planner-prototype';
  const path  = 'content.json';
  const apiBase = `https://api.github.com/repos/${repo}/contents/${path}`;

  // Fetch current file SHA (required by GitHub API to update a file)
  const getRes = await fetch(apiBase, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!getRes.ok) {
    return res.status(500).json({ error: 'Could not fetch current file from GitHub' });
  }

  const { sha } = await getRes.json();

  // Validate content shape before saving
  const required = ['about', 'story', 'testimonials'];
  for (const key of required) {
    if (!content[key]) {
      return res.status(400).json({ error: `Missing required section: ${key}` });
    }
  }

  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Update site content via admin panel',
      content: encoded,
      sha,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    return res.status(500).json({ error: 'GitHub update failed', detail: err.message });
  }

  return res.status(200).json({ ok: true, message: 'Saved! Your site will update in about 30 seconds.' });
}
