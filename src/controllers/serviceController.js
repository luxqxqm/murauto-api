import { Service, SERVICE_CATEGORIES } from '../models/service.js';

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
  const { name, category } = req.body;

  if (await Service.exists({ name, category })) {
    return res
      .status(409)
      .json({ message: 'Послуга з такою назвою вже є в цій категорії' });
  }

  const service = await Service.create(req.body);
  res.status(201).json(service);
};
