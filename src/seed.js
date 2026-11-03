import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { mongoConnect } from './db/mongoConnect.js';
import { Service } from './models/service.js';
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

// Approximate starting price list, the owner edits it in the admin panel
const BASE_SERVICES = [
  {
    category: 'Шиномонтаж',
    name: 'Шиномонтаж R13–R15 (4 колеса)',
    price: 600,
    durationMin: 60,
  },
  {
    category: 'Шиномонтаж',
    name: 'Шиномонтаж R16–R18 (4 колеса)',
    price: 800,
    durationMin: 60,
  },
  {
    category: 'Шиномонтаж',
    name: 'Балансування колеса',
    price: 100,
    durationMin: 30,
  },
  {
    category: 'Шиномонтаж',
    name: 'Ремонт проколу',
    price: 150,
    isPriceFrom: true,
    durationMin: 30,
  },
  {
    category: 'Ремонт',
    name: 'Заміна гальмівних колодок (вісь)',
    price: 500,
    isPriceFrom: true,
    durationMin: 60,
  },
  {
    category: 'Ремонт',
    name: 'Заміна амортизатора',
    price: 600,
    isPriceFrom: true,
    durationMin: 60,
  },
  {
    category: 'Ремонт',
    name: 'Заміна ременя ГРМ',
    price: 2000,
    isPriceFrom: true,
    durationMin: 180,
  },
  {
    category: 'Технічне обслуговування',
    name: 'Заміна масла двигуна',
    price: 300,
    isPriceFrom: true,
    durationMin: 30,
  },
  {
    category: 'Технічне обслуговування',
    name: 'Заміна повітряного фільтра',
    price: 100,
    durationMin: 30,
  },
  {
    category: 'Діагностика',
    name: "Комп'ютерна діагностика",
    price: 400,
    durationMin: 30,
  },
  {
    category: 'Діагностика',
    name: 'Діагностика ходової',
    price: 300,
    durationMin: 30,
  },
];

const seedServices = async () => {
  let created = 0;

  for (const [index, service] of BASE_SERVICES.entries()) {
    // $setOnInsert: create if missing, never overwrite the owner's changes
    const result = await Service.updateOne(
      { category: service.category, name: service.name },
      { $setOnInsert: { ...service, sortOrder: index } },
      { upsert: true },
    );
    created += result.upsertedCount;
  }

  console.log(
    `Services: ${created} created, ${BASE_SERVICES.length - created} already existed`,
  );
};

await mongoConnect();

try {
  await seedAdmin();
  await seedServices();
} catch (err) {
  console.error('Seed error:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
