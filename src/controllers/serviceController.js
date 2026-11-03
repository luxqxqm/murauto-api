import { Service, SERVICE_CATEGORIES } from '../models/service.js';
import { getSettings } from '../models/settings.js';

const NOT_FOUND = { message: 'Послугу не знайдено' };
const DUPLICATE = { message: 'Послуга з такою назвою вже є в цій категорії' };

// The slot step lives in Settings, so Zod can't check this rule
const fitsSlotStep = async (durationMin) => {
  const { slotStepMin } = await getSettings();
  return durationMin % slotStepMin === 0;
};

// Same shape as validate() errors
const DURATION_ERROR = {
  message: 'Перевірте введені дані',
  errors: [{ field: 'durationMin', message: 'Вкажіть тривалість у хвилинах' }],
};

export const getServices = async (req, res) => {
  const services = await Service.find({ isActive: true })
    .select('name category price isPriceFrom durationMin')
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // [{ category, services: [...] }], empty categories are not shown
  const groups = SERVICE_CATEGORIES.map((category) => ({
    category,
    services: services.filter((service) => service.category === category),
  })).filter((group) => group.services.length > 0);

  res.status(200).json(groups);
};

export const createService = async (req, res) => {
  const { name, category, durationMin } = req.body;

  if (!(await fitsSlotStep(durationMin))) {
    return res.status(400).json(DURATION_ERROR);
  }

  if (await Service.exists({ name, category })) {
    return res.status(409).json(DUPLICATE);
  }

  const service = await Service.create(req.body);
  res.status(201).json(service);
};

export const updateService = async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    return res.status(404).json(NOT_FOUND);
  }

  // Checked only when sent, so changing just the price never fails because of it
  const { durationMin } = req.body;
  if (durationMin !== undefined && !(await fitsSlotStep(durationMin))) {
    return res.status(400).json(DURATION_ERROR);
  }

  // Only name or category may be sent, so compare against the final values
  const name = req.body.name ?? service.name;
  const category = req.body.category ?? service.category;
  const isDuplicate = await Service.exists({
    name,
    category,
    _id: { $ne: service._id },
  });
  if (isDuplicate) {
    return res.status(409).json(DUPLICATE);
  }

  service.set(req.body);
  await service.save();
  res.status(200).json(service);
};

// No physical delete: old bookings still reference the service
export const deactivateService = async (req, res) => {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { returnDocument: 'after' },
  );
  if (!service) {
    return res.status(404).json(NOT_FOUND);
  }

  res.status(200).json(service);
};
