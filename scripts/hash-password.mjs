// Generates the ADMIN_PASSWORD_HASH value for the admin login.
//
// Usage:
//   node scripts/hash-password.mjs "your-plain-password"
//   node scripts/hash-password.mjs            # prompts for the password
//
// It prints a base64-encoded bcrypt hash. Base64 is used so the "$" characters
// in a bcrypt hash survive .env parsing (dotenv would otherwise treat "$2b" as
// a variable reference and blank it out). Copy the printed line into your
// .env / .env.local file.

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
const encoded = Buffer.from(hash, 'utf8').toString('base64');

console.log('\nADMIN_PASSWORD_HASH=' + JSON.stringify(encoded) + '\n');
