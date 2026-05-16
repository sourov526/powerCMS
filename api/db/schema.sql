PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  otp_hash TEXT,
  otp_expires_at TEXT,
  two_factor_enabled INTEGER NOT NULL DEFAULT 0,
  two_factor_otp_hash TEXT,
  two_factor_otp_expires_at TEXT,
  auth_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_otp_expires_at_idx ON users(otp_expires_at);
CREATE INDEX IF NOT EXISTS users_two_factor_otp_expires_at_idx ON users(two_factor_otp_expires_at);

CREATE TABLE IF NOT EXISTS authors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  bio TEXT,
  image TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  intro TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  createdBy INTEGER,
  updatedBy INTEGER,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updatedBy) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  publishedAt TEXT,
  updatedAt TEXT NOT NULL,
  authorId INTEGER,
  categoryId INTEGER,
  createdBy INTEGER,
  updatedBy INTEGER,
  FOREIGN KEY (authorId) REFERENCES authors(id) ON DELETE SET NULL,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updatedBy) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS recruit_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  recruitType TEXT NOT NULL DEFAULT 'job' CHECK (recruitType IN ('job', 'recruit')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  publishedAt TEXT,
  updatedAt TEXT NOT NULL,
  createdBy INTEGER,
  updatedBy INTEGER,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updatedBy) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS recruit_post_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recruitPostId INTEGER NOT NULL,
  department TEXT,
  jobSummary TEXT,
  applicationDeadLine TEXT,
  positionAvailable TEXT,
  jobDescription TEXT,
  requirements TEXT,
  location TEXT,
  workingHours TEXT,
  employmentType TEXT,
  salary TEXT,
  benefits TEXT,
  holidays TEXT,
  externalLink TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (recruitPostId) REFERENCES recruit_posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS recruit_post_sections_recruit_post_idx ON recruit_post_sections(recruitPostId);

CREATE TABLE IF NOT EXISTS redirects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fromSlug TEXT NOT NULL,
  toSlug TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'ja',
  createdAt TEXT NOT NULL,
  UNIQUE (locale, fromSlug)
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL CHECK (provider IN ('local', 's3', 'r2')),
  key TEXT NOT NULL,
  tag TEXT,
  bucket TEXT,
  url TEXT,
  mimeType TEXT,
  size INTEGER,
  width INTEGER,
  height INTEGER,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  createdBy INTEGER,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS media_provider_key_idx ON media(provider, key);
CREATE INDEX IF NOT EXISTS media_tag_idx ON media(tag);

CREATE TABLE IF NOT EXISTS post_locales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  postId INTEGER NOT NULL,
  locale TEXT NOT NULL,
  slug TEXT NOT NULL,
  seoSlug TEXT,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  contentRich TEXT,
  seoTitle TEXT,
  seoDescription TEXT,
  canonical TEXT,
  noindex INTEGER NOT NULL DEFAULT 0,
  ogImageId INTEGER,
  featuredImageId INTEGER,
  featuredImageAlt TEXT,
  featuredImageWidth INTEGER,
  featuredImageHeight INTEGER,
  primaryKeyword TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  faqs TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (locale, slug),
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (ogImageId) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (featuredImageId) REFERENCES media(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS post_locales_post_locale_idx ON post_locales(postId, locale);

CREATE TABLE IF NOT EXISTS post_metrics (
  postId INTEGER PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS post_metrics_views_idx ON post_metrics(views);
CREATE INDEX IF NOT EXISTS post_metrics_clicks_idx ON post_metrics(clicks);

CREATE TABLE IF NOT EXISTS post_metric_daily (
  postId INTEGER NOT NULL,
  day TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (postId, day),
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS post_metric_daily_day_idx ON post_metric_daily(day);

CREATE TABLE IF NOT EXISTS post_attachments (
  postLocaleId INTEGER NOT NULL,
  mediaId INTEGER NOT NULL,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (postLocaleId, mediaId),
  FOREIGN KEY (postLocaleId) REFERENCES post_locales(id) ON DELETE CASCADE,
  FOREIGN KEY (mediaId) REFERENCES media(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS post_attachments_media_idx ON post_attachments(mediaId);

CREATE TABLE IF NOT EXISTS post_locale_drafts (
  postId INTEGER NOT NULL,
  locale TEXT NOT NULL,
  data TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  baseUpdatedAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedBy INTEGER,
  PRIMARY KEY (postId, locale),
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (updatedBy) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS not_found_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  referrer TEXT,
  userAgent TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  companyName TEXT NOT NULL,
  homePage TEXT,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  contactNumber TEXT NOT NULL,
  email TEXT NOT NULL,
  schedule TEXT NOT NULL,
  message TEXT NOT NULL,
  utmTerm TEXT,
  kwid TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  deviceOs TEXT,
  locale TEXT,
  privacyAgreed INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  createdBy INTEGER,
  updatedBy INTEGER,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updatedBy) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS recruit_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  furigana TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'na')),
  birthdate TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  postalCode TEXT NOT NULL,
  address TEXT NOT NULL,
  apartment TEXT,
  resumeMediaId INTEGER,
  workHistoryMediaId INTEGER,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'interview', 'rejected', 'hired')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  createdBy INTEGER,
  updatedBy INTEGER,
  FOREIGN KEY (resumeMediaId) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (workHistoryMediaId) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updatedBy) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS recruit_entries_email_idx ON recruit_entries(email);
CREATE INDEX IF NOT EXISTS recruit_entries_created_at_idx ON recruit_entries(createdAt);
CREATE INDEX IF NOT EXISTS recruit_entries_resume_media_idx ON recruit_entries(resumeMediaId);
CREATE INDEX IF NOT EXISTS recruit_entries_work_history_media_idx ON recruit_entries(workHistoryMediaId);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  metadata TEXT,
  readAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  actorId INTEGER,
  recipientRole TEXT,
  recipientUserId INTEGER,
  FOREIGN KEY (actorId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (recipientUserId) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(readAt);

CREATE TABLE IF NOT EXISTS member_section (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  isActive BOOLEAN NOT NULL DEFAULT false,
  name TEXT NOT NULL,
  subTitle TEXT,
  title TEXT,
  joinDate TEXT,
  department TEXT,
  description TEXT,
  heroImage INTEGER,
  joinedInformationQuestion TEXT,
  joinedInformationAnswer TEXT,
  joinedSectionImage INTEGER,
  decisionMakingQuestion TEXT,
  decisionMakingAnswer TEXT,
  decisionSectionImage INTEGER,
  appealingQuestion TEXT,
  appealingAnswer TEXT,
  appealingSectionImage INTEGER,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (heroImage) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (joinedSectionImage) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (decisionSectionImage) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (appealingSectionImage) REFERENCES media(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS member_section_is_active_idx ON member_section(isActive);

CREATE TABLE IF NOT EXISTS introductory_video (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  titleEn TEXT,
  titleJP TEXT,
  videoType TEXT NOT NULL DEFAULT 'company' CHECK (videoType IN ('company', 'employee')),
  videoFile INTEGER,
  videoLink TEXT,
  thumbnail INTEGER,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (videoFile) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (thumbnail) REFERENCES media(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS introductory_video_video_file_idx ON introductory_video(videoFile);
CREATE INDEX IF NOT EXISTS introductory_video_thumbnail_idx ON introductory_video(thumbnail);
