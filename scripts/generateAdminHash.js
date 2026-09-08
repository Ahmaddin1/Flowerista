const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const PASSWORD = 'areejflowerista1122';

(async () => {
  const hash = await bcrypt.hash(PASSWORD, 12);

  const envPath = path.join(__dirname, '..', '.env.local');
  let env = fs.readFileSync(envPath, 'utf8');

  env = env.replace(/^ADMIN_PASSWORD_HASH=.*$/m, `ADMIN_PASSWORD_HASH=${hash}`);
  fs.writeFileSync(envPath, env);

  console.log('Hash saved to .env.local');
})();
