const ROLE_PATTERNS = [
  { role: 'bass', pattern: /\bbass\b|ベース/i },
  { role: 'drums', pattern: /drum|perc|percussion|kit|ドラム|パーカッション/i },
  { role: 'melody', pattern: /melody|lead|vocal|voice|soprano|メロ|主旋律|ボーカル/i },
  { role: 'chord', pattern: /chord|piano|keys?|keyboard|guitar|pad|comp|コード|ピアノ|ギター|パッド/i },
];

export function inferRoleHint(trackName = '', channels = []) {
  if (channels.length === 1 && channels[0] === 9) return 'drums';

  for (const { role, pattern } of ROLE_PATTERNS) {
    if (pattern.test(trackName)) return role;
  }

  return null;
}
