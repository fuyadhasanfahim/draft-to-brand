// Generates a bcrypt hash for the admin password.
//
// Usage:
//   node scripts/hash-password.mjs "your-plain-password"
//   node scripts/hash-password.mjs            # prompts for the password
//
// Copy the printed hash into ADMIN_PASSWORD_HASH in your .env file.

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import bcrypt from 'bcryptjs';

const ROUNDS = 12;

async function readPassword() {
    const fromArg = process.argv[2];
    if (fromArg) return fromArg;

    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question('Password to hash: ');
    rl.close();
    return answer;
}

const password = (await readPassword()).trim();

if (!password) {
    console.error('No password provided.');
    process.exit(1);
}

if (password.length < 8) {
    console.error('Use at least 8 characters.');
    process.exit(1);
}

const hash = await bcrypt.hash(password, ROUNDS);

console.log('\nADMIN_PASSWORD_HASH=' + JSON.stringify(hash) + '\n');
