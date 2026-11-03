import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { mongoConnect } from './db/mongoConnect.js';
import { User } from './models/user.js';
import { adminSchema } from './validations/authValidation.js';

const seedAdmin = async () => {
  const result = adminSchema.safeParse({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });

  if (!result.success) {
    throw new Error(
      'ADMIN_EMAIL or ADMIN_PASSWORD in .env is invalid (password: 8–64 chars, at least 1 letter and 1 digit)',
    );
  }

  const { email, password } = result.data;

  // Re-running the seed must not create a duplicate
  if (await User.exists({ email })) {
    console.log(`Admin ${email} already exists, skipped`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ email, passwordHash, name: 'Адміністратор' });
  console.log(`Admin ${email} created`);
};

await mongoConnect();

try {
  await seedAdmin();
} catch (err) {
  console.error('Seed error:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
