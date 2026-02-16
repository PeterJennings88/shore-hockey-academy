const crypto = require('crypto');
const path = require('path');
const express = require('express');

const app = express();
const PORT = Number(process.env.PORT || 3000);

const SITE_URL = process.env.SITE_URL || 'https://shorehockeyacademy.com';
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 8);

const AIRTABLE_CAMP_TABLE = process.env.AIRTABLE_CAMP_TABLE || 'Camp Leads';
const AIRTABLE_BUSINESS_TABLE = process.env.AIRTABLE_BUSINESS_TABLE || 'Business Leads';

const rateLimitStore = new Map();

app.disable('x-powered-by');
app.use(express.json({ limit: '250kb' }));
app.use(express.urlencoded({ extended: false }));

function nowIso() {
  return new Date().toISOString();
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function cleanupRateLimit(ip, timestamp) {
  const entry = rateLimitStore.get(ip);
  if (!entry) {
    return [];
  }
  const valid = entry.filter((time) => timestamp - time < RATE_LIMIT_WINDOW_MS);
  if (valid.length > 0) {
    rateLimitStore.set(ip, valid);
  } else {
    rateLimitStore.delete(ip);
  }
  return valid;
}

function isRateLimited(ip) {
  const timestamp = Date.now();
  const valid = cleanupRateLimit(ip, timestamp);
  if (valid.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  valid.push(timestamp);
  rateLimitStore.set(ip, valid);
  return false;
}

function cleanString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function cleanOptional(value) {
  const normalized = cleanString(value);
  return normalized.length > 0 ? normalized : '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 10;
}

function appError(code, message, status = 400, field) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  if (field) {
    error.field = field;
  }
  return error;
}

function requireValue(value, field, message) {
  if (!value) {
    throw appError('VALIDATION_ERROR', message, 400, field);
  }
}

function getCampaignData(body) {
  return {
    utm_source: cleanOptional(body.utm_source),
    utm_medium: cleanOptional(body.utm_medium),
    utm_campaign: cleanOptional(body.utm_campaign)
  };
}

function validateHoneypot(body) {
  const company = cleanOptional(body.company);
  if (company) {
    throw appError('SPAM_DETECTED', 'Submission rejected.', 400, 'company');
  }
}

function validateConsent(body) {
  const consentPolicy = cleanOptional(body.consentPolicy).toLowerCase();
  if (consentPolicy !== 'yes') {
    throw appError(
      'VALIDATION_ERROR',
      'You must agree to the Privacy Policy and Terms to submit.',
      400,
      'consentPolicy'
    );
  }
  return 'yes';
}

function validateCampLead(body) {
  validateHoneypot(body);
  const playerName = cleanOptional(body.playerName);
  const playerAgeRaw = cleanOptional(body.playerAge);
  const skillLevel = cleanOptional(body.skillLevel);
  const sessionOrProgram = cleanOptional(body.sessionOrProgram || body.program || body.session);
  const parentName = cleanOptional(body.parentName);
  const email = cleanOptional(body.email);
  const phone = cleanOptional(body.phone);
  const message = cleanOptional(body.message);
  const sourcePage = cleanOptional(body.sourcePage) || '/';

  requireValue(playerName, 'playerName', 'Player name is required.');
  requireValue(playerAgeRaw, 'playerAge', 'Player age is required.');
  requireValue(skillLevel, 'skillLevel', 'Skill level is required.');
  requireValue(sessionOrProgram, 'sessionOrProgram', 'Program or session selection is required.');
  requireValue(parentName, 'parentName', 'Parent or guardian name is required.');
  requireValue(email, 'email', 'Email is required.');
  requireValue(phone, 'phone', 'Phone number is required.');

  const playerAge = Number(playerAgeRaw);
  if (!Number.isFinite(playerAge) || playerAge < 5 || playerAge > 20) {
    throw appError('VALIDATION_ERROR', 'Player age must be between 5 and 20.', 400, 'playerAge');
  }

  if (!isValidEmail(email)) {
    throw appError('VALIDATION_ERROR', 'Enter a valid email address.', 400, 'email');
  }

  if (!isValidPhone(phone)) {
    throw appError('VALIDATION_ERROR', 'Enter a valid phone number.', 400, 'phone');
  }

  const allowedSkillLevels = new Set(['beginner', 'intermediate', 'advanced', 'elite']);
  if (!allowedSkillLevels.has(skillLevel)) {
    throw appError('VALIDATION_ERROR', 'Select a valid skill level.', 400, 'skillLevel');
  }

  const consentPolicy = validateConsent(body);

  return {
    sourcePage,
    playerName,
    playerAge,
    skillLevel,
    sessionOrProgram,
    parentName,
    email,
    phone,
    message,
    consentPolicy,
    ...getCampaignData(body)
  };
}

function validateBusinessLead(body) {
  validateHoneypot(body);

  const name = cleanOptional(body.name);
  const email = cleanOptional(body.email);
  const phone = cleanOptional(body.phone);
  const playerInfo = cleanOptional(body.playerInfo);
  const interest = cleanOptional(body.interest);
  const message = cleanOptional(body.message);
  const sourcePage = cleanOptional(body.sourcePage) || '/';
  const calendlyClicked = cleanOptional(body.calendlyClicked).toLowerCase() === 'yes' ? 'yes' : 'no';

  requireValue(name, 'name', 'Name is required.');
  requireValue(email, 'email', 'Email is required.');
  requireValue(interest, 'interest', 'Area of interest is required.');

  if (!isValidEmail(email)) {
    throw appError('VALIDATION_ERROR', 'Enter a valid email address.', 400, 'email');
  }

  if (phone && !isValidPhone(phone)) {
    throw appError('VALIDATION_ERROR', 'Enter a valid phone number.', 400, 'phone');
  }

  const consentPolicy = validateConsent(body);

  return {
    sourcePage,
    name,
    email,
    phone,
    playerInfo,
    interest,
    message,
    calendlyClicked,
    consentPolicy,
    ...getCampaignData(body)
  };
}

async function writeToAirtable(table, fields) {
  const apiKey = cleanOptional(process.env.AIRTABLE_API_KEY);
  const baseId = cleanOptional(process.env.AIRTABLE_BASE_ID);

  if (!apiKey || !baseId) {
    throw appError('CONFIG_ERROR', 'Airtable configuration is missing.', 500);
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{ fields }]
      })
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw appError(
      'AIRTABLE_ERROR',
      data?.error?.message || 'Failed to store lead in Airtable.',
      502
    );
  }

  return data?.records?.[0]?.id || '';
}

async function sendNotificationEmail({ subject, html, text }) {
  const provider = cleanOptional(process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
  if (provider === 'none') {
    return;
  }

  if (provider !== 'resend') {
    throw appError('CONFIG_ERROR', `Unsupported email provider: ${provider}`, 500);
  }

  const apiKey = cleanOptional(process.env.RESEND_API_KEY);
  const to = cleanOptional(process.env.NOTIFICATION_EMAIL_TO);
  const from = cleanOptional(process.env.NOTIFICATION_EMAIL_FROM);

  if (!apiKey || !to || !from) {
    throw appError('CONFIG_ERROR', 'Resend email configuration is missing.', 500);
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw appError(
      'EMAIL_ERROR',
      data?.message || 'Failed to send notification email.',
      502
    );
  }
}

function formatPairs(fields) {
  return Object.entries(fields)
    .map(([key, value]) => `${key}: ${value || ''}`)
    .join('\n');
}

function htmlPairs(fields) {
  return Object.entries(fields)
    .map(([key, value]) => `<tr><td style="padding:6px 10px;font-weight:700;border:1px solid #ddd;">${key}</td><td style="padding:6px 10px;border:1px solid #ddd;">${String(value || '')}</td></tr>`)
    .join('');
}

function handleError(res, error, requestId) {
  const status = error.status || 500;
  const code = error.code || 'INTERNAL_ERROR';

  console.error(`[${requestId}]`, error);

  return res.status(status).json({
    ok: false,
    code,
    message: error.message || 'Unexpected server error.',
    ...(error.field ? { field: error.field } : {})
  });
}

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, timestamp: nowIso() });
});

app.post('/api/leads/camp', async (req, res) => {
  const requestId = crypto.randomUUID();
  const ip = clientIp(req);

  try {
    if (isRateLimited(ip)) {
      throw appError('RATE_LIMITED', 'Too many requests. Please try again shortly.', 429);
    }

    const lead = validateCampLead(req.body || {});

    const fields = {
      timestamp: nowIso(),
      source_page: lead.sourcePage,
      player_name: lead.playerName,
      player_age: lead.playerAge,
      skill_level: lead.skillLevel,
      session_or_program: lead.sessionOrProgram,
      parent_name: lead.parentName,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      consent_policy: lead.consentPolicy
    };

    const airtableId = await writeToAirtable(AIRTABLE_CAMP_TABLE, fields);

    await sendNotificationEmail({
      subject: 'New Camp Lead - Shore Hockey Academy',
      text: formatPairs(fields),
      html: `<h2>New Camp Lead</h2><p>Request ID: ${requestId}</p><table style="border-collapse:collapse;">${htmlPairs(fields)}</table>`
    });

    res.json({
      ok: true,
      message: 'Thanks, your camp inquiry was submitted successfully.',
      id: airtableId || requestId
    });
  } catch (error) {
    handleError(res, error, requestId);
  }
});

app.post('/api/leads/business', async (req, res) => {
  const requestId = crypto.randomUUID();
  const ip = clientIp(req);

  try {
    if (isRateLimited(ip)) {
      throw appError('RATE_LIMITED', 'Too many requests. Please try again shortly.', 429);
    }

    const lead = validateBusinessLead(req.body || {});

    const fields = {
      timestamp: nowIso(),
      source_page: lead.sourcePage,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      player_info: lead.playerInfo,
      interest: lead.interest,
      message: lead.message,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      calendly_clicked: lead.calendlyClicked,
      consent_policy: lead.consentPolicy
    };

    const airtableId = await writeToAirtable(AIRTABLE_BUSINESS_TABLE, fields);

    await sendNotificationEmail({
      subject: 'New Business Lead - Shore Hockey Academy',
      text: formatPairs(fields),
      html: `<h2>New Business Lead</h2><p>Request ID: ${requestId}</p><table style="border-collapse:collapse;">${htmlPairs(fields)}</table>`
    });

    res.json({
      ok: true,
      message: 'Thanks, your inquiry was submitted successfully.',
      id: airtableId || requestId
    });
  } catch (error) {
    handleError(res, error, requestId);
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'API route not found.' });
});

app.use(
  express.static(path.join(__dirname), {
    index: ['index.html'],
    extensions: ['html']
  })
);

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'API route not found.' });
  }
  return res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Shore Hockey Academy server running on port ${PORT}`);
  console.log(`Site URL: ${SITE_URL}`);
});
